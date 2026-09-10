/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Flame, Gamepad2, Sparkles, Trophy, Zap, Shield, Crown, 
  ChevronRight, Gift, Coins, Share2, Compass, Layers, UserCheck,
  Diamond, Rocket, Disc, PlusCircle, Users
} from 'lucide-react';
import { Header } from './components/Header';
import { MarqueeTicker } from './components/MarqueeTicker';
import { AuthModal } from './components/AuthModal';
import { WinGoGame } from './components/WinGoGame';
import { TrxWinGoGame } from './components/TrxWinGoGame';
import { AviatorGame } from './components/AviatorGame';
import { SlotsMiniGame } from './components/SlotsMiniGame';
import { MinesGame } from './components/MinesGame';
import { DragonTigerGame } from './components/DragonTigerGame';
import { LimboGame } from './components/LimboGame';
import { RouletteGame } from './components/RouletteGame';
import { PromotionCenter } from './components/PromotionCenter';
import { ActivityCenter } from './components/ActivityCenter';
import { WalletModal } from './components/WalletModal';
import { MineProfile } from './components/MineProfile';
import { LiveSupportChat } from './components/LiveSupportChat';
import { AdminControlModal } from './components/AdminControlModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { KYCModal } from './components/KYCModal';
import { ResponsibleGamingModal } from './components/ResponsibleGamingModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { RealTimeTestBar } from './components/RealTimeTestBar';
import { DualScreenView } from './components/DualScreenView';
import { BottomNav } from './components/BottomNav';
import { MainTab, SubGame, Transaction, UserProfile, MultiplayerPlayer } from './types';
import { soundEffects } from './utils/audio';
import { api } from './services/api';

const INITIAL_USER: UserProfile = {
  id: 'UID5226410',
  phone: '+91 98***18444',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  balance: 850.00,
  vipLevel: 1,
  vipPoints: 240,
  invitationCode: '5226410218444',
  referrerCode: '5226410218444',
  isRegistered: true,
  registeredAt: Date.now() - 86400000 * 3,
  dailyCheckins: [1, 2],
  totalBets: 12,
  totalWins: 8,
  totalWonAmount: 1420.00,
  bankDetails: {
    accountName: 'Arpita Singh',
    accountNumber: '918273645012',
    ifscCode: 'SBIN0001234',
    upiId: 'arpitasingh@upi',
    bankName: 'State Bank of India'
  }
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX1001',
    type: 'deposit',
    amount: 500,
    status: 'completed',
    timestamp: Date.now() - 3600000 * 5,
    title: 'UPI Fast Recharge (+5% Bonus)',
    description: 'Deposited ₹500 + ₹25 Bonus'
  },
  {
    id: 'TX1002',
    type: 'win',
    amount: 380,
    status: 'completed',
    timestamp: Date.now() - 3600000 * 3,
    title: 'Win Go 1M Draw #4810 Payout',
    description: 'Color Green (2x) hit on Period 4810'
  },
  {
    id: 'TX1003',
    type: 'referral_bonus',
    amount: 145.50,
    status: 'completed',
    timestamp: Date.now() - 3600000 * 1,
    title: 'Referral Rebate Commission',
    description: 'Tier 1 & Tier 2 team turnover bonus'
  }
];

