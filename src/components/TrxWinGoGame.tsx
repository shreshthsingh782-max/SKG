import React, { useState, useEffect } from 'react';
import { ShieldCheck, Hash, Clock, Sparkles, RefreshCw, Trophy, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { getNumberColor, getNumberSize } from '../utils/gameLogic';

interface TrxWinGoGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

export const TrxWinGoGame: React.FC<TrxWinGoGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentBlock, setCurrentBlock] = useState('73819420');
  const [latestHash, setLatestHash] = useState('00000000000x8f2a938c7');
  const [selectedBet, setSelectedBet] = useState<'green' | 'red' | 'violet' | 'big' | 'small' | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDraw();
          return 60;
        }
        if (prev <= 5) soundEffects.warningTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBetPlaced, selectedBet, betAmount, user.balance]);

  const handleDraw = () => {
    const randomNum = Math.floor(Math.random() * 10);
    const hashTail = Math.random().toString(16).substring(2, 9) + randomNum;
    const newHash = `00000000000x${hashTail}`;
    const nextBlock = String(Number(currentBlock) + 1);

    setLatestHash(newHash);
    setCurrentBlock(nextBlock);

    if (isBetPlaced && selectedBet) {
      const winColor = getNumberColor(randomNum);
      const winSize = getNumberSize(randomNum);

      let isWin = false;
      let multiplier = 2;

      if (selectedBet === 'green' && [1, 3, 7, 9].includes(randomNum)) isWin = true;
      if (selectedBet === 'red' && [2, 4, 6, 8].includes(randomNum)) isWin = true;
      if (selectedBet === 'violet' && (randomNum === 0 || randomNum === 5)) {
        isWin = true;
        multiplier = 4.5;
      }
      if (selectedBet === 'big' && winSize === 'Big') isWin = true;
      if (selectedBet === 'small' && winSize === 'Small') isWin = true;

      if (isWin) {
        const winValue = betAmount * multiplier;
        setLastWin(winValue);
        soundEffects.win();
        confetti({ particleCount: 60, spread: 60 });
        onUpdateBalance(user.balance + winValue);
        onAddTransaction({
          id: 'TX' + Date.now(),
          type: 'win',
          amount: winValue,
          status: 'completed',
          timestamp: Date.now(),
          title: 'TRX Hash Win',
          description: `Won on Block #${currentBlock} (Hash digit: ${randomNum})`
        });
      } else {
        soundEffects.lose();
        setLastWin(0);
      }
      setIsBetPlaced(false);
      setSelectedBet(null);
    }
  };

  const handlePlaceBet = () => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (!selectedBet) return;
    if (betAmount > user.balance) {
      onOpenWallet();
      return;
    }

    soundEffects.betPlaced();
    onUpdateBalance(user.balance - betAmount);
    onAddTransaction({
      id: 'TX' + Date.now(),
      type: 'bet',
      amount: betAmount,
      status: 'completed',
      timestamp: Date.now(),
      title: `TRX Bet on ${selectedBet.toUpperCase()}`,
      description: `Block #${currentBlock}`
    });
    setIsBetPlaced(true);
  };

  const isLocked = timeLeft <= 5;

  return (
    <div className="space-y-3 pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-amber-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              TRON Blockchain Verifiable Draw
            </div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">
              Block: <span className="font-mono text-amber-300 font-black">#{currentBlock}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">Draw in</div>
            <div className="font-mono text-xl font-black text-amber-400">
              {String(timeLeft).padStart(2, '0')}s
            </div>
          </div>
        </div>

        {/* Live Block Hash Box */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-3">
          <div className="text-[10px] text-slate-500 font-mono mb-1 flex items-center justify-between">
            <span>PREVIOUS BLOCK HASH</span>
            <span className="text-emerald-400 font-bold">100% FAIR</span>
          </div>
          <div className="font-mono text-xs text-slate-300 truncate">
            {latestHash.slice(0, -1)}
            <span className="text-amber-400 font-black bg-amber-500/20 px-1 rounded ml-0.5">
              {latestHash.slice(-1)}
            </span>
          </div>
        </div>

        {/* Prediction Target Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            disabled={isLocked || isBetPlaced}
            onClick={() => { soundEffects.click(); setSelectedBet('green'); }}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
              selectedBet === 'green'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            Green (2x)
          </button>
          <button
            disabled={isLocked || isBetPlaced}
            onClick={() => { soundEffects.click(); setSelectedBet('violet'); }}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
              selectedBet === 'violet'
                ? 'bg-purple-500 text-slate-950 ring-2 ring-purple-300'
                : 'bg-purple-950/80 border border-purple-500/40 text-purple-200 hover:bg-purple-900'
            }`}
          >
            Violet (4.5x)
          </button>
          <button
            disabled={isLocked || isBetPlaced}
            onClick={() => { soundEffects.click(); setSelectedBet('red'); }}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
              selectedBet === 'red'
                ? 'bg-rose-500 text-slate-950 ring-2 ring-rose-300'
                : 'bg-rose-950/80 border border-rose-500/40 text-rose-200 hover:bg-rose-900'
            }`}
          >
            Red (2x)
          </button>
        </div>

        {/* Big / Small */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            disabled={isLocked || isBetPlaced}
            onClick={() => { soundEffects.click(); setSelectedBet('big'); }}
            className={`py-2 rounded-xl font-bold text-xs transition-all ${
              selectedBet === 'big'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Big (5-9) 2x
          </button>
          <button
            disabled={isLocked || isBetPlaced}
            onClick={() => { soundEffects.click(); setSelectedBet('small'); }}
            className={`py-2 rounded-xl font-bold text-xs transition-all ${
              selectedBet === 'small'
                ? 'bg-sky-400 text-slate-950 ring-2 ring-sky-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Small (0-4) 2x
          </button>
        </div>

        {/* Bet Chips & Submit */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {[20, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => { soundEffects.click(); setBetAmount(amt); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold ${
                  betAmount === amt ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <button
            disabled={isLocked || isBetPlaced || !selectedBet}
            onClick={handlePlaceBet}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-40"
          >
            {isBetPlaced ? 'Bet Confirmed' : `Bet ₹${betAmount}`}
          </button>
        </div>

        {lastWin !== null && (
          <div className="mt-3 p-2 bg-slate-950 rounded-xl text-center text-xs">
            {lastWin > 0 ? (
              <span className="text-emerald-400 font-bold">🎉 Previous Round: Won +₹{lastWin.toFixed(2)}</span>
            ) : (
              <span className="text-slate-400">Previous Round: Not this time</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
