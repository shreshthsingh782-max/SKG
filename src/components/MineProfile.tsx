import React, { useState } from 'react';
import { 
  User, Shield, CreditCard, History, Headphones, LogOut, 
  Settings, Award, ChevronRight, Copy, Check, Gift, Crown, 
  Share2, Key, Bell, HelpCircle, PlusCircle, ShieldCheck,
  HeartHandshake, Scale, CheckCircle2, AlertCircle, Clock, Gamepad2, Users
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';

interface MineProfileProps {
  user: UserProfile;
  onOpenWallet: (tab?: 'deposit' | 'withdraw' | 'records') => void;
  onOpenSupport: () => void;
  onOpenAuth: (mode: 'login' | 'register' | 'controller' | 'switch' | 'player') => void;
  onOpenAdmin?: () => void;
  onOpenKYC?: () => void;
  onOpenResponsibleGaming?: () => void;
  onOpenProvablyFair?: () => void;
  onOpenLegalPolicies?: () => void;
  onLogout: () => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=120&auto=format&fit=crop&q=80'
];

export const MineProfile: React.FC<MineProfileProps> = ({
  user,
  onOpenWallet,
  onOpenSupport,
  onOpenAuth,
  onOpenAdmin,
  onOpenKYC,
  onOpenResponsibleGaming,
  onOpenProvablyFair,
  onOpenLegalPolicies,
  onLogout
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(user.avatar);

  const handleCopyUID = () => {
    soundEffects.click();
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Profile Header Card */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle Gold Blur Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Avatar with VIP Crown */}
          <div className="relative">
            <img
              src={currentAvatar}
              alt="Avatar"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-16 h-16 rounded-full border-2 border-[#D4AF37] object-cover cursor-pointer hover:opacity-90 shadow-md shadow-[#D4AF37]/20"
            />
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] text-[9px] font-black border border-[#050505] shadow">
              VIP {user.vipLevel}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight truncate text-white">
                {user.phone || 'Elite Trader'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-bold border border-[#D4AF37]/30 uppercase tracking-wider">
                Verified
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#A0A0A0] font-mono">UID: {user.id}</span>
              <button
                id="copy-uid-btn"
                onClick={handleCopyUID}
                className="p-1 text-[#666] hover:text-[#D4AF37] transition-colors"
                title="Copy UID"
              >
                {copiedId ? <Check className="w-3 h-3 text-[#D4AF37]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="text-[11px] text-[#666] mt-0.5 uppercase tracking-wider">
              Invite Code: <span className="font-mono text-[#D4AF37] font-bold">{user.invitationCode}</span>
            </div>
          </div>
        </div>

        {/* Avatar Picker Dropdown */}
        {showAvatarPicker && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 animate-fadeIn relative z-10">
            <span className="text-[11px] text-[#A0A0A0]">Choose Avatar:</span>
            <div className="flex gap-2">
              {AVATARS.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt={`Avatar ${idx}`}
                  onClick={() => {
                    soundEffects.click();
                    setCurrentAvatar(av);
                    setShowAvatarPicker(false);
                  }}
                  className="w-8 h-8 rounded-full border border-white/10 hover:border-[#D4AF37] cursor-pointer object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Balance & Financial Action Bar */}
        <div className="mt-5 p-3.5 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-between relative z-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#666] font-bold">Total Portfolio</div>
            <div className="font-mono text-xl font-bold text-[#D4AF37] mt-0.5">
              ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              id="mine-deposit-btn"
              onClick={() => { soundEffects.click(); onOpenWallet('deposit'); }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-black text-xs uppercase tracking-wider shadow-md shadow-[#D4AF37]/20 active:scale-95 transition-all hover:brightness-110 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Money (+5%)</span>
            </button>
            <button
              id="mine-withdraw-btn"
              onClick={() => { soundEffects.click(); onOpenWallet('withdraw'); }}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED SEPARATE LOGINS & ROLE SWITCHER */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              user.isController
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              {user.isController ? <Crown className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{user.isController ? '👑 Master Controller Account' : '🎮 Standard Player Account'}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  user.isController ? 'bg-amber-400 text-black' : 'bg-blue-500/30 text-blue-300'
                }`}>
                  {user.isController ? 'ROOT OPERATOR' : 'VERIFIED'}
                </span>
              </div>
              <div className="text-[10px] text-gray-400">
                {user.isController
                  ? 'Active session has full outcome rigging & financial approval clearance'
                  : 'Active session configured for real-money wagering and withdrawal payouts'}
              </div>
            </div>
          </div>
        </div>

        {/* Separate Login Portals Navigation */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <button
            id="mine-player-login-btn"
            onClick={() => {
              soundEffects.click();
              onOpenAuth('player');
            }}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:text-white"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Player Login</span>
          </button>

          <button
            id="mine-controller-login-btn"
            onClick={() => {
              soundEffects.click();
              onOpenAuth('controller');
            }}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Controller</span>
          </button>
        </div>
      </div>

      {/* Account Menu Navigation */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-md divide-y divide-white/5">
        {onOpenAdmin && (
          <button
            id="mine-open-admin-btn"
            onClick={() => { soundEffects.click(); onOpenAdmin(); }}
            className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent hover:bg-amber-500/15 transition-colors border-l-2 border-[#D4AF37]"
          >
            <div className="flex items-center gap-2.5 text-[#F2D06B] font-semibold">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              <span>👑 Master Operator & Outcome Rigging Room</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold uppercase">
              Control
            </span>
          </button>
        )}

        <button
          onClick={() => { soundEffects.click(); onOpenWallet('records'); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <History className="w-4 h-4 text-[#D4AF37]" />
            <span>Financial Transaction Records</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#666]" />
        </button>

        <button
          onClick={() => { soundEffects.click(); onOpenWallet('withdraw'); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <span>Bank Card & UPI Settlement Channels</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#666]" />
        </button>

        {/* KYC Compliance Row */}
        <button
          onClick={() => { soundEffects.click(); onOpenKYC?.(); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Identity & KYC Verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              user.kyc?.status === 'verified'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : user.kyc?.status === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border border-white/10'
            }`}>
              {user.kyc?.status === 'verified' ? 'Verified' : user.kyc?.status === 'pending' ? 'Reviewing' : 'Required'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#666]" />
          </div>
        </button>

        {/* Responsible Gaming Row */}
        <button
          onClick={() => { soundEffects.click(); onOpenResponsibleGaming?.(); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <HeartHandshake className="w-4 h-4 text-sky-400" />
            <span>Responsible Gaming & Limits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">18+</span>
            <ChevronRight className="w-4 h-4 text-[#666]" />
          </div>
        </button>

        {/* Provably Fair Verifier Row */}
        <button
          onClick={() => { soundEffects.click(); onOpenProvablyFair?.(); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span>Provably Fair Cryptographic Verifier</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#666]" />
        </button>

        {/* Compliance & Legal Policies Row */}
        <button
          onClick={() => { soundEffects.click(); onOpenLegalPolicies?.(); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <Scale className="w-4 h-4 text-slate-300" />
            <span>Compliance, AML & Legal Policies</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#666]" />
        </button>

        <button
          onClick={() => { soundEffects.click(); onOpenSupport(); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[#E0E0E0]">
            <Headphones className="w-4 h-4 text-[#D4AF37]" />
            <span>24/7 VIP Concierge Support</span>
          </div>
          <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider">Online</span>
        </button>

        <button
          onClick={() => { soundEffects.click(); onLogout(); }}
          className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs text-rose-400 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Terminate Session (Sign Out)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#666]" />
        </button>
      </div>
    </div>
  );
};
