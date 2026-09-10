import React from 'react';
import { Volume2, VolumeX, Headphones, Bell, PlusCircle, RefreshCw, Crown, User as UserIcon, Users, Gamepad2, Zap } from 'lucide-react';
import { UserProfile } from '../types';
import { soundEffects, getSoundMuted, setSoundMuted } from '../utils/audio';

interface HeaderProps {
  user: UserProfile;
  onOpenAuth: (mode: 'login' | 'register' | 'controller' | 'switch' | 'player') => void;
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
  onOpenSupport: () => void;
  onOpenAdmin?: () => void;
  onOpenDualScreen?: () => void;
  onOpenMultiplayer?: () => void;
  isDualPlayerActive?: boolean;
  onRefreshBalance: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenWallet,
  onOpenSupport,
  onOpenAdmin,
  onOpenDualScreen,
  onOpenMultiplayer,
  isDualPlayerActive = false,
  onRefreshBalance,
  isRefreshing = false
}) => {
  const [muted, setMuted] = React.useState(getSoundMuted());

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setSoundMuted(nextMuted);
    if (!nextMuted) soundEffects.click();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#D4AF37] to-[#F2D06B] rounded-lg flex items-center justify-center shadow-md shadow-[#D4AF37]/20">
            <span className="text-[#050505] font-extrabold text-base font-serif-luxury">S</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-serif-luxury">
                SKG<span className="text-[#D4AF37]">8</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] rounded font-bold uppercase tracking-widest">
                VIP
              </span>
            </div>
            <div className="text-[10px] text-[#A0A0A0] uppercase tracking-wider font-medium">Elite Club</div>
          </div>
        </div>

        {/* Right Action Icons & Wallet */}
        <div className="flex items-center gap-1.5">
          {/* Multi-User Play Button */}
          {onOpenMultiplayer && (
            <button
              id="header-multiplayer-btn"
              onClick={() => {
                soundEffects.click();
                onOpenMultiplayer();
              }}
              className={`px-2 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all ${
                isDualPlayerActive
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/40 animate-pulse'
                  : 'bg-indigo-950/40 hover:bg-indigo-900/50 border-indigo-500/40 text-indigo-300 hover:text-white'
              }`}
              title="Multi-User Play & Split Screen"
            >
              <Users className="w-3 h-3 text-indigo-400" />
              <span>Multi-Play</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </button>
          )}

          {/* Operator / Master Rigging Control Button */}
          {onOpenAdmin && (
            <button
              id="header-admin-control-btn"
              onClick={() => {
                soundEffects.click();
                onOpenAdmin();
              }}
              className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 border border-[#D4AF37]/50 text-[#D4AF37] hover:text-[#F2D06B] text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all animate-pulse"
              title="Open Operator Outcome Control Room"
            >
              <Crown className="w-3 h-3 text-[#D4AF37]" />
              <span>Rigging</span>
            </button>
          )}

          {/* Dual-View Player + Operator Test Button */}
          {onOpenDualScreen && (
            <button
              id="header-dual-view-btn"
              onClick={() => {
                soundEffects.click();
                onOpenDualScreen();
              }}
              className="px-2 py-1 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-400/50 text-indigo-300 hover:text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
              title="Test Player & Operator Login Simultaneously"
            >
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>Dual-Test</span>
            </button>
          )}

          {user.isRegistered ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 bg-[#0D0D0D] border border-white/10 rounded-full pl-3 pr-1.5 py-1 shadow-inner">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-[#D4AF37]">₹</span>
                  <span className="text-xs font-bold font-mono text-white">
                    {user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button
                    id="refresh-balance-btn"
                    onClick={() => {
                      soundEffects.click();
                      onRefreshBalance();
                    }}
                    className={`p-1 text-[#666] hover:text-[#D4AF37] transition-colors ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`}
                    title="Refresh Balance"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Add Real Money Quick Button */}
                <button
                  id="header-deposit-btn"
                  onClick={() => {
                    soundEffects.click();
                    onOpenWallet('deposit');
                  }}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-[#F2D06B] via-[#D4AF37] to-[#B8952E] hover:brightness-110 text-[#050505] font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-md shadow-[#D4AF37]/30 transition-transform active:scale-95"
                  title="Add Real Money to Wallet"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Money</span>
                </button>
              </div>

              {/* Quick Role Switcher Button */}
              {user.isController ? (
                <button
                  id="header-switch-to-player-btn"
                  onClick={() => {
                    soundEffects.click();
                    onOpenAuth('player');
                  }}
                  className="px-2 py-1 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/40 text-blue-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Switch to Player Login"
                >
                  <Gamepad2 className="w-3 h-3 text-blue-400" />
                  <span>Player</span>
                </button>
              ) : (
                <button
                  id="header-switch-to-controller-btn"
                  onClick={() => {
                    soundEffects.click();
                    onOpenAuth('controller');
                  }}
                  className="px-2 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Master Controller Operator Login"
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Controller</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Dedicated Player Login Button */}
              <button
                id="header-player-login-btn"
                onClick={() => {
                  soundEffects.click();
                  onOpenAuth('player');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all flex items-center gap-1"
                title="Sign in as a Player"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Player</span>
              </button>

              {/* Dedicated Master Controller Login Button */}
              <button
                id="header-controller-login-btn"
                onClick={() => {
                  soundEffects.click();
                  onOpenAuth('controller');
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-full border border-amber-500/40 shadow-sm transition-all flex items-center gap-1"
                title="Operator Terminal Login"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Controller</span>
              </button>

              {/* Register Button */}
              <button
                id="header-register-btn"
                onClick={() => {
                  soundEffects.click();
                  onOpenAuth('register');
                }}
                className="px-3 py-1.5 text-xs font-bold text-[#050505] bg-gradient-to-r from-[#D4AF37] to-[#B8952E] rounded-full shadow-md shadow-[#D4AF37]/20 uppercase tracking-wider hover:brightness-110"
              >
                Register
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={toggleSound}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#A0A0A0] hover:text-[#D4AF37] border border-white/10 transition-colors"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-[#666]" /> : <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
          </button>

          {/* Support Icon */}
          <button
            id="header-support-btn"
            onClick={() => {
              soundEffects.click();
              onOpenSupport();
            }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#A0A0A0] hover:text-[#D4AF37] border border-white/10 transition-colors"
            title="24/7 Live Support"
          >
            <Headphones className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </header>
  );
};
