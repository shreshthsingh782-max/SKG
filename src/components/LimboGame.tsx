import React, { useState, useRef } from 'react';
import { Rocket, Zap, Trophy, ShieldAlert, Sparkles, TrendingUp, Flame, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface LimboGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

export const LimboGame: React.FC<LimboGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [isRolling, setIsRolling] = useState(false);
  const [currentResult, setCurrentResult] = useState<number | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [lastPayout, setLastPayout] = useState(0);

  const [history, setHistory] = useState<Array<{ id: string; mult: number; target: number; won: boolean }>>([
    { id: '1', mult: 3.42, target: 2.0, won: true },
    { id: '2', mult: 1.15, target: 2.0, won: false },
    { id: '3', mult: 18.94, target: 10.0, won: true },
    { id: '4', mult: 4.52, target: 5.0, won: false },
    { id: '5', mult: 2.21, target: 1.5, won: true },
  ]);

  const animRef = useRef<number | null>(null);

  // Calculate win probability: (98 / targetMultiplier) %
  const winChance = parseFloat(Math.min(98 / targetMultiplier, 98).toFixed(2));
  const potentialWin = parseFloat((betAmount * targetMultiplier).toFixed(2));

  const handlePlayLimbo = async () => {
    if (isRolling) return;
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (user.balance < betAmount) {
      onOpenWallet();
      return;
    }

    soundEffects.betPlaced();
    setIsRolling(true);
    setLastWon(null);

    try {
      const res = await api.playLimbo(betAmount, targetMultiplier);
      if (res && res.success) {
        const finalOutcome = res.outcome;
        const won = res.won;

        const startTime = Date.now();
        const duration = 700;

        const step = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed >= duration) {
            setCurrentResult(finalOutcome);
            setIsRolling(false);
            setLastWon(won);

            if (won) {
              setLastPayout(res.winAmount);
              soundEffects.win();
              soundEffects.coins();
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#00FFFF', '#FFD700', '#FFFFFF']
              });
            } else {
              soundEffects.lose();
            }

            onUpdateBalance(res.newBalance);
            setHistory((prev) => [
              { id: Date.now().toString(), mult: finalOutcome, target: targetMultiplier, won },
              ...prev.slice(0, 9),
            ]);
          } else {
            const flicker = parseFloat((1.0 + Math.random() * (targetMultiplier * 1.5)).toFixed(2));
            setCurrentResult(flicker);
            animRef.current = requestAnimationFrame(step);
          }
        };

        animRef.current = requestAnimationFrame(step);
        return;
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Header Banner */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#F2D06B] text-[#050505] flex items-center justify-center font-bold shadow-md shadow-[#D4AF37]/20">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                Limbo Rocket <span className="text-[9px] text-[#D4AF37] font-mono px-1.5 py-0.2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">Instant Multiplier</span>
              </h3>
              <p className="text-[10px] text-[#A0A0A0]">Target Multiplier Crash Engine</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-[#666] font-bold">Max Payout</div>
            <div className="font-mono text-xs font-bold text-[#D4AF37]">1,000.00x</div>
          </div>
        </div>

        {/* History Stream */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar relative z-10 border-t border-white/5 pt-2">
          <span className="text-[9px] uppercase tracking-wider text-[#666] font-bold shrink-0">Rolls:</span>
          {history.map((h) => (
            <span
              key={h.id}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                h.won
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {h.mult.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>

      {/* Main Multiplier Display Stage */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden min-h-[160px] flex flex-col items-center justify-center">
        {/* Decorative background rocket glow */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Rocket className="w-48 h-48 text-[#D4AF37]" />
        </div>

        <div className="relative z-10 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
            {isRolling ? 'ROCKET ACCELERATING...' : 'RESULT MULTIPLIER'}
          </div>

          <div
            className={`font-mono text-4xl sm:text-5xl font-black tracking-tight transition-all duration-150 ${
              isRolling
                ? 'text-white scale-105 animate-pulse'
                : lastWon === true
                ? 'text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-110'
                : lastWon === false
                ? 'text-rose-500 scale-95'
                : 'text-white'
            }`}
          >
            {currentResult !== null ? `${currentResult.toFixed(2)}x` : '1.00x'}
          </div>

          {lastWon !== null && !isRolling && (
            <div className="pt-2 animate-fadeIn">
              {lastWon ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5" />
                  Target Beaten! (+₹{lastPayout.toFixed(2)})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Under Target ({targetMultiplier}x)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target Multiplier & Win Probability Controls */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Target Multiplier Input & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
              Target Multiplier
            </label>
            <span className="text-xs font-mono font-bold text-[#D4AF37]">
              Win Chance: {winChance}%
            </span>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider">Multiplier:</span>
            <div className="flex items-center gap-1 font-mono text-base font-bold text-[#D4AF37]">
              <input
                type="number"
                step="0.1"
                min="1.05"
                max="1000"
                value={targetMultiplier}
                disabled={isRolling}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1.05;
                  setTargetMultiplier(Math.max(1.05, Math.min(val, 1000)));
                }}
                className="w-24 text-right bg-transparent text-[#D4AF37] font-bold focus:outline-none"
              />
              <span>x</span>
            </div>
          </div>

          {/* Quick Target Multiplier Presets */}
          <div className="grid grid-cols-6 gap-1.5 mt-2">
            {[1.5, 2.0, 5.0, 10.0, 50.0, 100.0].map((m) => (
              <button
                key={m}
                disabled={isRolling}
                onClick={() => {
                  soundEffects.click();
                  setTargetMultiplier(m);
                }}
                className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                  targetMultiplier === m
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                    : 'bg-white/5 border-white/10 text-[#A0A0A0] hover:bg-white/10'
                }`}
              >
                {m}x
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
              Payout: ₹{potentialWin.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {[10, 50, 100, 500, '2X', '1/2'].map((val, idx) => (
              <button
                key={idx}
                disabled={isRolling}
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

        {/* Action Button */}
        <div className="pt-1">
          <button
            id="play-limbo-btn"
            disabled={isRolling}
            onClick={handlePlayLimbo}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E5C258] to-[#B8952E] hover:brightness-110 text-[#050505] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isRolling ? (
              <div className="w-4 h-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Rocket className="w-4 h-4 fill-current" />
                Launch Rocket (₹{betAmount})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