export default function App() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeSubGame, setActiveSubGame] = useState<SubGame>('wingo');
  
  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'controller' | 'switch' | 'player'>('login');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw' | 'records'>('deposit');
  const [walletInitialAmount, setWalletInitialAmount] = useState<number>(500);
  const [supportOpen, setSupportOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [dualScreenOpen, setDualScreenOpen] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Multiplayer simultaneous play state
  const [multiplayerModalOpen, setMultiplayerModalOpen] = useState(false);
  const [isDualPlayerActive, setIsDualPlayerActive] = useState(false);
  const [selectedPlayer2, setSelectedPlayer2] = useState<MultiplayerPlayer | null>(null);

  // Launch Readiness modals (KYC, Responsible Gaming, Provably Fair, Legal)
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [responsibleGamingOpen, setResponsibleGamingOpen] = useState(false);
  const [provablyFairOpen, setProvablyFairOpen] = useState(false);
  const [legalPoliciesOpen, setLegalPoliciesOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<'terms' | 'privacy' | 'aml' | 'fairplay'>('terms');

  // Sync user profile from server
  const syncUserProfile = async () => {
    try {
      const res = await api.getUserProfile();
      if (res && res.success && res.user) {
        setUser((prev) => ({
          ...prev,
          ...res.user,
        }));
      }
    } catch (e) {
      console.warn('Could not sync user profile', e);
    }
  };

  // Auto-open register screen with invitationCode 5226410218444 if url has /register
  useEffect(() => {
    syncUserProfile();

    // Initial fetch of multiplayer room roster to prepare Player 2 for quick co-play
    const initMultiplayerRoster = async () => {
      try {
        const res = await api.getMultiplayerRoomState('aviator');
        if (res && res.success && res.players && res.players.length > 0) {
          const second = res.players.find((p: MultiplayerPlayer) => p.id !== user.id) || res.players[0];
          if (second) setSelectedPlayer2(second);
        }
      } catch (err) {
        console.warn('Initial multiplayer sync', err);
      }
    };
    initMultiplayerRoster();

    // Check if user came via register link or multiplayer room
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(window.location.search);
      if (hash.includes('register') || params.get('action') === 'register') {
        setAuthMode('register');
        setAuthModalOpen(true);
      }
      if (params.get('multiplayer') === '1' || params.get('room')) {
        setMultiplayerModalOpen(true);
      }
      if (params.get('mode') === 'dual' || params.get('dual') === '1') {
        setDualScreenOpen(true);
      }
    }
  }, []);

  // Real-time Server-Sent Events (SSE) Stream Listener
  useEffect(() => {
    const stream = api.createEventStream((event, data) => {
      if (event === 'connected') {
        console.log('[SSE] Connected to real-time enterprise event stream:', data);
      } else if (event === 'balance_update') {
        if (data.userId === user.id && typeof data.newBalance === 'number') {
          setUser((prev) => ({ ...prev, balance: data.newBalance }));
        }
      } else if (event === 'deposit_credited') {
        if (data.userId === user.id) {
          setUser((prev) => ({ ...prev, balance: data.newBalance }));
          soundEffects.coins();
          handleAddTransaction({
            id: 'TX_DEP_' + Date.now(),
            type: 'deposit',
            amount: data.amount,
            status: 'completed',
            timestamp: Date.now(),
            title: 'Instant Gateway Settlement',
            description: `Auto-credited ₹${data.amount} via banking webhook`,
          });
        }
      }
    });

    return () => {
      if (stream) stream.close();
    };
  }, [user.id]);

  const handleUpdatePlayer2Balance = (newBalance: number) => {
    if (selectedPlayer2) {
      setSelectedPlayer2((prev) => (prev ? { ...prev, balance: newBalance } : null));
    }
  };

  const handleUpdateBalance = (newBalance: number) => {
    setUser((prev) => ({ ...prev, balance: newBalance }));
  };

  const handleAddTransaction = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleRefreshBalance = () => {
    setIsRefreshingBalance(true);
    syncUserProfile().finally(() => {
      setTimeout(() => {
        setIsRefreshingBalance(false);
      }, 500);
    });
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'controller' | 'switch' | 'player' = 'player') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenWallet = (tab: 'deposit' | 'withdraw' | 'records' = 'deposit', presetAmount?: number) => {
    setWalletTab(tab);
    if (presetAmount) setWalletInitialAmount(presetAmount);
    setWalletModalOpen(true);
  };

  const handleLogout = () => {
    setUser((prev) => ({ ...prev, isRegistered: false, balance: 0 }));
    soundEffects.click();
    handleOpenAuth('login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex justify-center selection:bg-[#D4AF37] selection:text-[#050505]">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md bg-[#050505] border-x border-white/10 flex flex-col min-h-screen shadow-2xl relative">
        
        {/* Fixed Header */}
        <Header
          user={user}
          onOpenAuth={handleOpenAuth}
          onOpenWallet={handleOpenWallet}
          onOpenSupport={() => setSupportOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
          onOpenDualScreen={() => setDualScreenOpen(true)}
          onOpenMultiplayer={() => setMultiplayerModalOpen(true)}
          isDualPlayerActive={isDualPlayerActive}
          onRefreshBalance={handleRefreshBalance}
          isRefreshing={isRefreshingBalance}
        />

        {/* Live Marquee Winner Ticker */}
        <MarqueeTicker />

        {/* Main Body Content Scroll Area */}
        <main className="flex-1 p-3.5 pb-20 overflow-y-auto space-y-3">
          {/* TAB 1: HOME (GAMES HUB) */}
          {activeTab === 'home' && (
            <div className="space-y-3">
              {/* Official Welcome Promo Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0D0D0D] border border-white/10 p-5 text-white shadow-2xl">
                {/* Subtle Gold Blur Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full mb-2.5">
                    <span className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      Invite Code: 5226410218444
                    </span>
                  </div>

                  <h2 className="text-xl font-light text-white font-serif-luxury tracking-tight leading-snug">
                    The Elite <span className="italic text-[#D4AF37]">Trading Circle.</span>
                  </h2>
                  <p className="text-xs text-[#A0A0A0] mt-1 leading-relaxed">
                    Predict Colors, TRX Cryptographic Hashes & Win Up to 9x Instant Multiplier Payouts.
                  </p>

                  <div className="mt-4 flex items-center gap-2.5">
                    <button
                      id="hero-register-btn"
                      onClick={() => handleOpenAuth('register')}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-bold text-xs uppercase tracking-wider shadow-md shadow-[#D4AF37]/20 active:scale-95 transition-all flex items-center gap-1.5 hover:brightness-110"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Register Now
                    </button>
                    <button
                      id="hero-deposit-btn"
                      onClick={() => handleOpenWallet('deposit')}
                      className="px-3.5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-colors"
                    >
                      +5% Deposit Bonus
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Real Money Quick Recharge Bar */}
              <div className="bg-gradient-to-br from-[#1A160C] via-[#0D0D0D] to-[#0D0D0D] border border-[#D4AF37]/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#D4AF37]/10 blur-[40px] rounded-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                      ₹
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Add Real Money</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                          +5% Instant Bonus
                        </span>
                      </div>
                      <div className="text-[10px] text-[#A0A0A0]">UPI • PhonePe • GPay • Paytm • Cards • USDT</div>
                    </div>
                  </div>

                  <button
                    id="home-quick-deposit-btn"
                    onClick={() => handleOpenWallet('deposit')}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-black text-xs uppercase tracking-wider shadow-md shadow-[#D4AF37]/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    + Add Money
                  </button>
                </div>

                {/* Fast Deposit Amount Chips */}
                <div className="grid grid-cols-4 gap-1.5 relative z-10">
                  {[300, 500, 1000, 2000, 5000, 10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        soundEffects.click();
                        handleOpenWallet('deposit', amt);
                      }}
                      className="py-2 px-1 rounded-xl bg-white/5 hover:bg-[#D4AF37]/15 border border-white/5 hover:border-[#D4AF37]/40 text-center transition-all group active:scale-95"
                    >
                      <div className="text-xs font-bold font-mono text-white group-hover:text-[#D4AF37]">₹{amt >= 1000 ? `${amt / 1000}k` : amt}</div>
                      <div className="text-[8px] text-emerald-400 font-semibold">+₹{Math.floor(amt * 0.05)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-User Simultaneous Play Hub Banner */}
              <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-white font-bold text-sm font-serif-luxury">Multi-User Live Arena</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Simultaneous
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Play with friends simultaneously: Split-Screen Dual Play (2 players on 1 device) or Multi-Tab & Device link.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      id="home-open-dual-arena-btn"
                      onClick={() => {
                        soundEffects.win();
                        setDualScreenOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-md shadow-amber-500/20 transition-transform active:scale-95 flex items-center gap-1.5 animate-pulse"
                      title="Test Player + Operator Login Simultaneously"
                    >
                      <Zap className="w-3.5 h-3.5 text-black" />
                      <span>Dual-View Arena</span>
                    </button>

                    <button
                      id="home-open-multiplayer-btn"
                      onClick={() => {
                        soundEffects.click();
                        setMultiplayerModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>2-Player Mode</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Category Selector Grid */}
              <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-1.5 grid grid-cols-4 gap-1.5 shadow-md">
                {[
                  { id: 'wingo', label: 'Win Go', icon: Flame, badge: 'Hot' },
                  { id: 'trx', label: 'TRX Hash', icon: Zap, badge: 'Crypto' },
                  { id: 'aviator', label: 'Aviator', icon: Trophy, badge: 'Crash' },
                  { id: 'mines', label: 'Mines', icon: Diamond, badge: '24X' },
                  { id: 'dragontiger', label: 'Dragon-Tiger', icon: Shield, badge: 'Live' },
                  { id: 'limbo', label: 'Limbo', icon: Rocket, badge: '1000X' },
                  { id: 'roulette', label: 'Roulette', icon: Disc, badge: '36X' },
                  { id: 'slots', label: 'Slots 777', icon: Sparkles, badge: 'Jackpot' },
                ].map((game) => {
                  const Icon = game.icon;
                  const isActive = activeSubGame === game.id;
                  return (
                    <button
                      key={game.id}
                      id={`subgame-tab-${game.id}`}
                      onClick={() => {
                        soundEffects.click();
                        setActiveSubGame(game.id as SubGame);
                      }}
                      className={`py-2 px-1 rounded-lg text-center flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                        isActive
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-bold shadow-md shadow-[#D4AF37]/20 scale-102'
                          : 'text-[#A0A0A0] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                        isActive ? 'bg-[#050505] text-[#D4AF37]' : 'bg-white/5 text-[#666]'
                      }`}>
                        {game.badge}
                      </span>
                      <Icon className="w-4 h-4 mt-0.5" />
                      <span className="text-[11px] font-bold leading-tight truncate max-w-full">{game.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Game Component Render */}
              {activeSubGame === 'wingo' && (
                <WinGoGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}

              {activeSubGame === 'trx' && (
                <TrxWinGoGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}

              {activeSubGame === 'aviator' && (
                <AviatorGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                  onOpenAdmin={() => setAdminModalOpen(true)}
                  onOpenMultiplayer={() => setMultiplayerModalOpen(true)}
                  isDualPlayerActive={isDualPlayerActive}
                  onToggleDualPlayer={(active) => setIsDualPlayerActive(active)}
                  selectedPlayer2={selectedPlayer2}
                  onSelectPlayer2={(p) => setSelectedPlayer2(p)}
                  onUpdatePlayer2Balance={handleUpdatePlayer2Balance}
                />
              )}

              {activeSubGame === 'mines' && (
                <MinesGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}

              {activeSubGame === 'dragontiger' && (
                <DragonTigerGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}

              {activeSubGame === 'limbo' && (
                <LimboGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}

              {activeSubGame === 'roulette' && (
                <RouletteGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}

              {activeSubGame === 'slots' && (
                <SlotsMiniGame
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onAddTransaction={handleAddTransaction}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenWallet={handleOpenWallet}
                />
              )}
            </div>
          )}

          {/* TAB 2: ACTIVITY */}
          {activeTab === 'activity' && (
            <ActivityCenter
              user={user}
              onUpdateBalance={handleUpdateBalance}
              onAddTransaction={handleAddTransaction}
              onOpenAuth={() => handleOpenAuth('login')}
              onOpenWallet={handleOpenWallet}
            />
          )}

          {/* TAB 3: PROMOTION */}
          {activeTab === 'promotion' && (
            <PromotionCenter
              user={user}
              onUpdateBalance={handleUpdateBalance}
              onAddTransaction={handleAddTransaction}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          )}

          {/* TAB 4: WALLET */}
          {activeTab === 'wallet' && (
            <div className="space-y-3 pb-8">
              {/* Wallet Assets Card */}
              <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-[40px] rounded-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#666] font-bold">Total Wallet Assets</div>
                    <div className="font-mono text-2xl font-bold text-[#D4AF37] mt-0.5">
                      ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/30 uppercase tracking-wider">
                    VIP {user.vipLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/5 relative z-10">
                  <button
                    onClick={() => handleOpenWallet('deposit')}
                    className="py-3 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#B8952E] text-[#050505] font-black text-xs uppercase tracking-wider shadow-md shadow-[#D4AF37]/20 active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Real Money</span>
                  </button>
                  <button
                    onClick={() => handleOpenWallet('withdraw')}
                    className="py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition-all"
                  >
                    Withdraw Funds
                  </button>
                </div>
              </div>

              {/* Add Real Money Quick Deposit Portal */}
              <div className="bg-[#0D0D0D] border border-[#D4AF37]/30 rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💰</span>
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Instant Deposit Amounts</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">+5% Bonus Active</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[300, 500, 1000, 2000, 5000, 10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        soundEffects.click();
                        handleOpenWallet('deposit', amt);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/5 hover:border-[#D4AF37]/50 text-center transition-all group"
                    >
                      <div className="text-xs font-bold font-mono text-white group-hover:text-[#D4AF37]">₹{amt >= 1000 ? `${amt / 1000}k` : amt}</div>
                      <div className="text-[8px] text-emerald-400 font-semibold mt-0.5">+₹{Math.floor(amt * 0.05)}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenWallet('deposit')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Choose Custom Amount / UPI / Cards / USDT</span>
                </button>
              </div>

              {/* Transactions List */}
              <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Recent Transactions</span>
                  <button
                    onClick={() => handleOpenWallet('records')}
                    className="text-[11px] text-[#D4AF37] hover:underline uppercase tracking-wider font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-[#E0E0E0]">{tx.title}</div>
                        <div className="text-[10px] text-[#666]">{tx.description}</div>
                      </div>
                      <div
                        className={`font-mono text-xs font-bold ${
                          tx.type === 'win' || tx.type === 'deposit' || tx.type === 'referral_bonus' || tx.type === 'checkin'
                            ? 'text-[#D4AF37]'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'win' || tx.type === 'deposit' || tx.type === 'referral_bonus' || tx.type === 'checkin'
                          ? `+₹${tx.amount.toFixed(2)}`
                          : `-₹${tx.amount.toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MINE (PROFILE) */}
          {activeTab === 'mine' && (
            <MineProfile
              user={user}
              onOpenWallet={handleOpenWallet}
              onOpenSupport={() => setSupportOpen(true)}
              onOpenAuth={handleOpenAuth}
              onOpenAdmin={() => setAdminModalOpen(true)}
              onOpenKYC={() => setKycModalOpen(true)}
              onOpenResponsibleGaming={() => setResponsibleGamingOpen(true)}
              onOpenProvablyFair={() => setProvablyFairOpen(true)}
              onOpenLegalPolicies={() => {
                setLegalInitialTab('terms');
                setLegalPoliciesOpen(true);
              }}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Floating Quick Add Real Money Pill for 1-Tap Access */}
        <div className="fixed bottom-20 right-4 z-40">
          <button
            id="floating-add-money-btn"
            onClick={() => {
              soundEffects.click();
              handleOpenWallet('deposit');
            }}
            className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#F2D06B] via-[#D4AF37] to-[#B8952E] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/40 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all border border-yellow-200"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>+ Add Money</span>
            <span className="text-[9px] px-1 py-0.2 rounded-full bg-black/80 text-[#D4AF37] font-bold">5%</span>
          </button>
        </div>

        {/* Floating Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Global Modals */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={(newUser) => setUser(newUser)}
          initialMode={authMode}
          defaultInviteCode="5226410218444"
          onOpenControllerRoom={() => setAdminModalOpen(true)}
          onOpenDualScreen={() => setDualScreenOpen(true)}
        />

        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          user={user}
          transactions={transactions}
          onUpdateBalance={handleUpdateBalance}
          onAddTransaction={handleAddTransaction}
          initialTab={walletTab}
          initialAmount={walletInitialAmount}
          onOpenAdmin={() => setAdminModalOpen(true)}
        />

        <LiveSupportChat
          isOpen={supportOpen}
          onClose={() => setSupportOpen(false)}
          onOpenWallet={handleOpenWallet}
        />

        {/* Master Operator Rigging & Outcome Control Modal */}
        <AdminControlModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          onRefreshUserData={syncUserProfile}
        />

        {/* Multi-User Simultaneous Play Modal */}
        <MultiplayerModal
          isOpen={multiplayerModalOpen}
          onClose={() => setMultiplayerModalOpen(false)}
          currentUser={user}
          isDualPlayerActive={isDualPlayerActive}
          onToggleDualPlayer={(active) => {
            setIsDualPlayerActive(active);
            if (active) setActiveSubGame('aviator');
          }}
          selectedPlayer2={selectedPlayer2}
          onSelectPlayer2={(player) => setSelectedPlayer2(player)}
          onSwitchUser={async (newUserId) => {
            api.setAuthSession(undefined, newUserId);
            window.location.href = `/?player=${newUserId}`;
          }}
        />

        {/* Launch Readiness: KYC Identity Verification Modal */}
        <KYCModal
          isOpen={kycModalOpen}
          onClose={() => setKycModalOpen(false)}
          user={user}
          onUpdateUser={(updated) => setUser(updated)}
        />

        {/* Launch Readiness: Responsible Gaming & Limits Modal */}
        <ResponsibleGamingModal
          isOpen={responsibleGamingOpen}
          onClose={() => setResponsibleGamingOpen(false)}
          user={user}
          onUpdateUser={(updated) => setUser(updated)}
        />

        {/* Launch Readiness: Provably Fair Cryptographic Verifier Modal */}
        <ProvablyFairModal
          isOpen={provablyFairOpen}
          onClose={() => setProvablyFairOpen(false)}
        />

        {/* Launch Readiness: Legal & Compliance Disclosures Modal */}
        <LegalPoliciesModal
          isOpen={legalPoliciesOpen}
          onClose={() => setLegalPoliciesOpen(false)}
          initialTab={legalInitialTab}
        />

        {/* Real-Time Live Testing HUD & Sandbox Controls */}
        <RealTimeTestBar
          user={user}
          onUpdateBalance={handleUpdateBalance}
          onAddTransaction={handleAddTransaction}
          onSwitchUser={(newUser) => setUser(newUser)}
          onOpenAdmin={() => setAdminModalOpen(true)}
          onOpenDualScreen={() => setDualScreenOpen(true)}
          activeGame={activeSubGame}
        />

        {/* Simultaneous Player & Operator Arena Fullscreen Split-Screen View */}
        {dualScreenOpen && (
          <DualScreenView
            onClose={() => setDualScreenOpen(false)}
            onRefreshGlobal={syncUserProfile}
          />
        )}
      </div>
    </div>
  );
}
