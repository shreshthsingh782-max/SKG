import React, { useState } from 'react';
import { Sparkles, Bomb, Diamond, RefreshCw, Trophy, ShieldAlert, Zap, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface MinesGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

type TileState = 'hidden' | 'gem' | 'mine';

// Multiplier calculation for Mines game
function calculateMultiplier(minesCount: number, gemsRevealed: number): number {
  if (gemsRevealed === 0) return 1.0;
  let mult = 1.0;
  for (let i = 0; i < gemsRevealed; i++) {
    const totalTiles = 25 - i;
    const safeTiles = 25 - minesCount - i;
    if (safeTiles <= 0) break;
    mult *= totalTiles / safeTiles;
  }
  // Apply 97.5% RTP house edge
  return parseFloat((mult * 0.975).toFixed(2));
}

export const MinesGame: React.FC<MinesGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [minesCount, setMinesCount] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<TileState[]>(Array(25).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const [lastWonAmount, setLastWonAmount] = useState(0);
  const [history, setHistory] = useState<Array<{ id: string; mult: number; won: boolean; amount: number }>>([
    { id: '1', mult: 2.34, won: true, amount: 117 },
    { id: '2', mult: 1.48, won: true, amount: 74 },
    { id: '3', mult: 0, won: false, amount: 50 },
    { id: '4', mult: 4.82, won: true, amount: 241 },
    { id: '5', mult: 1.15, won: true, amount: 57.5 },
  ]);

  const currentMultiplier = calculateMultiplier(minesCount, revealedCount);
  const nextMultiplier = calculateMultiplier(minesCount, revealedCount + 1);
  const potentialCashout = parseFloat((betAmount * currentMultiplier).toFixed(2));

  const handleStartGame = async () => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (user.balance < betAmount) {
      onOpenWallet();
      return;
    }

    soundEffects.betPlaced();

    try {
      const res = await api.startMines(betAmount, minesCount);
      if (res && res.success) {
        onUpdateBalance(res.newBalance);
        onAddTransaction({
          id: 'tx_mines_' + Date.now(),
          type: 'bet',
          amount: betAmount,
          status: 'completed',
          timestamp: Date.now(),
          title: `Mines Bet (${minesCount} Mines)`,
          description: `Server verified wager ₹${betAmount} on 5x5 Mines grid`,
        });
      } else {
        const newBal = user.balance - betAmount;
        onUpdateBalance(newBal);
      }
    } catch {
      const newBal = user.balance - betAmount;
      onUpdateBalance(newBal);
    }

    setMinePositions([]);
    setGrid(Array(25).fill('hidden'));
    setRevealedCount(0);
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setLastWonAmount(0);
  };

  const handleTileClick = async (index: number) => {
    if (!isPlaying || gameOver || grid[index] !== 'hidden') return;

    try {
      const res = await api.revealMinesTile(index);
      if (res && res.success) {
        if (res.hitMine) {
          soundEffects.lose();
          const newGrid = [...grid];
          newGrid[index] = 'mine';
          if (res.allMines) {
            res.allMines.forEach((mIdx: number) => {
              newGrid[mIdx] = 'mine';
            });
          }
          for (let i = 0; i < 25; i++) {
            if (newGrid[i] === 'hidden') newGrid[i] = 'gem';
          }
          setGrid(newGrid);
          setIsPlaying(false);
          setGameOver(true);
          setGameResult('lost');
          setHistory((prev) => [
            { id: Date.now().toString(), mult: 0, won: false, amount: betAmount },
            ...prev.slice(0, 9),
          ]);
        } else {
          soundEffects.tick();
          const newGrid = [...grid];
          newGrid[index] = 'gem';
          setGrid(newGrid);
          setRevealedCount(res.revealedCount);

          if (res.revealedCount === 25 - minesCount) {
            handleCashout();
          }
        }
        return;
      }
    } catch {
      // Fallback local logic
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || revealedCount === 0 || gameOver) return;

    soundEffects.win();
    soundEffects.coins();
    confetti({ particleCount: 80, spread: 70 });

    try {
      const res = await api.cashoutMines();
      if (res && res.success) {
        onUpdateBalance(res.newBalance);
        setLastWonAmount(res.winAmount);
        setIsPlaying(false);
        setGameOver(true);
        setGameResult('won');

        // Reveal remaining grid
        const newGrid = [...grid];
        if (res.allMines) {
          res.allMines.forEach((mIdx: number) => {
            if (newGrid[mIdx] === 'hidden') newGrid[mIdx] = 'mine';
          });
        }
        for (let i = 0; i < 25; i++) {
          if (newGrid[i] === 'hidden') newGrid[i] = 'gem';
        }
        setGrid(newGrid);

        setHistory((prev) => [
          { id: Date.now().toString(), mult: res.multiplier, won: true, amount: res.winAmount },
          ...prev.slice(0, 9),
        ]);

        onAddTransaction({
          id: 'tx_mines_win_' + Date.now(),
          type: 'win',
          amount: res.winAmount,
          status: 'completed',
          timestamp: Date.now(),
          title: `Mines Cashout (${res.multiplier}X)`,
          description: `Server payout ₹${res.winAmount.toFixed(2)} with ${revealedCount} Gems`,
        });
        return;
      }
    } catch {
      // Fallback
    }

    const winAmount = potentialCashout;
    setLastWonAmount(winAmount);
    setIsPlaying(false);
    setGameOver(true);
    setGameResult('won');
    onUpdateBalance(user.balance + winAmount);
  };

  const handleAutoPick = () => {
    if (!isPlaying || gameOver) return;
    const hiddenIndices = grid
      .map((state, idx) => (state === 'hidden' ? idx : null))
      .filter((v): v is number => v !== null);

    if (hiddenIndices.length > 0) {
      const randIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
      handleTileClick(randIdx);
    }
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Top Banner Card */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#F2D06B] text-[#050505] flex items-center justify-center font-black shadow-md shadow-[#D4AF37]/20">
              <Diamond className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                Mines Pro <span className="text-[10px] text-[#D4AF37] font-mono px-1.5 py-0.2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">Diamond Rush</span>
              </h3>
              <p className="text-[10px] text-[#A0A0A0]">Uncover Diamonds, Avoid Hidden Bombs</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-[#666] font-bold">Max Payout</div>
            <div className="font-mono text-xs font-bold text-[#D4AF37]">Up to 24.8x</div>
          </div>
        </div>

        {/* History Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar relative z-10 border-t border-white/5 pt-2">
          <span className="text-[9px] uppercase tracking-wider text-[#666] font-bold shrink-0">History:</span>
          {history.map((h) => (
            <span
              key={h.id}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                h.won
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {h.won ? `${h.mult.toFixed(2)}x` : '0.00x'}
            </span>
          ))}
        </div>
      </div>

      {/* Main 5x5 Mines Grid Arena */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative">
        {/* Active Stats Header inside arena */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-bold">
              Gems Found: <span className="text-[#D4AF37] font-mono font-bold">{revealedCount}</span> / {25 - minesCount}
            </span>
          </div>
          {isPlaying && (
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-bold">Next: </span>
              <span className="text-emerald-400 font-mono font-bold">{nextMultiplier}x</span>
            </div>
          )}
        </div>

        {/* 5x5 Tiles Matrix */}
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
          {grid.map((state, idx) => {
            const isMine = state === 'mine';
            const isGem = state === 'gem';
            const isHidden = state === 'hidden';

            return (
              <button
                key={idx}
                id={`mines-tile-${idx}`}
                disabled={!isPlaying || gameOver || !isHidden}
                onClick={() => handleTileClick(idx)}
                className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 select-none relative overflow-hidden ${
                  isHidden
                    ? isPlaying
                      ? 'bg-gradient-to-b from-[#1C1C1E] to-[#121214] border border-white/15 hover:border-[#D4AF37] hover:scale-105 active:scale-95 shadow-md shadow-black/40 cursor-pointer'
                      : 'bg-white/5 border border-white/10 opacity-70 cursor-not-allowed'
                    : isGem
                    ? 'bg-gradient-to-tr from-[#0F382E] to-[#195949] border border-emerald-400/60 shadow-lg shadow-emerald-500/20 animate-scaleIn'
                    : 'bg-gradient-to-tr from-[#3D0A0A] to-[#611010] border border-rose-500/80 shadow-lg shadow-rose-500/30 animate-shake'
                }`}
              >
                {isHidden ? (
                  <span className="w-2 h-2 rounded-full bg-white/20"></span>
                ) : isGem ? (
                  <div className="flex flex-col items-center justify-center">
                    <Diamond className="w-6 h-6 text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Bomb className="w-6 h-6 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Win / Loss Overlay Alert */}
        {gameOver && gameResult === 'won' && (
          <div className="mt-3 p-3 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-xl text-center animate-fadeIn">
            <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
              Successfully Cashed Out! (+₹{lastWonAmount.toFixed(2)})
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5 font-mono">
              Multiplier: {currentMultiplier}x
            </div>
          </div>
        )}

        {gameOver && gameResult === 'lost' && (
          <div className="mt-3 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center animate-fadeIn">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Mine Detonated! Bet lost (-₹{betAmount})
            </div>
          </div>
        )}
      </div>

      {/* Control Deck (Mines count, Bet Amount & Action Buttons) */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Mines Count Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
              Number of Mines
            </label>
            <span className="text-xs font-mono font-bold text-[#D4AF37]">
              {minesCount} Mines ({25 - minesCount} Gems)
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 3, 5, 10, 24].map((count) => (
              <button
                key={count}
                disabled={isPlaying}
                onClick={() => {
                  soundEffects.click();
                  setMinesCount(count);
                }}
                className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                  minesCount === count
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                    : 'bg-white/5 border-white/10 text-[#A0A0A0] hover:bg-white/10 disabled:opacity-50'
                }`}
              >
                {count} {count === 1 ? 'Mine' : 'Mines'}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Amount Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
              Bet Amount (₹)
            </label>
            <span className="text-xs font-mono font-bold text-white">
              ₹{betAmount}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {[10, 50, 100, 500, '2X', '1/2'].map((val, idx) => (
              <button
                key={idx}
                disabled={isPlaying}
                onClick={() => {
                  soundEffects.click();
                  if (val === '2X') {
                    setBetAmount((prev) => Math.min(prev * 2, 50000));
                  } else if (val === '1/2') {
                    setBetAmount((prev) => Math.max(Math.floor(prev / 2), 10));
                  } else {
                    setBetAmount(val as number);
                  }
                }}
                className="py-1.5 rounded-lg text-[11px] font-mono font-bold bg-white/5 border border-white/10 text-[#A0A0A0] hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                {typeof val === 'number' ? `₹${val}` : val}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Play / Cashout / Auto Pick */}
        <div className="pt-1">
          {!isPlaying ? (
            <button
              id="start-mines-game-btn"
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E5C258] to-[#B8952E] hover:brightness-110 text-[#050505] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              Start Mines Bet (₹{betAmount})
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                id="mines-auto-pick-btn"
                onClick={handleAutoPick}
                className="py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Auto Pick
              </button>

              <button
                id="mines-cashout-btn"
                disabled={revealedCount === 0}
                onClick={handleCashout}
                className="col-span-2 py-3 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-[#050505] font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Cashout ₹{potentialCashout.toFixed(2)} ({currentMultiplier}x)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
