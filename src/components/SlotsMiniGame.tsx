import React, { useState } from 'react';
import { Sparkles, Trophy, Flame, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

const SYMBOLS = ['👑', '💎', '7️⃣', '🍒', '🔔', '🍀', '🍇'];

interface SlotsMiniGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

export const SlotsMiniGame: React.FC<SlotsMiniGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [betCost, setBetCost] = useState(20);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  const handleSpin = async () => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (betCost > user.balance) {
      onOpenWallet();
      return;
    }

    soundEffects.betPlaced();
    setIsSpinning(true);
    setWinMessage(null);

    // Optimistically deduct
    onUpdateBalance(user.balance - betCost);
    onAddTransaction({
      id: 'TX' + Date.now(),
      type: 'bet',
      amount: betCost,
      status: 'completed',
      timestamp: Date.now(),
      title: 'Slot 777 Spin',
      description: `Bet ₹${betCost}`
    });

    let spinCounter = 0;
    const interval = setInterval(() => {
      soundEffects.tick();
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      spinCounter++;
    }, 100);

    try {
      const data = await api.spinSlots(betCost);
      setTimeout(() => {
        clearInterval(interval);
        setIsSpinning(false);
        if (data && data.success) {
          setReels(data.reels);
          onUpdateBalance(data.newBalance);
          if (data.winAmount > 0) {
            soundEffects.win();
            confetti({ particleCount: 70, spread: 60 });
            setWinMessage(`🎉 ${data.winType || 'Jackpot!'} Won ₹${data.winAmount.toFixed(2)}`);
          } else {
            soundEffects.lose();
            setWinMessage('Better luck on the next spin!');
          }
        }
      }, 1200);
    } catch {
      setTimeout(() => {
        clearInterval(interval);
        finalizeSpin();
      }, 1200);
    }
  };

  const finalizeSpin = () => {
    setIsSpinning(false);
    
    // Check outcome
    const rand = Math.random();
    let finalSymbols = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];

    let multiplier = 0;
    if (rand < 0.25) {
      // 3 match
      const sym = rand < 0.05 ? '7️⃣' : rand < 0.12 ? '👑' : '💎';
      finalSymbols = [sym, sym, sym];
      multiplier = sym === '7️⃣' ? 15 : sym === '👑' ? 10 : 6;
    } else if (rand < 0.55) {
      // 2 match
      const sym = '🍒';
      finalSymbols = [sym, sym, '🍀'];
      multiplier = 2.5;
    }

    setReels(finalSymbols);

    if (multiplier > 0) {
      const winVal = betCost * multiplier;
      soundEffects.win();
      confetti({ particleCount: 70, spread: 60 });
      setWinMessage(`🎉 Jackpot! Won ₹${winVal.toFixed(2)} (${multiplier}x)`);
      onUpdateBalance(user.balance + winVal);
      onAddTransaction({
        id: 'TX' + Date.now(),
        type: 'win',
        amount: winVal,
        status: 'completed',
        timestamp: Date.now(),
        title: 'Slot Machine Payout',
        description: `Matched ${finalSymbols.join(' ')} (+₹${winVal})`
      });
    } else {
      soundEffects.lose();
      setWinMessage('Better luck on the next spin!');
    }
  };

  return (
    <div className="space-y-3 pb-8">
      <div className="bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          SKG Golden Slots 777
        </div>

        {/* 3 Slot Reels Container */}
        <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl p-4 shadow-inner grid grid-cols-3 gap-3 mb-4">
          {reels.map((sym, idx) => (
            <div
              key={idx}
              className={`h-24 bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-4xl shadow-md ${
                isSpinning ? 'animate-pulse scale-95' : 'scale-100'
              }`}
            >
              {sym}
            </div>
          ))}
        </div>

        {winMessage && (
          <div className="mb-3 text-xs font-bold text-amber-300 animate-bounce">
            {winMessage}
          </div>
        )}

        {/* Bet Selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[10, 20, 50, 100, 200].map((amt) => (
            <button
              key={amt}
              disabled={isSpinning}
              onClick={() => { soundEffects.click(); setBetCost(amt); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                betCost === amt ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Spin Button */}
        <button
          id="slot-spin-btn"
          disabled={isSpinning}
          onClick={handleSpin}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'Spinning...' : `SPIN FOR ₹${betCost}`}
        </button>
      </div>
    </div>
  );
};
