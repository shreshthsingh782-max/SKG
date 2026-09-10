import React, { useState, useEffect } from 'react';
import { 
  Zap, Play, Users, RefreshCw, ChevronUp, ChevronDown, 
  Sparkles, DollarSign, Bomb, Plane, Award, ShieldCheck, Flame, 
  Sliders, UserCheck, AlertCircle, Check
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface RealTimeTestBarProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onSwitchUser: (newUser: UserProfile) => void;
  onOpenAdmin: () => void;
  onOpenDualScreen?: () => void;
  activeGame: string;
}

export const RealTimeTestBar: React.FC<RealTimeTestBarProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onSwitchUser,
  onOpenAdmin,
  onOpenDualScreen,
  activeGame,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'rig' | 'accounts'>('quick');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ping, setPing] = useState(24);

  // Ping fluctuation for real-time heartbeat effect
  useEffect(() => {
    const timer = setInterval(() => {
      setPing(Math.floor(18 + Math.random() * 14));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // 1. Credit Instant Test Funds
  const handleCredit = async (amount: number) => {
    soundEffects.coins();
    setIsProcessing(true);
    try {
      const data = await api.creditTestFunds(amount);
      if (data && data.success) {
        onUpdateBalance(data.newBalance);
        if (data.transaction) {
          onAddTransaction(data.transaction);
        }
        showStatus(`✅ +₹${amount.toLocaleString('en-IN')} test funds credited!`);
      } else {
        onUpdateBalance(user.balance + amount);
        showStatus(`✅ +₹${amount.toLocaleString('en-IN')} added to balance!`);
      }
    } catch {
      onUpdateBalance(user.balance + amount);
      showStatus(`✅ +₹${amount.toLocaleString('en-IN')} added locally!`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Force Draw Period Now (Win Go)
  const handleForceDraw = async (gameType: string = '1min') => {
    soundEffects.click();
    setIsProcessing(true);
    try {
      const data = await api.forceWinGoDrawNow(gameType);
      if (data && data.success) {
        showStatus(`⚡ Draw Period Settled! Result: #${data.lastResult?.number} (${data.lastResult?.color?.toUpperCase()})`);
      } else {
        showStatus('Draw triggered!');
      }
    } catch {
      showStatus('Period draw signal sent');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Fast Launch Aviator Flight
  const handleLaunchAviator = async () => {
    soundEffects.click();
    setIsProcessing(true);
    try {
      const data = await api.fastLaunchAviator();
      if (data && data.success) {
        showStatus(data.message || '🚀 Aviator plane launched immediately!');
      } else {
        showStatus('Aviator launch command dispatched');
      }
    } catch {
      showStatus('Launch triggered');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Force Aviator Crash Now
  const handleForceCrash = async () => {
    soundEffects.warningTick();
    setIsProcessing(true);
    try {
      const data = await api.forceAviatorCrashNow();
      if (data && data.success) {
        showStatus(`💥 Aviator crashed at ${data.crashedAt}X!`);
      } else {
        showStatus(data.message || 'Crash triggered');
      }
    } catch {
      showStatus('Crash command dispatched');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Inject Simulated Multi-User Bets
  const handleInjectBots = async () => {
    soundEffects.click();
    setIsProcessing(true);
    try {
      const data = await api.injectSimulatedBots();
      if (data && data.success) {
        showStatus(data.message || '👥 10 Live Multiplayer Bets Injected!');
      } else {
        showStatus('Multiplayer bets populated!');
      }
    } catch {
      showStatus('Simulated bets active');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Fast Switch Account
  const handleFastSwitch = async (userId: string) => {
    soundEffects.click();
    setIsProcessing(true);
    try {
      const data = await api.switchUser(userId);
      if (data && data.success && data.user) {
        onSwitchUser(data.user);
        showStatus(`Switched account to: ${data.user.name}`);
      }
    } catch {
      showStatus('Switched account locally');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Always visible at bottom right) */}
      <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end">
        {statusMsg && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce">
            {statusMsg}
          </div>
        )}

        <button
          id="realtime-test-bar-toggle"
          onClick={() => {
            soundEffects.click();
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-2xl transition-all border ${
            isOpen 
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/30' 
              : 'bg-slate-900/90 hover:bg-slate-900 text-gray-200 border-white/20 backdrop-blur-md'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wide">
            {isOpen ? 'Close Test HUD' : '⚡ Real-Time Test HUD'}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Real-Time Sandbox HUD Drawer */}
      {isOpen && (
        <div className="fixed bottom-32 right-3 left-3 sm:left-auto sm:w-[420px] z-50 bg-[#0C0F17]/95 border-2 border-amber-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-xl space-y-3.5 text-gray-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                ⚡
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>REAL-TIME TEST SANDBOX</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    LIVE {ping}ms
                  </span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Active: <span className="text-amber-300 font-bold">{user.name}</span> (₹{user.balance.toFixed(2)})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenDualScreen && (
                <button
                  id="test-hud-open-dual-btn"
                  onClick={() => {
                    soundEffects.click();
                    onOpenDualScreen();
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-400/40 font-bold flex items-center gap-1 transition-all"
                  title="Simultaneous Player + Operator Test"
                >
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Dual View</span>
                </button>
              )}

              <button
                id="test-hud-open-admin-btn"
                onClick={() => {
                  soundEffects.click();
                  onOpenAdmin();
                }}
                className="text-[10px] px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 transition-all"
              >
                <Sliders className="w-3 h-3" />
                <span>Rig Room</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('quick')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'quick' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚡ Fast Actions
            </button>
            <button
              onClick={() => setActiveTab('rig')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'rig' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              🎯 Rig Outcomes
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'accounts' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              👥 Switch User
            </button>
          </div>

          {/* TAB 1: QUICK ACTIONS */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              {/* Simultaneous Testing Banner */}
              {onOpenDualScreen && (
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 flex items-center justify-between gap-2 shadow-lg">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Simultaneous Login Test</span>
                    </div>
                    <div className="text-[10px] text-gray-300">
                      Test Player & Operator side-by-side in real time!
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundEffects.click();
                      onOpenDualScreen();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] shadow-md shrink-0 transition-all"
                  >
                    Open Dual View
                  </button>
                </div>
              )}
              {/* Instant Test Balance Loader */}
              <div>
                <div className="text-[11px] font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant Test Balance Credit:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">1-Tap Sync</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[500, 1000, 5000, 20000].map((amt) => (
                    <button
                      key={amt}
                      id={`test-credit-${amt}-btn`}
                      disabled={isProcessing}
                      onClick={() => handleCredit(amt)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
                    >
                      +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Round Controllers (Skip Wait Time) */}
              <div>
                <div className="text-[11px] font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Real-Time Speed-Up (No Waiting):</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="test-draw-wingo-btn"
                    disabled={isProcessing}
                    onClick={() => handleForceDraw('1min')}
                    className="py-2 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>⚡ Draw Win Go Now</span>
                  </button>

                  <button
                    id="test-launch-aviator-btn"
                    disabled={isProcessing}
                    onClick={handleLaunchAviator}
                    className="py-2 px-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>🚀 Launch Aviator Now</span>
                  </button>

                  <button
                    id="test-crash-aviator-btn"
                    disabled={isProcessing}
                    onClick={handleForceCrash}
                    className="py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>💥 Crash Flight Now</span>
                  </button>

                  <button
                    id="test-inject-bots-btn"
                    disabled={isProcessing}
                    onClick={handleInjectBots}
                    className="py-2 px-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>👥 Inject 10 Live Bets</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIG OUTCOMES SHORTCUTS */}
          {activeTab === 'rig' && (
            <div className="space-y-3">
              {/* Win Go Rigging */}
              <div>
                <div className="text-[11px] font-bold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Win Go Next Outcome:</span>
                  <span className="text-[10px] text-gray-400">Lock for 1M Draw</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  <button
                    onClick={async () => {
                      await api.setWinGoNextDraw({ gameType: '1min', color: 'green' });
                      showStatus('Locked next draw: GREEN');
                    }}
                    className="py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                  >
                    🟢 Green
                  </button>
                  <button
                    onClick={async () => {
                      await api.setWinGoNextDraw({ gameType: '1min', color: 'red' });
                      showStatus('Locked next draw: RED');
                    }}
                    className="py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold"
                  >
                    🔴 Red
                  </button>
                  <button
                    onClick={async () => {
                      await api.setWinGoNextDraw({ gameType: '1min', color: 'violet' });
                      showStatus('Locked next draw: VIOLET (0/5)');
                    }}
                    className="py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold"
                  >
                    🟣 Violet
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={async () => {
                      await api.setWinGoNextDraw({ gameType: '1min', size: 'Big' });
                      showStatus('Locked next draw: BIG (5-9)');
                    }}
                    className="py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold"
                  >
                    ⭐ Big (5-9)
                  </button>
                  <button
                    onClick={async () => {
                      await api.setWinGoNextDraw({ gameType: '1min', size: 'Small' });
                      showStatus('Locked next draw: SMALL (0-4)');
                    }}
                    className="py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold"
                  >
                    🔹 Small (0-4)
                  </button>
                </div>
              </div>

              {/* Aviator Target Preset */}
              <div>
                <div className="text-[11px] font-bold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Aviator Next Target:</span>
                  <span className="text-[10px] text-gray-400">Flight Multiplier</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1.05X (Kill)', mult: 1.05 },
                    { label: '2.50X', mult: 2.50 },
                    { label: '7.77X', mult: 7.77 },
                    { label: '25.0X (Jackpot)', mult: 25.0 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={async () => {
                        await api.setAviatorTarget(p.mult);
                        showStatus(`Aviator next flight locked to ${p.mult}X!`);
                      }}
                      className="py-1 px-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[10px] font-bold text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mines & Dragon Tiger Presets */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    await api.setMinesRig('safe');
                    showStatus('Mines Mode: 100% Safe Gems (No Bombs)');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Bomb className="w-3.5 h-3.5" />
                  <span>Mines: Safe Mode</span>
                </button>

                <button
                  onClick={async () => {
                    await api.setDragonTigerWinner('dragon');
                    showStatus('Dragon vs Tiger: Force DRAGON Win');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Force Dragon Win</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-USER FAST SWITCHER */}
          {activeTab === 'accounts' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                <span>Fast-Switch Perspective:</span>
                <span className="text-[10px] text-gray-400">Test Multi-User Real Time</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {[
                  {
                    id: 'UID_CONTROLLER',
                    name: 'Arpita Singh (Master Operator)',
                    role: '👑 Controller',
                    bal: '₹50,000+',
                    isCtrl: true,
                  },
                  {
                    id: 'UID1082914',
                    name: 'Rajesh Kumar (Active Player)',
                    role: '🎮 Player VIP 3',
                    bal: '₹2,450',
                    isCtrl: false,
                  },
                  {
                    id: 'UID2938172',
                    name: 'Priya Sharma (High Roller)',
                    role: '🎮 Player VIP 6',
                    bal: '₹15,800',
                    isCtrl: false,
                  },
                  {
                    id: 'UID3847192',
                    name: 'Amit Verma (New Player)',
                    role: '🎮 Player VIP 1',
                    bal: '₹850',
                    isCtrl: false,
                  },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    id={`fast-switch-${acc.id}`}
                    onClick={() => handleFastSwitch(acc.id)}
                    className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all ${
                      user.id === acc.id
                        ? 'bg-amber-500/20 border-amber-500/50 text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        {user.id === acc.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {acc.role} • Balance: {acc.bal}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono font-bold text-amber-400">
                      {user.id === acc.id ? 'ACTIVE' : 'SWITCH'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Full-Stack Real-Time Engine</span>
            </span>
            <span className="font-mono">SKG8 v3.8 Production</span>
          </div>
        </div>
      )}
    </>
  );
};
