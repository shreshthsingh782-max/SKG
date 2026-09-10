import React, { useState } from 'react';
import { 
  Gift, Users, Copy, Check, Share2, Sparkles, TrendingUp, 
  Award, DollarSign, HelpCircle, Shield, QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';

interface PromotionCenterProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
}

export const PromotionCenter: React.FC<PromotionCenterProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claimableCommission, setClaimableCommission] = useState(485.50);
  const [showQr, setShowQr] = useState(false);

  const inviteCode = user.invitationCode || '5226410218444';
  const inviteUrl = `https://bdg9.vip//#/register?invitationCode=${inviteCode}`;

  const handleCopyLink = () => {
    soundEffects.click();
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    soundEffects.click();
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClaimCommission = () => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (claimableCommission <= 0) return;

    soundEffects.win();
    confetti({ particleCount: 70, spread: 60 });
    
    const amount = claimableCommission;
    setClaimableCommission(0);
    onUpdateBalance(user.balance + amount);
    onAddTransaction({
      id: 'TX' + Date.now(),
      type: 'referral_bonus',
      amount: amount,
      status: 'completed',
      timestamp: Date.now(),
      title: 'Referral Agent Commission',
      description: `Claimed team betting rebate (+₹${amount.toFixed(2)})`
    });
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Referral Header */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle Gold Blur Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-bold">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Affiliate & Partner Desk
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">Automated tier turnover dividends</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
            Tier 1: 0.60%
          </span>
        </div>

        {/* Invitation Code Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-3 flex items-center justify-between relative z-10">
          <div>
            <div className="text-[10px] text-[#666] uppercase tracking-widest font-bold">YOUR INVITATION CODE</div>
            <div className="font-mono text-lg font-bold text-[#D4AF37] tracking-wider mt-0.5">
              {inviteCode}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              id="copy-invite-code-btn"
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] hover:brightness-110 text-[#050505] font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
            <button
              id="show-qr-btn"
              onClick={() => { soundEffects.click(); setShowQr(!showQr); }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Copy Referral Link Button */}
        <button
          id="copy-invite-link-btn"
          onClick={handleCopyLink}
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#E5C258] to-[#B8952E] hover:brightness-110 text-[#050505] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-98 transition-all relative z-10"
        >
          {copiedLink ? <Check className="w-4 h-4 text-[#050505]" /> : <Share2 className="w-4 h-4" />}
          {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Official Invite Link'}
        </button>

        {/* QR Code expansion */}
        {showQr && (
          <div className="mt-3 p-4 bg-white text-slate-900 rounded-xl text-center animate-fadeIn relative z-10">
            <div className="w-36 h-36 mx-auto bg-slate-100 border-2 border-slate-900 rounded-lg flex flex-col items-center justify-center p-2">
              <QrCode className="w-28 h-28 text-slate-950" />
            </div>
            <div className="text-[11px] font-mono font-bold mt-2 text-slate-800 uppercase tracking-wider">
              Scan to Join via 5226410218444
            </div>
          </div>
        )}
      </div>

      {/* Commission Claim Box */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#666] font-bold">Unsettled Partner Commission</div>
            <div className="font-mono text-2xl font-bold text-[#D4AF37] mt-0.5">
              ₹{claimableCommission.toFixed(2)}
            </div>
          </div>
          <button
            id="claim-commission-btn"
            disabled={claimableCommission <= 0}
            onClick={handleClaimCommission}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D4AF37]/20 active:scale-95 disabled:opacity-40 transition-all hover:brightness-110"
          >
            Claim All
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-white/5">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Subordinates</div>
            <div className="font-mono text-base font-bold text-white mt-0.5">14</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Team Volume</div>
            <div className="font-mono text-base font-bold text-white mt-0.5">58</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-[#666] uppercase tracking-wider font-bold">Total Rebate</div>
            <div className="font-mono text-base font-bold text-[#D4AF37] mt-0.5">₹3,420</div>
          </div>
        </div>
      </div>

      {/* Tier Rebate Breakdown */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
          Multi-Tier Rebate Schedule
        </h4>

        <div className="space-y-2 text-xs">
          {[
            { tier: 'Tier 1 (Direct Referrals)', rebate: '0.60% of Turnover', note: 'Direct invite credit' },
            { tier: 'Tier 2 (Sub-referrals)', rebate: '0.18% of Turnover', note: 'Secondary network' },
            { tier: 'Tier 3 (3rd Generation)', rebate: '0.054% of Turnover', note: 'Tertiary network bonus' },
            { tier: 'Tier 4 (4th Generation)', rebate: '0.016% of Turnover', note: 'Unlimited width network' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#E0E0E0]">{item.tier}</div>
                <div className="text-[10px] text-[#666] mt-0.5">{item.note}</div>
              </div>
              <div className="font-mono font-bold text-[#D4AF37] text-xs text-right">
                {item.rebate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
