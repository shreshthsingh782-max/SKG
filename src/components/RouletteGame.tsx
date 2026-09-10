import React, { useState, useRef } from 'react';
import { Disc, Trophy, Sparkles, RotateCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface RouletteGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// European wheel order
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [selectedChip, setSelectedChip] = useState(50);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [lastWonAmount, setLastWonAmount] = useState(0);
  const [lastResultStatus, setLastResultStatus] = useState<'won' | 'lost' | null>(null);

  const [history, setHistory] = useState<Array<{ num: number; color: 'red' | 'black' | 'green' }>>([
    { num: 14, color: 'red' },
    { num: 33, color: 'black' },
    { num: 0, color: 'green' },
    { num: 7, color: 'red' },
    { num: 22, color: 'black' },
    { num: 19, color: 'red' },
  ]);

  const totalBet = Object.values(bets).reduce((a: number, b: number) => a + b, 0);

  const getNumberColor = (n: number): 'red' | 'black' | 'green' => {
    if (n === 0) return 'green';
    return RED_NUMBERS.includes(n) ? 'red' : 'black';
  };

  const handlePlaceBet = (betKey: string) => {
    if (isSpinning) return;
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (user.balance < selectedChip) {
      onOpenWallet();
      return;
    }

    soundEffects.betPlaced();

    // Deduct chip
    onUpdateBalance(user.balance - selectedChip);
    setBets((prev) => ({
      ...prev,
      [betKey]: (prev[betKey] || 0) + selectedChip,
    }));

    onAddTransaction({
      id: 'tx_roulette_bet_' + Date.now(),
      type: 'bet',
      amount: selectedChip,
      status: 'completed',
      timestamp: Date.now(),
      title: `Roulette Bet (${betKey.toUpperCase()})`,
      description: `Wager ₹${selectedChip} on Roulette 360`,
    });
  };

  const handleClearBets = () => {
    if (isSpinning || totalBet === 0) return;
    soundEffects.click();
    // Refund active bets back to balance
    onUpdateBalance(user.balance + totalBet);
    setBets({});
  };

  const handleSpin = async () => {
    if (isSpinning || totalBet === 0) return;

    setIsSpinning(true);
    setLastResultStatus(null);
    setWinningNumber(null);

    let chosenNumber = Math.floor(Math.random() * 37);
    let serverWin = 0;
    let serverBal: number | null = null;

    try {
      const res = await api.spinRoulette(bets, Number(totalBet));
      if (res && res.success) {
        chosenNumber = res.winningNumber;
        serverWin = res.winAmount;
        serverBal = res.newBalance;
      }
    } catch {
      // Fallback
    }

    const indexInWheel = WHEEL_ORDER.indexOf(chosenNumber);
    const sliceAngle = 360 / 37;

    // Calculate rotation to land on slice
    const spins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full 360 turns
    const targetDeg = rotationAngle + spins * 360 + (360 - (indexInWheel * sliceAngle));

    setRotationAngle(targetDeg);

    // Sound effect ticks during spin
    const tickInterval = setInterval(() => {
      soundEffects.tick();
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWinningNumber(chosenNumber);

      const color = getNumberColor(chosenNumber);
      setHistory((prev) => [{ num: chosenNumber, color }, ...prev.slice(0, 9)]);

      if (serverBal !== null) {
        if (serverWin > 0) {
          soundEffects.win();
          soundEffects.coins();
          setLastWonAmount(serverWin);
          setLastResultStatus('won');
          onUpdateBalance(serverBal);

          onAddTransaction({
            id: 'tx_roulette_win_' + Date.now(),
            type: 'win',
            amount: serverWin,
            status: 'completed',
            timestamp: Date.now(),
            title: `Roulette Win (${chosenNumber} ${color.toUpperCase()})`,
            description: `Server payout ₹${serverWin.toFixed(2)} on Roulette Wheel`,
          });

          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#DC2626', '#16A34A', '#FFFFFF']
          });
        } else {
          soundEffects.lose();
          setLastResultStatus('lost');
          onUpdateBalance(serverBal);
        }
        setBets({});
      } else {
        // Calculate winnings locally if server unreachable
        settleRouletteWinnings(chosenNumber, color);
      }
    }, 4000);
  };

  const settleRouletteWinnings = (num: number, color: 'red' | 'black' | 'green') => {
    let totalWin = 0;

    // Color bets (2x)
    if (color === 'red' && bets['red']) totalWin += bets['red'] * 2;
    if (color === 'black' && bets['black']) totalWin += bets['black'] * 2;
    if (color === 'green' && bets['green']) totalWin += bets['green'] * 14;

    // Even / Odd bets (2x) (0 is neither)
    if (num > 0) {
      if (num % 2 === 0 && bets['even']) totalWin += bets['even'] * 2;
      if (num % 2 !== 0 && bets['odd']) totalWin += bets['odd'] * 2;
    }

    // High / Low bets (2x)
    if (num >= 1 && num <= 18 && bets['low']) totalWin += bets['low'] * 2;
    if (num >= 19 && num <= 36 && bets['high']) totalWin += bets['high'] * 2;

    // Direct Number bets (36x)
    if (bets[`num_${num}`]) {
      totalWin += bets[`num_${num}`] * 36;
    }

    if (totalWin > 0) {
      soundEffects.win();
      soundEffects.coins();
      setLastWonAmount(totalWin);
      setLastResultStatus('won');
      onUpdateBalance(user.balance + totalWin);

      onAddTransaction({
        id: 'tx_roulette_win_' + Date.now(),
        type: 'win',
        amount: totalWin,
        status: 'completed',
        timestamp: Date.now(),
        title: `Roulette Win (${num} ${color.toUpperCase()})`,
        description: `Won payout ₹${totalWin.toFixed(2)} on Roulette Wheel`,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#DC2626', '#16A34A', '#FFFFFF']
      });
    } else {
      soundEffects.lose();
      setLastResultStatus('lost');
    }

    // Clear bets after payout
    setBets({});
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Top Banner Card */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#F2D06B] text-[#050505] flex items-center justify-center font-bold shadow-md shadow-[#D4AF37]/20">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                Roulette 360 <span className="text-[9px] text-[#D4AF37] font-mono px-1.5 py-0.2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">European</span>
              </h3>
              <p className="text-[10px] text-[#A0A0A0]">Spin the Wheel, Hit 36X Jackpots</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-[#666] font-bold">Number Payout</div>
            <div className="font-mono text-xs font-bold text-[#D4AF37]">36.00x</div>
          </div>
        </div>

        {/* History Stream */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar relative z-10 border-t border-white/5 pt-2">
          <span className="text-[9px] uppercase tracking-wider text-[#666] font-bold shrink-0">Recent:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border ${
                h.color === 'red'
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                  : h.color === 'black'
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                  : 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
              }`}
            >
              {h.num}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Spinning Wheel Stage */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
        {/* Golden Pointer Indicator */}
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-[#D4AF37] z-20 -mb-2 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.8)]"></div>

        {/* Spinning Wheel Circle */}
        <div className="w-48 h-48 rounded-full border-4 border-[#D4AF37]/40 relative overflow-hidden shadow-2xl shadow-black/80 flex items-center justify-center bg-[#151515]">
          <div
            className="absolute inset-0 rounded-full transition-transform duration-[4000ms] ease-out"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          >
            {/* 12 visual colored sectors for visual flair */}
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className={`absolute top-0 left-1/2 -ml-3 w-6 h-24 origin-bottom text-[8px] font-bold font-mono flex items-start justify-center pt-1 ${
                  idx % 3 === 0
                    ? 'text-rose-400'
                    : idx % 3 === 1
                    ? 'text-zinc-300'
                    : 'text-[#D4AF37]'
                }`}
                style={{ transform: `rotate(${idx * 30}deg)` }}
              >
                {WHEEL_ORDER[idx * 3]}
              </div>
            ))}
          </div>

          {/* Center Hub */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1A1A1A] to-[#2E2E2E] border-2 border-[#D4AF37] shadow-xl z-10 flex flex-col items-center justify-center">
            {winningNumber !== null ? (
              <span
                className={`font-mono text-lg font-black ${
                  getNumberColor(winningNumber) === 'red'
                    ? 'text-rose-400'
                    : getNumberColor(winningNumber) === 'black'
                    ? 'text-white'
                    : 'text-emerald-400'
                }`}
              >
                {winningNumber}
              </span>
            ) : (
              <Disc className="w-6 h-6 text-[#D4AF37] animate-spin-slow" />
            )}
          </div>
        </div>

        {/* Outcome result banner */}
        {lastResultStatus && !isSpinning && (
          <div className="mt-3 animate-fadeIn">
            {lastResultStatus === 'won' ? (
              <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                <Trophy className="w-3.5 h-3.5" />
                Roulette Won! (+₹{lastWonAmount.toFixed(2)})
              </div>
            ) : (
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40">
                <ShieldAlert className="w-3.5 h-3.5" />
                No winning bets on {winningNumber}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Betting Board Grid */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-xl space-y-2.5">
        <div className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
          Standard Outcome Bets
        </div>

        {/* Color & Zero Bets (Red 2x, Black 2x, Green 0 14x) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            id="bet-roulette-red"
            disabled={isSpinning}
            onClick={() => handlePlaceBet('red')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
              bets['red']
                ? 'bg-rose-600/30 border-rose-500 ring-1 ring-rose-400'
                : 'bg-rose-950/40 border-rose-600/40 hover:border-rose-500'
            } active:scale-95 disabled:opacity-50`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Red (2X)</span>
            {bets['red'] && (
              <span className="text-[10px] font-mono font-bold text-white bg-rose-600 px-2 py-0.2 rounded-full mt-1 shadow">
                ₹{bets['red']}
              </span>
            )}
          </button>

          <button
            id="bet-roulette-green"
            disabled={isSpinning}
            onClick={() => handlePlaceBet('green')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
              bets['green']
                ? 'bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-400'
                : 'bg-emerald-950/40 border-emerald-600/40 hover:border-emerald-500'
            } active:scale-95 disabled:opacity-50`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Green 0 (14X)</span>
            {bets['green'] && (
              <span className="text-[10px] font-mono font-bold text-[#050505] bg-emerald-400 px-2 py-0.2 rounded-full mt-1 shadow">
                ₹{bets['green']}
              </span>
            )}
          </button>

          <button
            id="bet-roulette-black"
            disabled={isSpinning}
            onClick={() => handlePlaceBet('black')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
              bets['black']
                ? 'bg-zinc-800 border-zinc-500 ring-1 ring-zinc-400'
                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
            } active:scale-95 disabled:opacity-50`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Black (2X)</span>
            {bets['black'] && (
              <span className="text-[10px] font-mono font-bold text-[#050505] bg-zinc-200 px-2 py-0.2 rounded-full mt-1 shadow">
                ₹{bets['black']}
              </span>
            )}
          </button>
        </div>

        {/* Even/Odd & High/Low (2X) */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'even', label: 'Even (2X)' },
            { id: 'odd', label: 'Odd (2X)' },
            { id: 'low', label: '1 - 18 (2X)' },
            { id: 'high', label: '19 - 36 (2X)' },
          ].map((b) => (
            <button
              key={b.id}
              id={`bet-roulette-${b.id}`}
              disabled={isSpinning}
              onClick={() => handlePlaceBet(b.id)}
              className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                bets[b.id]
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] border-[#D4AF37] shadow'
                  : 'bg-white/5 border-white/10 text-[#A0A0A0] hover:bg-white/10'
              } active:scale-95 disabled:opacity-50`}
            >
              <div>{b.label}</div>
              {bets[b.id] && (
                <div className="font-mono text-[9px] text-[#050505] font-black mt-0.5">₹{bets[b.id]}</div>
              )}
            </button>
          ))}
        </div>

        {/* Hot Single Number Grid (0-11 sample for quick high-payout 36x betting) */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] font-bold mb-1.5 flex items-center justify-between">
            <span>Lucky Numbers (36X Payout)</span>
            <span className="text-[9px] text-[#D4AF37]">Pick your lucky digits</span>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {[0, 7, 8, 11, 14, 17, 21, 22, 28, 32, 33, 36].map((num) => {
              const color = getNumberColor(num);
              const key = `num_${num}`;
              const hasBet = !!bets[key];

              return (
                <button
                  key={num}
                  id={`bet-roulette-num-${num}`}
                  disabled={isSpinning}
                  onClick={() => handlePlaceBet(key)}
                  className={`py-1.5 rounded text-xs font-mono font-bold border transition-all relative ${
                    hasBet
                      ? 'ring-2 ring-[#D4AF37] scale-105'
                      : ''
                  } ${
                    color === 'red'
                      ? 'bg-rose-600/30 border-rose-500/50 text-rose-300 hover:bg-rose-600/50'
                      : color === 'black'
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/50'
                  } active:scale-95 disabled:opacity-50`}
                >
                  {num}
                  {hasBet && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] text-[7px] text-[#050505] font-bold flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chip & Spin Action Controls */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
            Select Chip
          </span>
          <span className="text-xs font-mono font-bold text-[#D4AF37]">
            Table Total: ₹{totalBet}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {[10, 50, 100, 500, 1000].map((amt) => (
            <button
              key={amt}
              disabled={isSpinning}
              onClick={() => {
                soundEffects.click();
                setSelectedChip(amt);
              }}
              className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                selectedChip === amt
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 scale-105'
                  : 'bg-white/5 border-white/10 text-[#A0A0A0] hover:bg-white/10 disabled:opacity-50'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Spin & Clear Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            id="clear-roulette-bets-btn"
            disabled={isSpinning || totalBet === 0}
            onClick={handleClearBets}
            className="py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-colors"
          >
            Clear (₹{totalBet})
          </button>

          <button
            id="spin-roulette-btn"
            disabled={isSpinning || totalBet === 0}
            onClick={handleSpin}
            className="col-span-2 py-3 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E5C258] to-[#B8952E] hover:brightness-110 text-[#050505] font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {isSpinning ? (
              <div className="w-4 h-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <RotateCw className="w-4 h-4" />
                Spin Wheel (₹{totalBet})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
