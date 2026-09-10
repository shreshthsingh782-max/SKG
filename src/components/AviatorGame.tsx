import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, Zap, AlertTriangle, Trophy, TrendingUp, Server, 
  ShieldCheck, Users, Flame, Rocket, DollarSign, Check, 
  Sparkles, ChevronDown, MessageSquare, Gift, Sliders, ToggleLeft, ToggleRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MultiplayerPlayer, UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';
import { MultiplayerChatDrawer } from './MultiplayerChatDrawer';

interface AviatorGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onOpenAdmin?: () => void;
  onOpenMultiplayer?: () => void;
  isDualPlayerActive?: boolean;
  onToggleDualPlayer?: (active: boolean) => void;
  selectedPlayer2?: MultiplayerPlayer | null;
  onSelectPlayer2?: (player: MultiplayerPlayer) => void;
  onUpdatePlayer2Balance?: (newBalance: number) => void;
}

interface LiveBetItem {
  userId: string;
  userName: string;
  avatar?: string;
  amount: number;
  cashedOut: boolean;
  cashoutMultiplier?: number;
  winAmount?: number;
  timestamp: number;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
  bottom: number;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet,
  onOpenAdmin,
  onOpenMultiplayer,
  isDualPlayerActive = false,
  onToggleDualPlayer,
  selectedPlayer2 = null,
  onSelectPlayer2,
  onUpdatePlayer2Balance,
}) => {
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([1.42, 2.15, 8.94, 1.18, 3.50, 1.82, 14.20]);
  const [countdown, setCountdown] = useState(4);
  const [roundId, setRoundId] = useState('AV_LIVE');
  const [allLiveBets, setAllLiveBets] = useState<LiveBetItem[]>([]);

  // Room Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Deck 1 (Primary User) Bet & Auto-Cashout State
  const [betAmount, setBetAmount] = useState(50);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoCashout1, setAutoCashout1] = useState(false);
  const [autoCashoutTarget1, setAutoCashoutTarget1] = useState(2.00);

  // Deck 2 (Simultaneous Second Bet in Single-Player Mode)
  const [isDualDeckActive, setIsDualDeckActive] = useState(false);
  const [deck2Amount, setDeck2Amount] = useState(50);
  const [deck2HasBet, setDeck2HasBet] = useState(false);
  const [deck2HasCashedOut, setDeck2HasCashedOut] = useState(false);
  const [deck2CashoutMultiplier, setDeck2CashoutMultiplier] = useState(0);
  const [deck2IsProcessing, setDeck2IsProcessing] = useState(false);
  const [autoCashout2, setAutoCashout2] = useState(false);
  const [autoCashoutTarget2, setAutoCashoutTarget2] = useState(3.50);

  // Player 2 (Co-Player) Bet State (for Dual Player Split Mode)
  const [p2BetAmount, setP2BetAmount] = useState(100);
  const [p2HasBet, setP2HasBet] = useState(false);
  const [p2HasCashedOut, setP2HasCashedOut] = useState(false);
  const [p2CashoutMultiplier, setP2CashoutMultiplier] = useState(0);
  const [p2IsProcessing, setP2IsProcessing] = useState(false);

  // Floating Emojis Layer
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const prevPhaseRef = useRef<string>('waiting');

  // Real-time Server Sync Loop (polls every 150ms)
  useEffect(() => {
    let isMounted = true;

    const pollServerState = async () => {
      try {
        const data = await api.getAviatorState();
        if (data && data.success && isMounted) {
          setGameState(data.phase);
          setMultiplier(data.multiplier);
          setCountdown(data.countdown);
          setRoundId(data.roundId);
          if (data.history) setRecentCrashes(data.history);
          if (data.allBets) setAllLiveBets(data.allBets);

          // Audio triggers on state changes
          if (data.phase === 'crashed' && prevPhaseRef.current === 'flying') {
            soundEffects.lose();
            if (hasBet && !hasCashedOut) {
              setHasBet(false);
            }
            if (deck2HasBet && !deck2HasCashedOut) {
              setDeck2HasBet(false);
            }
            if (p2HasBet && !p2HasCashedOut) {
              setP2HasBet(false);
            }
          } else if (data.phase === 'flying' && prevPhaseRef.current === 'waiting') {
            setHasCashedOut(false);
            setDeck2HasCashedOut(false);
            setP2HasCashedOut(false);
          } else if (data.phase === 'waiting' && prevPhaseRef.current === 'crashed') {
            setHasBet(false);
            setHasCashedOut(false);
            setDeck2HasBet(false);
            setDeck2HasCashedOut(false);
            setP2HasBet(false);
            setP2HasCashedOut(false);
          }

          prevPhaseRef.current = data.phase;
        }
      } catch (err) {
        // Fallback resilience
      }
    };

    const interval = setInterval(pollServerState, 150);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [hasBet, hasCashedOut, deck2HasBet, deck2HasCashedOut, p2HasBet, p2HasCashedOut]);

  // --- Player 1 Actions ---
  const handlePlaceBet = async () => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (betAmount > user.balance) {
      onOpenWallet();
      return;
    }

    setIsProcessing(true);
    soundEffects.betPlaced();

    try {
      const res = await api.placeAviatorBet(betAmount);
      if (res && res.success) {
        onUpdateBalance(res.newBalance);
        setHasBet(true);
        onAddTransaction({
          id: 'tx_av_' + Date.now(),
          type: 'bet',
          amount: betAmount,
          status: 'completed',
          timestamp: Date.now(),
          title: `Aviator Bet (${roundId})`,
          description: `Server-verified wager ₹${betAmount} on live flight`,
        });
      } else {
        alert(res?.message || 'Failed to place bet');
      }
    } catch {
      onUpdateBalance(user.balance - betAmount);
      setHasBet(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashout = async () => {
    if (!hasBet || hasCashedOut || gameState !== 'flying' || isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await api.cashoutAviator();
      if (res && res.success) {
        setHasCashedOut(true);
        setCashoutMultiplier(res.multiplier);
        soundEffects.win();
        soundEffects.coins();
        confetti({ particleCount: 70, spread: 60, colors: ['#D4AF37', '#FF0055', '#00FFFF', '#FFFFFF'] });

        onUpdateBalance(res.newBalance);
        if (res.transaction) {
          onAddTransaction(res.transaction);
        }
      } else {
        alert(res?.message || 'Flight ended before cashout arrived');
      }
    } catch {
      const winValue = parseFloat((betAmount * multiplier).toFixed(2));
      setHasCashedOut(true);
      setCashoutMultiplier(multiplier);
      onUpdateBalance(user.balance + winValue);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Player 2 Actions (Dual Player Mode) ---
  const handleP2PlaceBet = async () => {
    if (!selectedPlayer2) return;
    if (p2BetAmount > selectedPlayer2.balance) {
      alert(`Player 2 (${selectedPlayer2.name}) has insufficient balance (₹${selectedPlayer2.balance.toFixed(2)})`);
      return;
    }

    setP2IsProcessing(true);
    soundEffects.betPlaced();

    try {
      const res = await api.placeAviatorBet(p2BetAmount, selectedPlayer2.id);
      if (res && res.success) {
        if (onUpdatePlayer2Balance) onUpdatePlayer2Balance(res.newBalance);
        setP2HasBet(true);
      } else {
        alert(res?.message || 'Player 2 failed to place bet');
      }
    } catch {
      if (onUpdatePlayer2Balance) onUpdatePlayer2Balance(selectedPlayer2.balance - p2BetAmount);
      setP2HasBet(true);
    } finally {
      setP2IsProcessing(false);
    }
  };

  const handleP2Cashout = async () => {
    if (!selectedPlayer2 || !p2HasBet || p2HasCashedOut || gameState !== 'flying' || p2IsProcessing) return;

    setP2IsProcessing(true);
    try {
      const res = await api.cashoutAviator(selectedPlayer2.id);
      if (res && res.success) {
        setP2HasCashedOut(true);
        setP2CashoutMultiplier(res.multiplier);
        soundEffects.win();
        soundEffects.coins();
        confetti({ particleCount: 70, spread: 60, colors: ['#A855F7', '#3B82F6', '#10B981', '#FFFFFF'] });

        if (onUpdatePlayer2Balance) onUpdatePlayer2Balance(res.newBalance);
      } else {
        alert(res?.message || 'Flight ended before cashout arrived');
      }
    } catch {
      const winValue = parseFloat((p2BetAmount * multiplier).toFixed(2));
      setP2HasCashedOut(true);
      setP2CashoutMultiplier(multiplier);
      if (onUpdatePlayer2Balance) onUpdatePlayer2Balance(selectedPlayer2.balance + winValue);
    } finally {
      setP2IsProcessing(false);
    }
  };

  // --- Deck 2 Actions (Simultaneous Bet Deck for Single Player) ---
  const handleDeck2PlaceBet = async () => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (deck2Amount > user.balance) {
      onOpenWallet();
      return;
    }

    setDeck2IsProcessing(true);
    soundEffects.betPlaced();

    try {
      const res = await api.placeAviatorBet(deck2Amount);
      if (res && res.success) {
        onUpdateBalance(res.newBalance);
        setDeck2HasBet(true);
        onAddTransaction({
          id: 'tx_av2_' + Date.now(),
          type: 'bet',
          amount: deck2Amount,
          status: 'completed',
          timestamp: Date.now(),
          title: `Aviator Deck 2 Bet (${roundId})`,
          description: `Secondary wager ₹${deck2Amount} on live flight`,
        });
      } else {
        alert(res?.message || 'Failed to place deck 2 bet');
      }
    } catch {
      onUpdateBalance(user.balance - deck2Amount);
      setDeck2HasBet(true);
    } finally {
      setDeck2IsProcessing(false);
    }
  };

  const handleDeck2Cashout = async () => {
    if (!deck2HasBet || deck2HasCashedOut || gameState !== 'flying' || deck2IsProcessing) return;

    setDeck2IsProcessing(true);
    try {
      const res = await api.cashoutAviator();
      if (res && res.success) {
        setDeck2HasCashedOut(true);
        setDeck2CashoutMultiplier(res.multiplier);
        soundEffects.win();
        soundEffects.coins();
        confetti({ particleCount: 60, spread: 55, colors: ['#D4AF37', '#00FFFF', '#10B981'] });

        onUpdateBalance(res.newBalance);
        if (res.transaction) {
          onAddTransaction(res.transaction);
        }
      }
    } catch {
      const winValue = parseFloat((deck2Amount * multiplier).toFixed(2));
      setDeck2HasCashedOut(true);
      setDeck2CashoutMultiplier(multiplier);
      onUpdateBalance(user.balance + winValue);
    } finally {
      setDeck2IsProcessing(false);
    }
  };

  // --- Auto-Cashout Trigger Monitor ---
  useEffect(() => {
    if (gameState === 'flying') {
      if (hasBet && !hasCashedOut && !isProcessing && autoCashout1 && multiplier >= autoCashoutTarget1) {
        handleCashout();
      }
      if (deck2HasBet && !deck2HasCashedOut && !deck2IsProcessing && autoCashout2 && multiplier >= autoCashoutTarget2) {
        handleDeck2Cashout();
      }
    }
  }, [gameState, multiplier, hasBet, hasCashedOut, isProcessing, autoCashout1, autoCashoutTarget1, deck2HasBet, deck2HasCashedOut, deck2IsProcessing, autoCashout2, autoCashoutTarget2]);

  // Trigger floating reaction animation
  const triggerReaction = (emoji: string) => {
    soundEffects.click();
    api.sendMultiplayerReaction(emoji, 'emoji');

    const newEmoji: FloatingEmoji = {
      id: 'fe_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      emoji,
      left: 15 + Math.random() * 65,
      bottom: 10,
    };

    setFloatingEmojis((prev) => [...prev.slice(-8), newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 2000);
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Bar: Multiplayer Control & Multiplier History */}
      <div className="flex items-center justify-between gap-2 pb-1 text-xs">
        {/* History Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-400 font-bold px-1 uppercase shrink-0">History:</span>
          {recentCrashes.slice(0, 7).map((val, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
                val >= 5.0
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                  : val >= 2.0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {val.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Multiplayer Hub & Room Chat Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="aviator-live-chat-btn"
            onClick={() => {
              soundEffects.click();
              setIsChatOpen(true);
            }}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600/30 to-yellow-600/30 hover:from-amber-600/40 hover:to-yellow-600/40 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm transition-all active:scale-95"
          >
            <MessageSquare className="w-3 h-3 text-amber-400" />
            <span>Chat & Tips</span>
          </button>

          {onOpenMultiplayer && (
            <button
              id="aviator-multiplayer-hub-btn"
              onClick={() => {
                soundEffects.click();
                onOpenMultiplayer();
              }}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-400/40 text-indigo-300 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm transition-all"
            >
              <Users className="w-3 h-3 text-indigo-400" />
              <span>Multi-Play</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          )}
        </div>
      </div>

      {/* Flight Canvas Box */}
      <div className="relative h-60 bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-2xl border border-rose-500/30 overflow-hidden flex flex-col items-center justify-center shadow-xl">
        {/* Top Badges & Rig Button */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300 backdrop-blur-sm">
            Round: {roundId}
          </span>
          {isDualPlayerActive && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-[10px] font-black text-indigo-300 flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              <span>2-PLAYER CO-PLAY</span>
            </span>
          )}
        </div>

        {onOpenAdmin && (
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            {gameState === 'flying' && (
              <button
                id="aviator-quick-crash-btn"
                onClick={async () => {
                  soundEffects.error();
                  try {
                    await api.forceAviatorCrashNow();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-2 py-1 rounded-md bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold shadow-md animate-pulse flex items-center gap-1 border border-rose-400/50"
                title="Force Plane to Fly Off Immediately"
              >
                💥 Flew Off Now
              </button>
            )}
            <button
              id="aviator-open-rig-btn"
              onClick={() => {
                soundEffects.click();
                onOpenAdmin();
              }}
              className="px-2 py-1 rounded-md bg-black/60 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm"
              title="Open Outcome Rigging Portal"
            >
              ⚡ Rig
            </button>
          </div>
        )}

        {/* Sky grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20"></div>

        {/* Floating animated reactions layer */}
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute z-30 text-2xl animate-bounce pointer-events-none transition-all duration-1000"
            style={{
              left: `${item.left}%`,
              bottom: `${item.bottom + 30}%`,
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Waiting / Countdown Stage */}
        {gameState === 'waiting' && (
          <div className="text-center z-10 animate-fadeIn">
            <div className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
              Next Flight Starts In
            </div>
            <div className="font-mono text-4xl font-black text-amber-400 animate-pulse">
              {countdown}s
            </div>
            <div className="w-36 h-1.5 bg-slate-800 rounded-full mx-auto mt-3 overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all duration-1000"
                style={{ width: `${(countdown / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Flying Stage */}
        {gameState === 'flying' && (
          <div className="text-center z-10 relative">
            <div className="font-mono text-5xl font-black text-white tracking-tighter drop-shadow-md">
              {multiplier.toFixed(2)}<span className="text-rose-400">x</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-bold mt-1 animate-pulse">
              <Plane className="w-4 h-4 transform -rotate-12" />
              PLANE IS FLYING AWAY...
            </div>
          </div>
        )}

        {/* Crashed Stage */}
        {gameState === 'crashed' && (
          <div className="text-center z-10 animate-scaleUp">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">
              FLEW AWAY AT
            </div>
            <div className="font-mono text-4xl font-black text-rose-500">
              {multiplier.toFixed(2)}x
            </div>
          </div>
        )}

        {/* Floating plane graphic */}
        {gameState === 'flying' && (
          <div 
            className="absolute transition-all duration-100"
            style={{
              bottom: `${Math.min(75, 20 + multiplier * 8)}%`,
              left: `${Math.min(80, 20 + multiplier * 12)}%`
            }}
          >
            <div className="w-10 h-10 rounded-full bg-rose-600/30 flex items-center justify-center text-rose-400 animate-bounce">
              <Plane className="w-6 h-6 transform -rotate-45" />
            </div>
          </div>
        )}

        {/* Bottom Reaction Floating Trigger Pills */}
        <div className="absolute bottom-2.5 z-20 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
          <span className="text-[10px] text-slate-400 font-bold pr-1">Cheer:</span>
          {['🚀', '🔥', '💰', '💎', '👏'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="hover:scale-125 active:scale-95 transition-transform text-sm"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher Banner: 1-Player vs 2-Player Split Mode */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isDualPlayerActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold text-xs flex items-center gap-1.5">
              <span>{isDualPlayerActive ? 'Dual-Player Split Mode Enabled' : 'Single Player Mode'}</span>
              {isDualPlayerActive && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {isDualPlayerActive
                ? `Playing with ${selectedPlayer2?.name || 'Player 2'} on the same live flight`
                : 'Turn ON 2-Player mode to bet with a friend simultaneously'}
            </div>
          </div>
        </div>

        {onToggleDualPlayer && (
          <button
            id="aviator-toggle-dual-mode-btn"
            onClick={() => {
              soundEffects.click();
              onToggleDualPlayer(!isDualPlayerActive);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isDualPlayerActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isDualPlayerActive ? 'Switch to 1P' : '👥 Enable 2-Player'}
          </button>
        )}
      </div>

      {/* Control Panels: Dual-Player vs Single Player */}
      {isDualPlayerActive ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Deck 1: Player 1 (Main User) */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  PLAYER 1
                </span>
                <span className="text-white font-bold text-xs truncate max-w-[100px]">{user.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block">Balance</span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              {[20, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => { soundEffects.click(); setBetAmount(amt); }}
                  className={`flex-1 py-1 rounded text-[11px] font-mono font-bold ${
                    betAmount === amt ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Action Button */}
            {gameState === 'flying' && hasBet && !hasCashedOut ? (
              <button
                id="aviator-p1-cashout-btn"
                disabled={isProcessing}
                onClick={handleCashout}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>P1 CASHOUT ₹{(betAmount * multiplier).toFixed(2)}</span>
                <span className="text-[11px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">
                  {multiplier.toFixed(2)}x
                </span>
              </button>
            ) : (
              <button
                id="aviator-p1-bet-btn"
                disabled={(hasBet && gameState !== 'crashed') || isProcessing}
                onClick={handlePlaceBet}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all"
              >
                {hasBet ? 'P1 Ready For Flight' : `P1 Bet ₹${betAmount}`}
              </button>
            )}

            {hasCashedOut && (
              <div className="mt-1.5 text-center text-[11px] text-emerald-400 font-bold">
                🎉 P1 Cashed: +₹{(betAmount * cashoutMultiplier).toFixed(2)} @ {cashoutMultiplier.toFixed(2)}x
              </div>
            )}
          </div>

          {/* Deck 2: Player 2 (Co-Player) */}
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                  PLAYER 2
                </span>
                <span className="text-white font-bold text-xs truncate max-w-[100px]">
                  {selectedPlayer2?.name || 'Co-Player'}
                </span>
                {onOpenMultiplayer && (
                  <button
                    onClick={onOpenMultiplayer}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 underline"
                    title="Change Player 2"
                  >
                    Change
                  </button>
                )}
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block">Balance</span>
                <span className="font-mono text-xs font-bold text-indigo-300">
                  ₹{(selectedPlayer2?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              {[20, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => { soundEffects.click(); setP2BetAmount(amt); }}
                  className={`flex-1 py-1 rounded text-[11px] font-mono font-bold ${
                    p2BetAmount === amt ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Action Button */}
            {gameState === 'flying' && p2HasBet && !p2HasCashedOut ? (
              <button
                id="aviator-p2-cashout-btn"
                disabled={p2IsProcessing}
                onClick={handleP2Cashout}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-400 text-white font-black text-sm shadow-lg shadow-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>P2 CASHOUT ₹{(p2BetAmount * multiplier).toFixed(2)}</span>
                <span className="text-[11px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">
                  {multiplier.toFixed(2)}x
                </span>
              </button>
            ) : (
              <button
                id="aviator-p2-bet-btn"
                disabled={(p2HasBet && gameState !== 'crashed') || p2IsProcessing || !selectedPlayer2}
                onClick={handleP2PlaceBet}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50 transition-all"
              >
                {p2HasBet ? 'P2 Ready For Flight' : `P2 Bet ₹${p2BetAmount}`}
              </button>
            )}

            {p2HasCashedOut && (
              <div className="mt-1.5 text-center text-[11px] text-purple-300 font-bold">
                🎉 P2 Cashed: +₹{(p2BetAmount * p2CashoutMultiplier).toFixed(2)} @ {p2CashoutMultiplier.toFixed(2)}x
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single Player Standard / Dual Deck Control Deck */
        <div className="space-y-3">
          {/* Deck Mode Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-300">Wager Mode:</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.click();
                  setIsDualDeckActive(!isDualDeckActive);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                  isDualDeckActive
                    ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-300 shadow-sm'
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>{isDualDeckActive ? 'Dual Deck Active (2 Bets)' : '+ Activate 2nd Bet Deck'}</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400">Balance: ₹{user.balance.toFixed(2)}</span>
          </div>

          <div className={`grid gap-3 ${isDualDeckActive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Deck 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase">
                  Bet Deck #1
                </span>
                
                {/* Auto Cashout 1 Control */}
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.click();
                      setAutoCashout1(!autoCashout1);
                    }}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                      autoCashout1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Auto
                  </button>
                  <input
                    type="number"
                    step="0.10"
                    min="1.01"
                    max="100"
                    value={autoCashoutTarget1}
                    onChange={(e) => setAutoCashoutTarget1(parseFloat(e.target.value) || 2.00)}
                    disabled={!autoCashout1}
                    className="w-12 bg-transparent text-[11px] font-mono font-bold text-center text-white focus:outline-none disabled:opacity-40"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">x</span>
                </div>
              </div>

              {/* Chips */}
              <div className="flex items-center justify-between gap-1">
                {[20, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { soundEffects.click(); setBetAmount(amt); }}
                    className={`flex-1 py-1 rounded text-[11px] font-mono font-bold transition-colors ${
                      betAmount === amt ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              {gameState === 'flying' && hasBet && !hasCashedOut ? (
                <button
                  id="aviator-cashout-btn"
                  disabled={isProcessing}
                  onClick={handleCashout}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>CASHOUT ₹{(betAmount * multiplier).toFixed(2)}</span>
                  <span className="text-xs bg-slate-950/20 px-1.5 py-0.5 rounded font-mono font-bold">
                    ({multiplier.toFixed(2)}x)
                  </span>
                </button>
              ) : (
                <button
                  id="aviator-bet-btn"
                  disabled={(hasBet && gameState !== 'crashed') || isProcessing}
                  onClick={handlePlaceBet}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                >
                  {hasBet ? 'Deck 1 Ready For Flight' : `Bet Deck 1: ₹${betAmount}`}
                </button>
              )}

              {hasCashedOut && (
                <div className="text-center text-[10px] text-emerald-400 font-bold">
                  🎉 Cashed: +₹{(betAmount * cashoutMultiplier).toFixed(2)} @ {cashoutMultiplier.toFixed(2)}x
                </div>
              )}
            </div>

            {/* Deck 2 (When active) */}
            {isDualDeckActive && (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase">
                    Bet Deck #2
                  </span>

                  {/* Auto Cashout 2 Control */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.click();
                        setAutoCashout2(!autoCashout2);
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                        autoCashout2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Auto
                    </button>
                    <input
                      type="number"
                      step="0.10"
                      min="1.01"
                      max="100"
                      value={autoCashoutTarget2}
                      onChange={(e) => setAutoCashoutTarget2(parseFloat(e.target.value) || 3.50)}
                      disabled={!autoCashout2}
                      className="w-12 bg-transparent text-[11px] font-mono font-bold text-center text-white focus:outline-none disabled:opacity-40"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">x</span>
                  </div>
                </div>

                {/* Chips */}
                <div className="flex items-center justify-between gap-1">
                  {[20, 50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { soundEffects.click(); setDeck2Amount(amt); }}
                      className={`flex-1 py-1 rounded text-[11px] font-mono font-bold transition-colors ${
                        deck2Amount === amt ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Action Button */}
                {gameState === 'flying' && deck2HasBet && !deck2HasCashedOut ? (
                  <button
                    id="aviator-deck2-cashout-btn"
                    disabled={deck2IsProcessing}
                    onClick={handleDeck2Cashout}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>CASHOUT ₹{(deck2Amount * multiplier).toFixed(2)}</span>
                    <span className="text-xs bg-slate-950/20 px-1.5 py-0.5 rounded font-mono font-bold">
                      ({multiplier.toFixed(2)}x)
                    </span>
                  </button>
                ) : (
                  <button
                    id="aviator-deck2-bet-btn"
                    disabled={(deck2HasBet && gameState !== 'crashed') || deck2IsProcessing}
                    onClick={handleDeck2PlaceBet}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                  >
                    {deck2HasBet ? 'Deck 2 Ready For Flight' : `Bet Deck 2: ₹${deck2Amount}`}
                  </button>
                )}

                {deck2HasCashedOut && (
                  <div className="text-center text-[10px] text-purple-300 font-bold">
                    🎉 Cashed: +₹{(deck2Amount * deck2CashoutMultiplier).toFixed(2)} @ {deck2CashoutMultiplier.toFixed(2)}x
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Multiplayer Flight Cabin (All Players in Current Round) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              Live Flight Cabin ({allLiveBets.length} Players)
            </span>
          </div>

          <span className="text-[10px] text-slate-400">
            {gameState === 'flying' ? '✈️ Round in progress' : gameState === 'waiting' ? '⏳ Boarding...' : '💥 Flew away'}
          </span>
        </div>

        {allLiveBets.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs">
            No wagers placed yet for this round. Place your bet!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
            {allLiveBets.map((b, idx) => {
              const isMe = b.userId === user.id;
              const isP2 = selectedPlayer2 && b.userId === selectedPlayer2.id;

              return (
                <div
                  key={b.userId || idx}
                  className={`p-2 rounded-xl flex items-center justify-between text-xs border transition-all ${
                    b.cashedOut
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={b.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                      alt={b.userName}
                      className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-semibold text-xs truncate">{b.userName}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/30 text-amber-300">
                            YOU
                          </span>
                        )}
                        {isP2 && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-500/30 text-indigo-300">
                            P2
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Bet: ₹{b.amount}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {b.cashedOut ? (
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                          {b.cashoutMultiplier ? `${b.cashoutMultiplier.toFixed(2)}x` : 'Cashed'}
                        </span>
                        <div className="text-emerald-400 font-mono font-bold text-[11px] mt-0.5">
                          +₹{b.winAmount || (b.amount * (b.cashoutMultiplier || 1)).toFixed(2)}
                        </div>
                      </div>
                    ) : gameState === 'flying' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold animate-pulse border border-rose-500/30 flex items-center gap-1">
                        <Plane className="w-2.5 h-2.5" />
                        <span>Flying</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multiplayer Room Chat & Gifting Drawer */}
      <MultiplayerChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
        onUpdateBalance={onUpdateBalance}
        onAddTransaction={onAddTransaction}
      />
    </div>
  );
};
