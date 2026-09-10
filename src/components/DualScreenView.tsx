import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, User, Zap, Plane, Flame, DollarSign, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, RefreshCw, Layers, Sliders,
  ExternalLink, Maximize2, Minimize2, Radio, Check, Sparkles,
  ShieldAlert, ShieldCheck, ChevronRight, Send, Coins, Users, Eye
} from 'lucide-react';
import { api, getAuthHeaders } from '../services/api';
import { soundEffects } from '../utils/audio';

interface DualScreenViewProps {
  onClose: () => void;
  onRefreshGlobal?: () => void;
}

const PRESET_PLAYERS = [
  {
    id: 'UID1082914',
    name: 'Rajesh Kumar',
    phone: '+91 9811223344',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    vipLevel: 3,
  },
  {
    id: 'UID2938172',
    name: 'Priya Sharma',
    phone: '+91 9722334455',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    vipLevel: 4,
  },
  {
    id: 'UID3847192',
    name: 'Amit Verma',
    phone: '+91 9933445566',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    vipLevel: 2,
  },
  {
    id: 'UID4728193',
    name: 'Vikram Malhotra',
    phone: '+91 9844556677',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    vipLevel: 6,
  },
];

export const DualScreenView: React.FC<DualScreenViewProps> = ({ onClose, onRefreshGlobal }) => {
  // Layout mode: 'split' | 'player' | 'operator'
  const [layoutMode, setLayoutMode] = useState<'split' | 'player' | 'operator'>('split');
  const [activeMobileTab, setActiveMobileTab] = useState<'player' | 'operator'>('player');

  // Player State
  const [selectedPlayer, setSelectedPlayer] = useState(PRESET_PLAYERS[0]);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerSubGame, setPlayerSubGame] = useState<'wingo' | 'aviator' | 'wallet' | 'mines'>('wingo');
  
  // Player Win Go game state
  const [winGoState, setWinGoState] = useState<any>(null);
  const [selectedBetTarget, setSelectedBetTarget] = useState<{ type: 'color' | 'number' | 'size'; val: string | number } | null>({ type: 'color', val: 'green' });
  const [betAmount, setBetAmount] = useState<number>(100);
  const [playerBetStatus, setPlayerBetStatus] = useState<string | null>(null);

  // Player Aviator state
  const [aviatorState, setAviatorState] = useState<any>(null);
  const [aviatorBetPlaced, setAviatorBetPlaced] = useState(false);
  const [aviatorBetAmount, setAviatorBetAmount] = useState<number>(100);
  const [aviatorCashedOut, setAviatorCashedOut] = useState<number | null>(null);

  // Player Deposit / Withdrawal Form
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [depositUtr, setDepositUtr] = useState<string>('998877665544');
  const [wdrAmount, setWdrAmount] = useState<string>('300');
  const [playerWalletMsg, setPlayerWalletMsg] = useState<string | null>(null);

  // Operator State
  const [operatorOverview, setOperatorOverview] = useState<any>(null);
  const [liveBetsList, setLiveBetsList] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [operatorMsg, setOperatorMsg] = useState<string | null>(null);
  const [operatorLoading, setOperatorLoading] = useState(false);

  // Operator Rigging inputs
  const [lockColor, setLockColor] = useState<'green' | 'red' | 'violet' | null>(null);
  const [lockNumber, setLockNumber] = useState<number | null>(null);
  const [lockSize, setLockSize] = useState<'Big' | 'Small' | null>(null);
  const [aviatorTargetCrash, setAviatorTargetCrash] = useState<string>('2.50');
  const [broadcastInput, setBroadcastInput] = useState<string>('');
  const [receivedBroadcast, setReceivedBroadcast] = useState<string | null>(null);

  // Latency & Real-time pulse
  const [pingMs, setPingMs] = useState(14);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  // Show Toast helpers
  const showPlayerToast = (msg: string) => {
    setPlayerBetStatus(msg);
    setTimeout(() => setPlayerBetStatus(null), 3500);
  };

  const showOperatorToast = (msg: string) => {
    setOperatorMsg(msg);
    setTimeout(() => setOperatorMsg(null), 3500);
  };

  // 1. Fetch Player Data
  const fetchPlayerData = async () => {
    try {
      const pProfile = await api.getUserProfile(selectedPlayer.id);
      if (pProfile && pProfile.success && pProfile.user) {
        setPlayerProfile(pProfile.user);
      }

      const wg = await api.getWinGoState('1min', selectedPlayer.id);
      if (wg && wg.success) {
        setWinGoState(wg);
      }

      const av = await api.getAviatorState(selectedPlayer.id);
      if (av && av.success) {
        setAviatorState(av);
        if (av.userBet) {
          setAviatorBetPlaced(true);
          if (av.userBet.cashedOut) {
            setAviatorCashedOut(av.userBet.cashoutMultiplier);
          }
        } else if (av.phase === 'betting') {
          setAviatorBetPlaced(false);
          setAviatorCashedOut(null);
        }
      }
    } catch (e) {
      console.warn('Sync player failed', e);
    }
  };

  // 2. Fetch Operator Surveillance Data
  const fetchOperatorData = async () => {
    const t0 = Date.now();
    try {
      const [ov, bets, deps, wdrs] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminLiveBets(),
        api.getAdminDeposits(),
        api.getAdminWithdrawals(),
      ]);

      setPingMs(Math.max(8, Date.now() - t0));
      setLastSyncTime(Date.now());

      if (ov && ov.success) setOperatorOverview(ov);
      if (bets && bets.bets) setLiveBetsList(bets.bets);
      if (deps && deps.deposits) setPendingDeposits(deps.deposits);
      if (wdrs && wdrs.withdrawals) setPendingWithdrawals(wdrs.withdrawals);
    } catch (e) {
      console.warn('Sync operator failed', e);
    }
  };

  // Polling loop for simultaneous real-time test
  useEffect(() => {
    fetchPlayerData();
    fetchOperatorData();

    const interval = setInterval(() => {
      fetchPlayerData();
      fetchOperatorData();
    }, 1200);

    return () => clearInterval(interval);
  }, [selectedPlayer.id]);

  // --- PLAYER ACTIONS ---
  const handlePlayerInstantCredit = async (amount: number = 1000) => {
    setPlayerLoading(true);
    soundEffects.coins();
    try {
      const res = await api.creditTestFunds(amount, selectedPlayer.id);
      if (res && res.success) {
        showPlayerToast(`⚡ Added ₹${amount} Test Cash to ${selectedPlayer.name}!`);
        fetchPlayerData();
        fetchOperatorData();
      }
    } catch {
      showPlayerToast('Failed to credit funds');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handlePlayerPlaceWinGoBet = async () => {
    if (!selectedBetTarget) return;
    if (betAmount <= 0) return;
    setPlayerLoading(true);
    soundEffects.betPlaced();
    try {
      const res = await api.placeWinGoBet(
        '1min',
        selectedBetTarget.type,
        selectedBetTarget.val,
        betAmount,
        1,
        selectedPlayer.id
      );
      if (res && res.success) {
        showPlayerToast(`✅ Bet ₹${betAmount} on [${selectedBetTarget.val}] placed!`);
        fetchPlayerData();
        fetchOperatorData();
      } else {
        showPlayerToast(res?.message || 'Bet placement failed');
      }
    } catch (err: any) {
      showPlayerToast(err?.message || 'Bet failed');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handlePlayerPlaceAviatorBet = async () => {
    setPlayerLoading(true);
    soundEffects.betPlaced();
    try {
      const res = await api.placeAviatorBet(aviatorBetAmount, selectedPlayer.id);
      if (res && res.success) {
        setAviatorBetPlaced(true);
        showPlayerToast(`🚀 Aviator Bet ₹${aviatorBetAmount} Active!`);
        fetchPlayerData();
        fetchOperatorData();
      } else {
        showPlayerToast(res?.message || 'Could not place Aviator bet');
      }
    } catch (err: any) {
      showPlayerToast(err?.message || 'Failed to place Aviator bet');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handlePlayerCashoutAviator = async () => {
    setPlayerLoading(true);
    soundEffects.win();
    try {
      const res = await api.cashoutAviator(selectedPlayer.id);
      if (res && res.success) {
        setAviatorCashedOut(res.multiplier);
        showPlayerToast(`🎉 Cashed out ₹${res.winAmount?.toFixed(2)} at ${res.multiplier}X!`);
        fetchPlayerData();
        fetchOperatorData();
      } else {
        showPlayerToast(res?.message || 'Cashout failed');
      }
    } catch (err: any) {
      showPlayerToast(err?.message || 'Failed to cashout');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handlePlayerSubmitDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 100) {
      setPlayerWalletMsg('Minimum deposit is ₹100');
      return;
    }
    setPlayerLoading(true);
    soundEffects.click();
    try {
      const res = await api.submitDepositUtr(
        'DEP_TEST_' + Date.now(),
        amt,
        'UPI FAST',
        depositUtr,
        undefined,
        false, // Queued for operator approval!
        selectedPlayer.id
      );
      if (res && res.success) {
        setPlayerWalletMsg(`Deposit of ₹${amt} with UTR ${depositUtr} submitted to Operator Queue!`);
        showPlayerToast('Deposit submitted! Watch Operator approve it on the right ->');
        fetchPlayerData();
        fetchOperatorData();
      } else {
        setPlayerWalletMsg(res?.message || 'Deposit submission failed');
      }
    } catch {
      setPlayerWalletMsg('Deposit error');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handlePlayerSubmitWithdraw = async () => {
    const amt = parseFloat(wdrAmount);
    if (!amt || amt < 200) {
      setPlayerWalletMsg('Minimum withdrawal is ₹200');
      return;
    }
    setPlayerLoading(true);
    soundEffects.click();
    try {
      const res = await api.withdrawMoney(
        amt,
        {
          accountName: selectedPlayer.name,
          accountNumber: '918273645012',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          upiId: selectedPlayer.phone.replace(/[\s+-]/g, '') + '@upi',
        },
        selectedPlayer.id
      );
      if (res && res.success) {
        setPlayerWalletMsg(`Withdrawal of ₹${amt} submitted! Operator can approve on the right ->`);
        showPlayerToast(`Withdrawal of ₹${amt} submitted!`);
        fetchPlayerData();
        fetchOperatorData();
      } else {
        setPlayerWalletMsg(res?.message || 'Withdrawal failed');
      }
    } catch {
      setPlayerWalletMsg('Withdrawal error');
    } finally {
      setPlayerLoading(false);
    }
  };

  // --- OPERATOR ACTIONS ---
  const handleOperatorLockWinGo = async () => {
    setOperatorLoading(true);
    soundEffects.click();
    try {
      const res = await api.setWinGoNextDraw({
        gameType: '1min',
        number: lockNumber !== null ? lockNumber : undefined,
        color: lockColor || undefined,
        size: lockSize || undefined,
      });
      if (res && res.success) {
        showOperatorToast(`🎯 Win Go [1MIN] Outcome Locked! Next draw rigged.`);
        fetchOperatorData();
      }
    } catch {
      showOperatorToast('Failed to lock Win Go');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorForceWinGoDraw = async () => {
    setOperatorLoading(true);
    soundEffects.error();
    try {
      const res = await api.forceWinGoDrawNow('1min');
      if (res && res.success) {
        showOperatorToast(`⚡ Forced Win Go Draw! Result: ${res.result?.color?.toUpperCase()} #${res.result?.number}`);
        fetchOperatorData();
        fetchPlayerData();
        if (onRefreshGlobal) onRefreshGlobal();
      }
    } catch {
      showOperatorToast('Failed to force draw');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorLockAviator = async (targetMult?: number) => {
    const val = targetMult !== undefined ? targetMult : parseFloat(aviatorTargetCrash);
    if (!val || val < 1.01) return;
    setOperatorLoading(true);
    soundEffects.click();
    try {
      const res = await api.setAviatorTarget(val, 'manual');
      if (res && res.success) {
        showOperatorToast(`🎯 Aviator Next Crash Locked at ${val.toFixed(2)}X!`);
        fetchOperatorData();
      }
    } catch {
      showOperatorToast('Failed to set Aviator multiplier');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorFastLaunchAviator = async () => {
    setOperatorLoading(true);
    soundEffects.click();
    try {
      const res = await api.fastLaunchAviator();
      if (res && res.success) {
        showOperatorToast('🚀 Aviator plane launched immediately!');
        fetchOperatorData();
        fetchPlayerData();
      }
    } catch {
      showOperatorToast('Failed to launch flight');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorForceCrashAviator = async () => {
    setOperatorLoading(true);
    soundEffects.error();
    try {
      const res = await api.forceAviatorCrashNow();
      if (res && res.success) {
        showOperatorToast(`💥 Plane Crashed! ${res.message || ''}`);
        fetchOperatorData();
        fetchPlayerData();
      }
    } catch {
      showOperatorToast('Failed to crash flight');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorApproveDeposit = async (depId: string) => {
    setOperatorLoading(true);
    soundEffects.coins();
    try {
      const res = await api.adminDepositAction(depId, 'approve');
      if (res && res.success) {
        showOperatorToast(`✅ Deposit Approved! Credited to Player.`);
        fetchOperatorData();
        fetchPlayerData();
      }
    } catch {
      showOperatorToast('Failed to approve deposit');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorApproveWithdrawal = async (wdrId: string) => {
    setOperatorLoading(true);
    soundEffects.coins();
    try {
      const res = await api.adminWithdrawalAction(wdrId, 'approve');
      if (res && res.success) {
        showOperatorToast(`✅ Withdrawal Paid via IMPS!`);
        fetchOperatorData();
        fetchPlayerData();
      }
    } catch {
      showOperatorToast('Failed to process withdrawal');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorInjectBots = async () => {
    setOperatorLoading(true);
    soundEffects.click();
    try {
      const res = await api.injectSimulatedBots();
      if (res && res.success) {
        showOperatorToast(`👥 Injected 10 Live Bets into Room!`);
        fetchOperatorData();
      }
    } catch {
      showOperatorToast('Failed to inject bots');
    } finally {
      setOperatorLoading(false);
    }
  };

  const handleOperatorBroadcast = () => {
    if (!broadcastInput.trim()) return;
    setReceivedBroadcast(broadcastInput.trim());
    showOperatorToast(`📢 Message sent to Player screen!`);
    setBroadcastInput('');
  };

  const handleOpenWindow = (role: 'player' | 'operator') => {
    const url = window.location.origin + window.location.pathname + `?role=${role}`;
    window.open(url, `_blank_${role}`, 'width=500,height=800,menubar=no,toolbar=no');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-[#E0E0E0] flex flex-col overflow-hidden">
      {/* Top Universal Dual-Session Control Bar */}
      <header className="bg-[#0A0A0A] border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-extrabold text-[#050505] text-sm font-serif-luxury shadow-md">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight">Simultaneous Dual-Session Arena</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync ({pingMs}ms)
              </span>
            </div>
            <div className="text-[11px] text-[#888]">
              Testing 🎮 <strong>Player</strong> & 👑 <strong>Operator</strong> concurrently with real backend state
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Layout buttons on desktop */}
          <div className="hidden md:flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
            <button
              id="dual-view-split-btn"
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'split' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-[#888] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split (50/50)</span>
            </button>
            <button
              id="dual-view-player-only-btn"
              onClick={() => setLayoutMode('player')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'player' ? 'bg-indigo-600 text-white shadow-md' : 'text-[#888] hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Player Only</span>
            </button>
            <button
              id="dual-view-operator-only-btn"
              onClick={() => setLayoutMode('operator')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'operator' ? 'bg-amber-500 text-black shadow-md' : 'text-[#888] hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Operator Only</span>
            </button>
          </div>

          {/* External Window Openers */}
          <div className="flex items-center gap-1">
            <button
              id="open-player-new-tab-btn"
              onClick={() => handleOpenWindow('player')}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Open Player in Isolated Separate Window"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Player Window</span>
            </button>
            <button
              id="open-operator-new-tab-btn"
              onClick={() => handleOpenWindow('operator')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Open Operator in Isolated Separate Window"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Operator Window</span>
            </button>
          </div>

          {/* Close Dual View */}
          <button
            id="close-dual-view-btn"
            onClick={() => {
              soundEffects.click();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#888] hover:text-white transition-all ml-1"
            title="Exit Dual View"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Tab Toggle (< 768px) */}
      <div className="md:hidden flex border-b border-white/10 bg-[#0A0A0A]">
        <button
          onClick={() => setActiveMobileTab('player')}
          className={`flex-1 py-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'player'
              ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-[#888]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>🎮 Player Session ({selectedPlayer.name.split(' ')[0]})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('operator')}
          className={`flex-1 py-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'operator'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-[#888]'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>👑 Operator Command Console</span>
        </button>
      </div>

      {/* Main Dual Pane Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: 🎮 REAL-TIME PLAYER SESSION                  */}
        {/* ========================================================= */}
        <div 
          className={`flex-1 flex flex-col border-r border-white/10 bg-[#070707] overflow-y-auto ${
            layoutMode === 'operator' ? 'hidden' : ''
          } ${
            layoutMode === 'split' ? 'md:flex' : ''
          } ${
            activeMobileTab !== 'player' ? 'hidden md:flex' : ''
          }`}
        >
          {/* Player Header Bar */}
          <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-indigo-500/20 p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2.5">
              <img
                src={selectedPlayer.avatar}
                alt={selectedPlayer.name}
                className="w-10 h-10 rounded-full border border-indigo-400/40 object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm leading-tight">{selectedPlayer.name}</span>
                  <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold rounded">
                    VIP {playerProfile?.vipLevel ?? selectedPlayer.vipLevel}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">● Active Player</span>
                </div>
                <div className="text-[11px] text-[#888] flex items-center gap-2">
                  <span>ID: {selectedPlayer.id}</span>
                  <span>{selectedPlayer.phone}</span>
                </div>
              </div>
            </div>

            {/* Live Player Balance & Quick Credit */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-[#888] font-bold">Player Vault</div>
                <div className="text-base font-extrabold text-[#D4AF37] font-mono leading-none">
                  ₹{(playerProfile?.balance ?? 2450).toFixed(2)}
                </div>
              </div>
              <button
                id="player-test-credit-btn"
                onClick={() => handlePlayerInstantCredit(1000)}
                disabled={playerLoading}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1 transition-all"
                title="1-Tap Instant ₹1,000 Test Cash"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+₹1K</span>
              </button>
            </div>
          </div>

          {/* Quick Player Switcher Bar */}
          <div className="bg-[#050505] px-3 py-1.5 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] text-[#666] font-bold whitespace-nowrap">Switch Player:</span>
            {PRESET_PLAYERS.map((p) => {
              const isCurrent = p.id === selectedPlayer.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    soundEffects.click();
                    setSelectedPlayer(p);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white/5 text-[#888] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{p.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Broadcast Message from Operator (if received) */}
          {receivedBroadcast && (
            <div className="mx-3 mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Operator Dispatch:</strong> {receivedBroadcast}</span>
              </div>
              <button
                onClick={() => setReceivedBroadcast(null)}
                className="text-amber-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Player Toast notification */}
          {playerBetStatus && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-200 text-xs text-center font-bold">
              {playerBetStatus}
            </div>
          )}

          {/* Game Category Navigation for Player */}
          <div className="px-3 pt-3">
            <div className="grid grid-cols-4 gap-1.5 bg-[#0D0D0D] p-1 rounded-xl border border-white/10">
              {[
                { id: 'wingo', label: 'Win Go 1M', icon: Flame, badge: 'Color' },
                { id: 'aviator', label: 'Aviator', icon: Plane, badge: 'Crash' },
                { id: 'mines', label: 'Mines', icon: Sparkles, badge: '24X' },
                { id: 'wallet', label: 'Wallet Pay', icon: DollarSign, badge: 'Deposit' },
              ].map((sub) => {
                const Icon = sub.icon;
                const isSelected = playerSubGame === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      soundEffects.click();
                      setPlayerSubGame(sub.id as any);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center flex flex-col items-center justify-center gap-0.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'text-[#888] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- ACTIVE GAME: WIN GO 1M --- */}
          {playerSubGame === 'wingo' && (
            <div className="p-3 space-y-3">
              {/* Period Status Card */}
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div>
                    <span className="text-[#888]">Period #</span>
                    <span className="font-mono font-bold text-white ml-1">
                      {winGoState?.periodId || '202609071001'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#888]">Draw in:</span>
                    <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 font-mono font-bold rounded">
                      {winGoState?.secondsRemaining ?? 45}s
                    </span>
                  </div>
                </div>

                {/* Color Selector */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setSelectedBetTarget({ type: 'color', val: 'green' });
                    }}
                    className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                      selectedBetTarget?.val === 'green'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-lg'
                        : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <span>🟢 Green</span>
                    <span className="text-[10px] opacity-75">2X</span>
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setSelectedBetTarget({ type: 'color', val: 'violet' });
                    }}
                    className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                      selectedBetTarget?.val === 'violet'
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg'
                        : 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    <span>🟣 Violet</span>
                    <span className="text-[10px] opacity-75">4.5X</span>
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setSelectedBetTarget({ type: 'color', val: 'red' });
                    }}
                    className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                      selectedBetTarget?.val === 'red'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-lg'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span>🔴 Red</span>
                    <span className="text-[10px] opacity-75">2X</span>
                  </button>
                </div>

                {/* Big / Small Selector */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setSelectedBetTarget({ type: 'size', val: 'Big' });
                    }}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      selectedBetTarget?.val === 'Big'
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                        : 'bg-white/5 text-[#A0A0A0] hover:text-white border border-white/10'
                    }`}
                  >
                    ⭐ Big (5 - 9)
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setSelectedBetTarget({ type: 'size', val: 'Small' });
                    }}
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      selectedBetTarget?.val === 'Small'
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-white/5 text-[#A0A0A0] hover:text-white border border-white/10'
                    }`}
                  >
                    🔹 Small (0 - 4)
                  </button>
                </div>

                {/* Chips & Place Bet Button */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] text-[#888] font-bold">Wager:</span>
                  {[20, 50, 100, 500, 1000].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setBetAmount(chip)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all ${
                        betAmount === chip
                          ? 'bg-[#D4AF37] text-black shadow-sm'
                          : 'bg-white/5 text-[#888] hover:text-white'
                      }`}
                    >
                      ₹{chip}
                    </button>
                  ))}
                </div>

                <button
                  id="player-place-wingo-bet-btn"
                  onClick={handlePlayerPlaceWinGoBet}
                  disabled={playerLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Flame className="w-4 h-4" />
                  <span>Place Win Go Bet (₹{betAmount})</span>
                </button>
              </div>

              {/* Past 5 Results */}
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-2.5 text-xs">
                <div className="text-[10px] uppercase font-bold text-[#888] mb-1.5">Recent Period History</div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(winGoState?.history || [
                    { period: '1000', number: 7, color: 'green', size: 'Big' },
                    { period: '999', number: 2, color: 'red', size: 'Small' },
                    { period: '998', number: 0, color: 'violet', size: 'Small' },
                    { period: '997', number: 8, color: 'red', size: 'Big' },
                  ]).slice(0, 6).map((h: any, idx: number) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-black/50 border border-white/5 flex flex-col items-center gap-0.5 text-center shrink-0"
                    >
                      <span className="text-[9px] text-[#666]">#{String(h.period).slice(-3)}</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                        h.color === 'green' ? 'bg-emerald-600' : h.color === 'red' ? 'bg-rose-600' : 'bg-purple-600'
                      }`}>
                        {h.number}
                      </span>
                      <span className="text-[8px] text-[#888]">{h.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ACTIVE GAME: AVIATOR FLIGHT --- */}
          {playerSubGame === 'aviator' && (
            <div className="p-3 space-y-3">
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md">
                {/* Flight Screen Simulation */}
                <div className="h-36 rounded-xl bg-gradient-to-b from-[#0F172A] to-[#020617] border border-cyan-500/20 relative flex flex-col items-center justify-center overflow-hidden mb-3">
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold">
                    <Plane className="w-3.5 h-3.5 animate-bounce" />
                    <span>Flight #{aviatorState?.roundId || 'R889'}</span>
                  </div>

                  <div className="text-center z-10">
                    <div className={`text-4xl font-extrabold font-mono tracking-tight ${
                      aviatorState?.phase === 'crashed'
                        ? 'text-rose-500 animate-pulse'
                        : 'text-amber-400'
                    }`}>
                      {(aviatorState?.multiplier ?? 1.45).toFixed(2)}X
                    </div>
                    <div className="text-[11px] text-[#888] uppercase tracking-wider font-bold mt-1">
                      {aviatorState?.phase === 'flying' ? '✈️ FLIGHT IN AIR' : aviatorState?.phase === 'crashed' ? '💥 FLEW AWAY' : '⏳ WAITING FOR TAKEOFF'}
                    </div>
                  </div>

                  {/* Cashout overlay */}
                  {aviatorCashedOut && (
                    <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-20">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                      <div className="text-sm font-bold text-white">Won at {aviatorCashedOut}X!</div>
                      <div className="text-xs text-emerald-300 font-mono font-bold">
                        ₹{(aviatorBetAmount * aviatorCashedOut).toFixed(2)} Credited
                      </div>
                    </div>
                  )}
                </div>

                {/* Aviator Bet Controls */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-[#888] font-bold">Bet Wager (₹)</label>
                    <input
                      type="number"
                      value={aviatorBetAmount}
                      onChange={(e) => setAviatorBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full mt-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-end gap-1">
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAviatorBetAmount(amt)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold ${
                          aviatorBetAmount === amt ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-[#888]'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {aviatorBetPlaced && !aviatorCashedOut && aviatorState?.phase === 'flying' ? (
                  <button
                    id="player-aviator-cashout-btn"
                    onClick={handlePlayerCashoutAviator}
                    disabled={playerLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 animate-bounce"
                  >
                    <span>CASH OUT (₹{(aviatorBetAmount * (aviatorState?.multiplier ?? 1)).toFixed(2)})</span>
                  </button>
                ) : (
                  <button
                    id="player-aviator-place-bet-btn"
                    onClick={handlePlayerPlaceAviatorBet}
                    disabled={playerLoading || aviatorBetPlaced}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 ${
                      aviatorBetPlaced
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/30'
                    }`}
                  >
                    <Plane className="w-4 h-4" />
                    <span>{aviatorBetPlaced ? '✓ Bet Active (Flying)' : `Place Bet (₹${aviatorBetAmount})`}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* --- ACTIVE GAME: MINES 24X --- */}
          {playerSubGame === 'mines' && (
            <div className="p-3 space-y-3">
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mines Diamond Grid</span>
                  </span>
                  <span className="text-[11px] text-[#888]">3 Mines Hidden</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 my-3">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        soundEffects.coins();
                        showPlayerToast(`Tile #${i + 1} revealed: 💎 Gem Found! Multiplier: 1.28X`);
                      }}
                      className="h-10 rounded-lg bg-black/60 hover:bg-indigo-950/40 border border-white/10 hover:border-indigo-400/40 flex items-center justify-center text-sm transition-all"
                    >
                      💎
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePlayerInstantCredit(500)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Start New Mines Game
                </button>
              </div>
            </div>
          )}

          {/* --- WALLET (DEPOSIT & WITHDRAWAL TEST) --- */}
          {playerSubGame === 'wallet' && (
            <div className="p-3 space-y-3">
              {/* Deposit UTR Submission */}
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Real Deposit (Submit 12-Digit UTR for Operator Approval)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-[#888] font-bold">Amount (₹)</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full mt-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888] font-bold">12-Digit UPI UTR</label>
                    <input
                      type="text"
                      value={depositUtr}
                      onChange={(e) => setDepositUtr(e.target.value)}
                      className="w-full mt-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  id="player-submit-utr-btn"
                  onClick={handlePlayerSubmitDeposit}
                  disabled={playerLoading}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
                >
                  Submit UTR to Operator Desk
                </button>
              </div>

              {/* Withdrawal Request */}
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Request Bank/UPI Payout</span>
                </div>

                <div className="mb-2">
                  <label className="text-[10px] text-[#888] font-bold">Withdraw Amount (₹)</label>
                  <input
                    type="number"
                    value={wdrAmount}
                    onChange={(e) => setWdrAmount(e.target.value)}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <button
                  id="player-submit-wdr-btn"
                  onClick={handlePlayerSubmitWithdraw}
                  disabled={playerLoading}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow-md transition-all"
                >
                  Submit Withdrawal to Operator Queue
                </button>
              </div>

              {playerWalletMsg && (
                <div className="p-2 rounded-lg bg-black/80 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                  {playerWalletMsg}
                </div>
              )}
            </div>
          )}

          {/* Real-time sync note */}
          <div className="p-3 text-[11px] text-[#666] text-center border-t border-white/5 mt-auto">
            💡 Any bet placed or action taken here immediately mirrors to the Operator console on the right in real time.
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 👑 REAL-TIME OPERATOR COMMAND CONSOLE       */}
        {/* ========================================================= */}
        <div 
          className={`flex-1 flex flex-col bg-[#080808] overflow-y-auto ${
            layoutMode === 'player' ? 'hidden' : ''
          } ${
            layoutMode === 'split' ? 'md:flex' : ''
          } ${
            activeMobileTab !== 'operator' ? 'hidden md:flex' : ''
          }`}
        >
          {/* Operator Header Bar */}
          <div className="sticky top-0 z-10 bg-[#0C0C0C]/95 backdrop-blur-md border-b border-amber-500/30 p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-extrabold shadow-md">
                👑
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm leading-tight">Arpita Singh (Master Operator)</span>
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold rounded">
                    ADMIN
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">● Outcome Rigging Clearance</span>
                </div>
                <div className="text-[11px] text-[#888]">
                  Operator ID: UID_CONTROLLER • arpitasinghmcoin@gmail.com
                </div>
              </div>
            </div>

            {/* House Vault Stats */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#888] font-bold">House Vault Reserve</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono leading-none">
                ₹{(operatorOverview?.financials?.totalVaultBalance ?? 50000).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Operator Toast Notification */}
          {operatorMsg && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs text-center font-bold">
              {operatorMsg}
            </div>
          )}

          <div className="p-3 space-y-3">
            
            {/* 🔴 SECTION 1: LIVE PLAYER BETS SURVEILLANCE */}
            <div className="bg-[#0F0F0F] border border-amber-500/20 rounded-xl p-3 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Live Bets Surveillance (Watching Player on Left)</span>
                </div>
                <button
                  onClick={handleOperatorInjectBots}
                  disabled={operatorLoading}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-cyan-300 text-[10px] font-bold flex items-center gap-1 border border-cyan-500/30"
                >
                  <Users className="w-3 h-3" />
                  <span>+Inject 10 Room Bets</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {liveBetsList.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[#666]">
                    No active bets yet. Place a bet on the left to see it track here live!
                  </div>
                ) : (
                  liveBetsList.slice(0, 5).map((b, i) => (
                    <div
                      key={b.id || i}
                      className="p-2 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <div>
                          <div className="font-bold text-white text-xs">{b.userName || 'Player'}</div>
                          <div className="text-[10px] text-[#888]">{b.game} • Target: <span className="text-amber-400 font-bold">{b.target}</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-[#D4AF37]">₹{b.amount}</div>
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded">
                          {b.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 🎯 SECTION 2: LIVE OUTCOME RIGGING (WIN GO & AVIATOR) */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <span>Game Outcome Rigging Engine</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold rounded">
                  Rigging Active
                </span>
              </div>

              {/* Win Go Rigging Controls */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">1. Win Go [1MIN] Outcome Rig:</span>
                  <button
                    id="operator-force-draw-now-btn"
                    onClick={handleOperatorForceWinGoDraw}
                    disabled={operatorLoading}
                    className="px-2 py-0.5 rounded-md bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Zap className="w-3 h-3 text-rose-400" />
                    <span>⚡ Force Draw Now</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['green', 'violet', 'red'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setLockColor(lockColor === c ? null : c)}
                      className={`py-1 rounded-md text-[11px] font-bold capitalize transition-all border ${
                        lockColor === c
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-white/5 text-[#888] border-white/10 hover:text-white'
                      }`}
                    >
                      Lock {c}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(['Big', 'Small'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setLockSize(lockSize === s ? null : s)}
                      className={`py-1 rounded-md text-[11px] font-bold transition-all border ${
                        lockSize === s
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-white/5 text-[#888] border-white/10 hover:text-white'
                      }`}
                    >
                      Lock {s}
                    </button>
                  ))}
                </div>

                <button
                  id="operator-apply-wingo-rig-btn"
                  onClick={handleOperatorLockWinGo}
                  disabled={operatorLoading}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                >
                  Save Next Win Go Outcome Lock
                </button>
              </div>

              {/* Aviator Rigging Controls */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400">2. Aviator Flight Rig & Controls:</span>
                  <div className="flex items-center gap-1">
                    <button
                      id="operator-launch-aviator-btn"
                      onClick={handleOperatorFastLaunchAviator}
                      disabled={operatorLoading}
                      className="px-2 py-0.5 rounded-md bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plane className="w-3 h-3" />
                      <span>Takeoff</span>
                    </button>
                    <button
                      id="operator-crash-aviator-btn"
                      onClick={handleOperatorForceCrashAviator}
                      disabled={operatorLoading}
                      className="px-2 py-0.5 rounded-md bg-rose-600/40 hover:bg-rose-600/60 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Crash Flight</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1.05X (Kill)', val: 1.05 },
                    { label: '2.50X (Avg)', val: 2.50 },
                    { label: '7.77X (High)', val: 7.77 },
                    { label: '25.0X (Moon)', val: 25.00 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => handleOperatorLockAviator(preset.val)}
                      className="py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-bold text-amber-300 hover:text-white text-center"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 💳 SECTION 3: FINANCIAL APPROVALS DESK */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Financial Approvals Desk (Player Deposits & Payouts)</span>
                </span>
                <span className="text-[10px] text-[#888]">
                  {pendingDeposits.length} Deposits • {pendingWithdrawals.length} Payouts
                </span>
              </div>

              {/* Pending Deposits List */}
              {pendingDeposits.length === 0 && pendingWithdrawals.length === 0 ? (
                <div className="text-center py-3 text-xs text-[#666] bg-black/40 rounded-lg">
                  No pending requests. Submit a deposit or withdrawal on the left to review here!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {pendingDeposits.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-300">{dep.userName} • Deposit ₹{dep.amount}</div>
                        <div className="text-[10px] text-[#888]">UTR: <span className="font-mono text-white">{dep.utrNumber}</span></div>
                      </div>
                      <button
                        onClick={() => handleOperatorApproveDeposit(dep.id)}
                        disabled={operatorLoading}
                        className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve & Credit</span>
                      </button>
                    </div>
                  ))}

                  {pendingWithdrawals.map((wdr) => (
                    <div
                      key={wdr.id}
                      className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-300">{wdr.userName} • Payout ₹{wdr.amount}</div>
                        <div className="text-[10px] text-[#888]">UPI/Bank: {wdr.bankDetails?.upiId || 'Direct'}</div>
                      </div>
                      <button
                        onClick={() => handleOperatorApproveWithdrawal(wdr.id)}
                        disabled={operatorLoading}
                        className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Pay IMPS</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 💬 SECTION 4: DIRECT OPERATOR MESSAGE DISPATCH */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-md">
              <label className="text-[10px] uppercase font-bold text-[#888] block mb-1">
                Dispatch Broadcast Message to Player Screen
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g., 50% Cashback credited! Good luck!"
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOperatorBroadcast()}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handleOperatorBroadcast}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
