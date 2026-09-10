import React, { useState } from 'react';
import { Calendar, Gift, Award, Sparkles, CheckCircle2, ChevronRight, Crown, Flame, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';

interface ActivityCenterProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

const DAILY_REWARDS = [
  { day: 1, amount: 10, label: 'Day 1' },
  { day: 2, amount: 20, label: 'Day 2' },
  { day: 3, amount: 30, label: 'Day 3' },
  { day: 4, amount: 50, label: 'Day 4' },
  { day: 5, amount: 80, label: 'Day 5' },
  { day: 6, amount: 100, label: 'Day 6' },
  { day: 7, amount: 200, label: 'Day 7 (Jackpot)' },
];

export const ActivityCenter: React.FC<ActivityCenterProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [claimedDays, setClaimedDays] = useState<number[]>(user.dailyCheckins || [1]);
  const [giftCode, setGiftCode] = useState('');
  const [giftMsg, setGiftMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);

  const handleClaimDay = (day: number, amount: number) => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (claimedDays.includes(day)) return;

    soundEffects.win();
    confetti({ particleCount: 70, spread: 60 });
    
    setClaimedDays([...claimedDays, day]);
    onUpdateBalance(user.balance + amount);
    onAddTransaction({
      id: 'TX' + Date.now(),
      type: 'checkin',
      amount: amount,
      status: 'completed',
      timestamp: Date.now(),
      title: `Daily Attendance Day ${day} Bonus`,
      description: `Collected +₹${amount}`
    });
  };

  const handleRedeemGiftCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }

    const code = giftCode.trim().toUpperCase();
    if (!code) return;

    if (redeemedCodes.includes(code)) {
      setGiftMsg({ type: 'error', text: 'This gift code has already been redeemed.' });
      return;
    }

    let rewardAmount = 0;
    if (code === 'SKGWIN2026' || code === 'BDGWIN2026') rewardAmount = 200;
    else if (code === 'WELCOME500') rewardAmount = 500;
    else if (code === 'VIPLUCKY') rewardAmount = 150;
    else if (code === 'BONUS100') rewardAmount = 100;
    else {
      setGiftMsg({ type: 'error', text: 'Invalid gift code. Try SKGWIN2026 or WELCOME500' });
      return;
    }

    soundEffects.win();
    confetti({ particleCount: 80, spread: 70 });
    setRedeemedCodes([...redeemedCodes, code]);
    setGiftCode('');
    setGiftMsg({ type: 'success', text: `Success! Received ₹${rewardAmount} Gift Bonus!` });
    
    onUpdateBalance(user.balance + rewardAmount);
    onAddTransaction({
      id: 'TX' + Date.now(),
      type: 'gift_code',
      amount: rewardAmount,
      status: 'completed',
      timestamp: Date.now(),
      title: `Gift Code Redeemed (${code})`,
      description: `Claimed ₹${rewardAmount} Bonus`
    });
  };

  return (
    <div className="space-y-3 pb-8">
      {/* 7-Day Attendance Reward Card */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle Gold Blur Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-bold text-xs uppercase tracking-wider text-white">7-Day Attendance Dividend</span>
          </div>
          <span className="text-[10px] text-[#D4AF37] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Continuous Login
          </span>
        </div>

        <p className="text-[11px] text-[#A0A0A0] mb-4 relative z-10 leading-relaxed">
          Daily active attendance yields compounding dividends. Day 7 unlocks the ₹200 grand mystery reserve.
        </p>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2 mb-2 relative z-10">
          {DAILY_REWARDS.slice(0, 6).map((item) => {
            const isClaimed = claimedDays.includes(item.day);
            const canClaim = !isClaimed && item.day === (claimedDays.length + 1);

            return (
              <button
                key={item.day}
                disabled={isClaimed || !canClaim}
                onClick={() => handleClaimDay(item.day, item.amount)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isClaimed
                    ? 'bg-white/5 border-white/5 opacity-50 text-[#666]'
                    : canClaim
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] border-[#D4AF37] text-[#050505] font-bold shadow-lg shadow-[#D4AF37]/25 scale-102 hover:brightness-110'
                    : 'bg-white/5 border-white/10 text-[#A0A0A0]'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                <span className="font-mono text-xs font-bold mt-0.5">₹{item.amount}</span>
                {isClaimed ? (
                  <CheckCircle2 className="w-3 h-3 text-[#D4AF37] mt-1" />
                ) : (
                  <Gift className="w-3 h-3 mt-1 opacity-70" />
                )}
              </button>
            );
          })}

          {/* Big Day 7 Card spanning 2 cols */}
          <button
            disabled={claimedDays.includes(7) || claimedDays.length < 6}
            onClick={() => handleClaimDay(7, 200)}
            className={`col-span-2 p-3 rounded-xl border flex items-center justify-between px-4 transition-all ${
              claimedDays.includes(7)
                ? 'bg-white/5 border-white/5 opacity-50 text-[#666]'
                : claimedDays.length >= 6
                ? 'bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#B8952E] border-[#D4AF37] text-[#050505] font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-110'
                : 'bg-white/5 border-[#D4AF37]/30 text-[#D4AF37]'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">Day 7 Grand Vault</div>
              <div className="text-[10px] opacity-70">Major loyalty milestone</div>
            </div>
            <div className="font-mono text-sm font-bold">₹200</div>
          </button>
        </div>
      </div>

      {/* Gift Code Redemption Box */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-[#D4AF37]" />
          <span className="font-bold text-xs uppercase tracking-wider text-white">Redeem Exclusive Voucher</span>
        </div>
        <p className="text-[11px] text-[#A0A0A0] mb-3 leading-relaxed">
          Enter an official SKG VIP voucher code to credit direct vault bonus. (e.g. <span className="font-mono text-[#D4AF37] font-bold">SKGWIN2026</span>)
        </p>

        <form onSubmit={handleRedeemGiftCode} className="space-y-2">
          <div className="flex gap-2">
            <input
              id="gift-code-input"
              type="text"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value)}
              placeholder="ENTER GIFT CODE"
              className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono uppercase font-bold text-[#D4AF37] placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50"
            />
            <button
              id="redeem-code-btn"
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D4AF37]/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Redeem
            </button>
          </div>

          {giftMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                giftMsg.type === 'success'
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
              }`}
            >
              {giftMsg.text}
            </div>
          )}
        </form>
      </div>

      {/* VIP Club Tier Privileges */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-bold text-xs uppercase tracking-wider text-white">VIP Club Privileges</span>
          </div>
          <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
            Current: VIP {user.vipLevel}
          </span>
        </div>

        <div className="space-y-2">
          {[
            { level: 'VIP 1', points: '200 EXP', bonus: '₹60 Level Bonus', rebate: '0.1% Extra' },
            { level: 'VIP 2', points: '1,000 EXP', bonus: '₹180 Level Bonus', rebate: '0.2% Extra' },
            { level: 'VIP 3', points: '5,000 EXP', bonus: '₹680 Level Bonus', rebate: '0.3% Extra' },
            { level: 'VIP 5', points: '30,000 EXP', bonus: '₹3,880 + Monthly Salary', rebate: '0.5% Extra' },
          ].map((v, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[10px] font-bold text-[#050505] uppercase tracking-wider">
                  {v.level}
                </span>
                <span className="text-[#666] text-[11px] font-mono">{v.points}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#D4AF37] text-[11px]">{v.bonus}</div>
                <div className="text-[10px] text-[#666]">{v.rebate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
