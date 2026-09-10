import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Phone, Lock, Gift, UserPlus, LogIn, X, CheckCircle2, 
  Sparkles, ChevronDown, Crown, Users, ArrowRight, AlertCircle, RefreshCw,
  Gamepad2, KeyRound, Eye, EyeOff, ShieldAlert, Check, Zap
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'register' | 'login' | 'switch' | 'controller' | 'player';
  defaultInviteCode?: string;
  onOpenControllerRoom?: () => void;
  onOpenDualScreen?: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
];

const PRESET_PLAYERS = [
  {
    id: 'UID1082914',
    name: 'Rajesh Kumar',
    phone: '9811223344',
    fullPhone: '+91 9811223344',
    balance: 2450.00,
    vip: 3,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'UID2938172',
    name: 'Priya Sharma',
    phone: '9722334455',
    fullPhone: '+91 9722334455',
    balance: 5800.00,
    vip: 4,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'UID3847192',
    name: 'Amit Verma',
    phone: '9933445566',
    fullPhone: '+91 9933445566',
    balance: 1120.00,
    vip: 2,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'UID4728193',
    name: 'Vikram Malhotra',
    phone: '9844556677',
    fullPhone: '+91 9844556677',
    balance: 14500.00,
    vip: 6,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  defaultInviteCode = '5226410218444',
  onOpenControllerRoom,
  onOpenDualScreen
}) => {
  // Top Portal Selector: 'player' | 'controller' | 'switch' | 'dual'
  const [activePortal, setActivePortal] = useState<'player' | 'controller' | 'switch' | 'dual'>(
    initialMode === 'controller' ? 'controller' : initialMode === 'switch' ? 'switch' : 'player'
  );

  // Player Portal Sub-Tab: 'login' | 'register'
  const [playerTab, setPlayerTab] = useState<'login' | 'register'>(
    initialMode === 'register' ? 'register' : 'login'
  );

  // Player Form Fields
  const [playerPhone, setPlayerPhone] = useState('9811223344');
  const [playerName, setPlayerName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [playerPassword, setPlayerPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [showPlayerPassword, setShowPlayerPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState(defaultInviteCode);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Master Controller Form Fields
  const [controllerEmail, setControllerEmail] = useState('arpitasinghmcoin@gmail.com');
  const [controllerPasskey, setControllerPasskey] = useState('admin');
  const [controller2FA, setController2FA] = useState('777999');
  const [showControllerPasskey, setShowControllerPasskey] = useState(false);

  // Common UI states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePlayers, setActivePlayers] = useState<any[]>([]);

  useEffect(() => {
    if (initialMode === 'controller') {
      setActivePortal('controller');
    } else if (initialMode === 'switch') {
      setActivePortal('switch');
    } else {
      setActivePortal('player');
      setPlayerTab(initialMode === 'register' ? 'register' : 'login');
    }
    setError('');
    setSuccessMsg('');
    if (isOpen) {
      loadActivePlayers();
    }
  }, [initialMode, isOpen]);

  const loadActivePlayers = async () => {
    try {
      const res = await api.getActivePlayers();
      if (res && res.players) {
        setActivePlayers(res.players);
      }
    } catch {
      // Ignored
    }
  };

  if (!isOpen) return null;

  // --- 1. Master Controller Authentication ---
  const handleControllerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEffects.click();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await api.loginController(controllerEmail, controllerPasskey, controller2FA);
      if (res && res.success) {
        soundEffects.win();
        setSuccessMsg('Master Controller Clearance Granted! Launching Operator Console...');
        setTimeout(() => {
          onLoginSuccess(res.user);
          onClose();
          if (onOpenControllerRoom) onOpenControllerRoom();
        }, 600);
      } else {
        setError(res?.message || 'Access Denied: Invalid Master Controller credentials.');
      }
    } catch {
      // Fallback claim controller
      try {
        const fallbackRes = await api.claimController();
        if (fallbackRes && fallbackRes.success) {
          soundEffects.win();
          onLoginSuccess(fallbackRes.user);
          onClose();
          return;
        }
      } catch {
        // Ignored
      }
      setError('Connection to Master Controller authentication cluster failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Fast Pass for Master Controller
  const handleFastPassController = async () => {
    soundEffects.click();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.claimController();
      if (res && res.success) {
        soundEffects.win();
        onLoginSuccess(res.user);
        onClose();
        if (onOpenControllerRoom) onOpenControllerRoom();
      } else {
        setError('Fast Pass activation failed. Please enter Master Passkey.');
      }
    } catch {
      setError('Unable to reach Master Controller gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Player Authentication ---
  const handlePlayerAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.click();
    setError('');
    setSuccessMsg('');

    if (!playerPhone || playerPhone.length < 5) {
      setError('Please enter a valid mobile number or Player ID');
      return;
    }
    if (!playerPassword || playerPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (playerTab === 'register') {
      if (playerPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!agreeTerms) {
        setError('Please accept the Fair Play agreement and Privacy Policy');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (playerTab === 'register') {
        const fullPhone = playerPhone.startsWith('+') ? playerPhone : `${countryCode} ${playerPhone}`;
        const res = await api.registerUser(fullPhone, inviteCode, playerPassword, playerName || undefined);
        if (res && res.success) {
          soundEffects.win();
          setSuccessMsg('Registration successful! ₹500 Starter Bonus credited to your wallet.');
          setTimeout(() => {
            onLoginSuccess(res.user);
            onClose();
          }, 800);
        } else {
          setError(res?.message || 'Player registration failed');
        }
      } else {
        const res = await api.loginPlayer(playerPhone, playerPassword);
        if (res && res.success) {
          soundEffects.win();
          setSuccessMsg(`Welcome back, ${res.user.name}!`);
          setTimeout(() => {
            onLoginSuccess(res.user);
            onClose();
          }, 500);
        } else if (res?.isControllerAccount) {
          setError(res.message);
          // Suggest switching to controller portal
        } else {
          setError(res?.message || 'Player account not found. Please verify number or register.');
        }
      }
    } catch {
      setError('Network communication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Preset Player Fast Sign In
  const handleQuickPresetLogin = async (preset: typeof PRESET_PLAYERS[0]) => {
    soundEffects.click();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.switchUser(preset.id);
      if (res && res.success) {
        soundEffects.win();
        onLoginSuccess(res.user);
        onClose();
      } else {
        setPlayerPhone(preset.phone);
        setPlayerPassword('password123');
      }
    } catch {
      setPlayerPhone(preset.phone);
      setPlayerPassword('password123');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Multi-Player Perspective Switcher ---
  const handleSwitchUser = async (targetUserId: string) => {
    soundEffects.click();
    setIsLoading(true);
    try {
      const res = await api.switchUser(targetUserId);
      if (res && res.success) {
        soundEffects.click();
        onLoginSuccess(res.user);
        onClose();
      }
    } catch {
      setError('Failed to switch user perspective');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#D4AF37]/40 rounded-3xl overflow-hidden shadow-2xl my-6 text-white">
        
        {/* Top Header */}
        <div className="relative px-5 pt-4 pb-3 bg-gradient-to-b from-[#1C1810] via-[#121212] to-[#121212] border-b border-[#D4AF37]/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md font-black text-sm ${
              activePortal === 'controller'
                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black border border-amber-300'
                : 'bg-gradient-to-br from-[#F2D06B] to-[#AA771C] text-black'
            }`}>
              {activePortal === 'controller' ? <Crown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-[#F2D06B]">
                  {activePortal === 'controller' ? 'Master Controller Portal' : 'SKG8 VIP Gaming Gateway'}
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                  {activePortal === 'controller' ? 'Root Access' : 'v2.8 Live'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {activePortal === 'controller'
                  ? 'Authorized Operator Command & Rigging Room'
                  : 'Real Money Gaming, Wallet & Daily Bonuses'}
              </p>
            </div>
          </div>

          <button 
            id="auth-modal-close-btn"
            onClick={() => { soundEffects.click(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PRIMARY PORTAL SELECTOR: SEPARATE PLAYER VS CONTROLLER VS DUAL */}
        <div className="p-2 bg-[#0A0A0A] border-b border-white/10 grid grid-cols-4 gap-1">
          {/* Option 1: Player Login Portal */}
          <button
            id="auth-tab-player-portal"
            onClick={() => {
              soundEffects.click();
              setActivePortal('player');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activePortal === 'player'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Player</span>
          </button>

          {/* Option 2: Master Controller Portal */}
          <button
            id="auth-tab-controller-portal"
            onClick={() => {
              soundEffects.click();
              setActivePortal('controller');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activePortal === 'controller'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 font-black'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Operator</span>
          </button>

          {/* Option 3: Switch User Multi-Account */}
          <button
            id="auth-tab-switch-portal"
            onClick={() => {
              soundEffects.click();
              setActivePortal('switch');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activePortal === 'switch'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Switch</span>
          </button>

          {/* Option 4: Dual-View Player + Operator Testing */}
          <button
            id="auth-tab-dual-portal"
            onClick={() => {
              soundEffects.click();
              setActivePortal('dual');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activePortal === 'dual'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-indigo-300 animate-pulse" />
            <span className="truncate">Dual-Test</span>
          </button>
        </div>

        {/* Dynamic Portal Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* PORTAL 1: MASTER CONTROLLER DEDICATED AUTHENTICATION     */}
          {/* ======================================================== */}
          {activePortal === 'controller' && (
            <div className="space-y-4">
              {/* Operator Badge & Clearance Indicator */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-950/20 border border-amber-400/40 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[9px] uppercase tracking-wider">
                      Clearance Level 10
                    </span>
                    <span className="text-[10px] text-amber-300/80 font-mono">ROOT_SUPERVISOR</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Surveillance Ready</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Master Operator: Arpita Singh</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                  Authenticating as Master Controller unlocks real-time outcome rigging, deposit/withdrawal approval queues, user balance credits, and mathematical house profit controls.
                </p>
              </div>

              {/* Fast-Pass Quick Authentication Button */}
              <button
                id="controller-fast-pass-btn"
                type="button"
                onClick={handleFastPassController}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 font-bold text-xs flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>1-Click Operator Fast-Pass (Active Workspace Session)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>

              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <div className="flex-1 h-px bg-white/10"></div>
                <span>OR ENTER MASTER CREDENTIALS</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Master Controller Form */}
              <form onSubmit={handleControllerLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-amber-300 block mb-1">
                    Master Operator Identity / Email
                  </label>
                  <div className="relative">
                    <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input
                      type="text"
                      id="controller-email-input"
                      value={controllerEmail}
                      onChange={(e) => setControllerEmail(e.target.value)}
                      placeholder="arpitasinghmcoin@gmail.com"
                      className="w-full bg-[#181818] border border-amber-500/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-amber-300 block mb-1">
                    Master Security Passkey / Secret PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input
                      type={showControllerPasskey ? 'text' : 'password'}
                      id="controller-passkey-input"
                      value={controllerPasskey}
                      onChange={(e) => setControllerPasskey(e.target.value)}
                      placeholder="Enter master passkey (e.g. admin or master777)"
                      className="w-full bg-[#181818] border border-amber-500/40 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowControllerPasskey(!showControllerPasskey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showControllerPasskey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-300">
                      2FA Clearance Code (Dynamic Security Token)
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">TOKEN: 777999</span>
                  </div>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="controller-2fa-input"
                      value={controller2FA}
                      onChange={(e) => setController2FA(e.target.value)}
                      placeholder="6-digit security code (777999)"
                      className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="controller-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 mt-3"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Master Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      <span>Authorize Master Controller Terminal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom switch helper */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    setActivePortal('player');
                    setPlayerTab('login');
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Looking for regular gaming? <span className="text-[#D4AF37] font-bold">Switch to Player Login →</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PORTAL 2: STANDARD PLAYER DEDICATED LOGIN & REGISTER     */}
          {/* ======================================================== */}
          {activePortal === 'player' && (
            <div className="space-y-4">
              {/* Player Sub-Tab Switcher: Sign In vs Register */}
              <div className="grid grid-cols-2 p-1 bg-[#181818] rounded-xl border border-white/10 text-xs font-bold">
                <button
                  id="player-subtab-login"
                  type="button"
                  onClick={() => { soundEffects.click(); setPlayerTab('login'); setError(''); }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    playerTab === 'login'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Player Sign In</span>
                </button>
                <button
                  id="player-subtab-register"
                  type="button"
                  onClick={() => { soundEffects.click(); setPlayerTab('register'); setError(''); }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    playerTab === 'register'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register (+₹500 Bonus)</span>
                </button>
              </div>

              {/* Quick Sample Player Shortcuts */}
              {playerTab === 'login' && (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <div className="text-[11px] font-bold text-[#F2D06B] flex items-center justify-between">
                    <span>⚡ 1-Tap Quick Login (Active Real Players):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_PLAYERS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickPresetLogin(p)}
                        className="p-2 rounded-xl bg-[#181818] hover:bg-[#222] border border-white/10 hover:border-[#D4AF37]/50 text-left transition-all flex items-center gap-2 group"
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate group-hover:text-[#F2D06B]">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono font-bold">
                            ₹{p.balance.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Form */}
              <form onSubmit={handlePlayerAuthSubmit} className="space-y-3">
                {playerTab === 'register' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      Player Full Name / Handle
                    </label>
                    <input
                      type="text"
                      id="player-name-input"
                      placeholder="e.g. Rahul Sharma"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    {playerTab === 'login' ? 'Mobile Number or Player ID' : 'Mobile Number'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="h-10 px-3 rounded-xl bg-[#181818] border border-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1 hover:border-white/20"
                      >
                        <span>{COUNTRY_CODES.find((c) => c.code === countryCode)?.flag}</span>
                        <span>{countryCode}</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </button>

                      {showCountryPicker && (
                        <div className="absolute left-0 top-12 z-30 w-44 max-h-48 overflow-y-auto bg-[#181818] border border-white/10 rounded-xl shadow-2xl p-1">
                          {COUNTRY_CODES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCountryCode(c.code);
                                setShowCountryPicker(false);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                            >
                              <span>{c.flag}</span>
                              <span>{c.country}</span>
                              <span className="text-gray-500 ml-auto">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        id="player-phone-input"
                        placeholder="9811223344"
                        value={playerPhone}
                        onChange={(e) => setPlayerPhone(e.target.value)}
                        className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    {playerTab === 'register' ? 'Set Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPlayerPassword ? 'text' : 'password'}
                      id="player-password-input"
                      placeholder="Enter account password"
                      value={playerPassword}
                      onChange={(e) => setPlayerPassword(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPlayerPassword(!showPlayerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPlayerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {playerTab === 'register' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="password"
                          id="player-confirm-password-input"
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Invitation Code</label>
                      <div className="relative">
                        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F2D06B]" />
                        <input
                          type="text"
                          id="player-invite-code-input"
                          placeholder="Invitation Code"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="player-terms-check"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#181818] border-white/20 text-[#D4AF37] focus:ring-0"
                      />
                      <label htmlFor="player-terms-check" className="text-[11px] text-gray-400">
                        I am 18+ and agree to the <span className="text-[#D4AF37]">Privacy Policy</span> & <span className="text-[#D4AF37]">Terms of Service</span>
                      </label>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  id="player-auth-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#AA771C] text-black font-black text-xs shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Player Account...</span>
                    </>
                  ) : (
                    <>
                      <span>{playerTab === 'register' ? 'Register & Claim ₹500 Bonus' : 'Sign In to Player Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span>Are you a Platform Operator?</span>
                <button
                  type="button"
                  id="switch-to-controller-portal-btn"
                  onClick={() => {
                    soundEffects.click();
                    setActivePortal('controller');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Crown className="w-3 h-3" />
                  <span>Master Controller Login →</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PORTAL 3: SWITCH PERSPECTIVE BETWEEN ALL ACTIVE ACCOUNTS */}
          {/* ======================================================== */}
          {activePortal === 'switch' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Select active account to simulate gameplay & live bets:</span>
                <button 
                  onClick={loadActivePlayers}
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSwitchUser(player.id)}
                    className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#202020] border border-white/5 hover:border-[#D4AF37]/50 flex items-center justify-between text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{player.name}</span>
                          {player.isController && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                              Controller
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 block font-mono">{player.id} • {player.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#F2D06B] block">₹{player.balance.toFixed(2)}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">VIP {player.vipLevel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. DUAL PORTAL: SIMULTANEOUS PLAYER + OPERATOR TESTING    */}
          {/* ========================================================= */}
          {activePortal === 'dual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Simultaneous Testing Arena</h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Test both <span className="text-emerald-400 font-bold">Player login</span> and <span className="text-amber-400 font-bold">Operator login</span> side-by-side at the same time!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      🎮 Player Pane
                    </span>
                    <p className="text-gray-400 text-[10px] leading-tight">
                      Place bets on Aviator, Win Go, Mines, or Dragon Tiger with instant balance sync.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      👑 Operator Pane
                    </span>
                    <p className="text-gray-400 text-[10px] leading-tight">
                      Surveil bets live, rig crash points, force numbers/colors, and approve transactions.
                    </p>
                  </div>
                </div>

                <button
                  id="auth-launch-dual-screen-btn"
                  onClick={() => {
                    soundEffects.win();
                    if (onOpenDualScreen) {
                      onOpenDualScreen();
                    }
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4" />
                  <span>Launch Dual-Screen Arena</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#161616] border border-white/5 text-[11px] text-gray-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero interference: Separate sessions are maintained with custom user headers.</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
