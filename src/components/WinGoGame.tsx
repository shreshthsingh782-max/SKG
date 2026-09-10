import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Timer, Sparkles, TrendingUp, History, User, CheckCircle2, 
  XCircle, AlertCircle, HelpCircle, ChevronRight, Trophy, Flame, 
  Lock, RefreshCw, Zap, Volume2, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BetColor, BetSize, PeriodHistoryItem, UserProfile, WinGoBet } from '../types';
import { soundEffects } from '../utils/audio';
import { calculateWin, generateInitialHistory, generatePeriodId, getNumberColor, getNumberSize } from '../utils/gameLogic';
import { api } from '../services/api';

interface WinGoGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
}

export const WinGoGame: React.FC<WinGoGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  // Game mode
  const [gameDuration, setGameDuration] = useState<number>(60); // 60s (1min), 180s (3min), 300s (5min), 600s (10min)
  const [timeLeft, setTimeLeft] = useState<number>(55);
  const [currentPeriod, setCurrentPeriod] = useState<string>(generatePeriodId());
  
  // History & Bets
  const [history, setHistory] = useState<PeriodHistoryItem[]>(() => generateInitialHistory(25));
  const [myBets, setMyBets] = useState<WinGoBet[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'chart' | 'mybets'>('history');

  // Betting Slip State
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betTargetType, setBetTargetType] = useState<'color' | 'number' | 'size'>('color');
  const [betTargetValue, setBetTargetValue] = useState<string | number>('green');
  const [baseChip, setBaseChip] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [agreeRule, setAgreeRule] = useState(true);

  // Result animation modal
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    periodId: string;
    outcome: { number: number; color: BetColor; size: BetSize };
    bets: WinGoBet[];
    totalWon: number;
    totalLost: number;
  } | null>(null);

  // How to play modal
  const [showRules, setShowRules] = useState(false);

  // Refs for tracking active bets on the current period
  const myBetsRef = useRef(myBets);
  myBetsRef.current = myBets;
  const userRef = useRef(user);
  userRef.current = user;

  const typeKey = gameDuration === 60 ? '1min' : gameDuration === 180 ? '3min' : gameDuration === 300 ? '5min' : '10min';

  // Server Synchronized Polling Loop
  useEffect(() => {
    let isMounted = true;
    let prevPeriod = currentPeriod;

    const syncWithServer = async () => {
      try {
        const data = await api.getWinGoState(typeKey);
        if (data && data.success && isMounted) {
          setTimeLeft(data.secondsLeft);
          
          if (data.history && data.history.length > 0) {
            setHistory(data.history);
          }

          if (data.periodId !== prevPeriod && prevPeriod !== '') {
            // Period Draw executed on backend!
            const latestDraw = data.history[0];
            if (latestDraw) {
              handleServerPeriodSettled(prevPeriod, latestDraw);
            }
          }

          setCurrentPeriod(data.periodId);
          prevPeriod = data.periodId;
        }
      } catch {
        // Fallback local timer tick
        setTimeLeft((prev) => (prev <= 1 ? gameDuration : prev - 1));
      }
    };

    const interval = setInterval(syncWithServer, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [typeKey, gameDuration]);

  // Handle server period draw completion
  const handleServerPeriodSettled = (periodJustEnded: string, draw: any) => {
    const betsForThisPeriod = myBetsRef.current.filter(
      (b) => b.periodId === periodJustEnded && b.status === 'pending'
    );

    if (betsForThisPeriod.length > 0) {
      let totalWon = 0;
      let totalLost = 0;

      const outcome = { number: draw.number, color: draw.color as BetColor, size: draw.size as BetSize };

      const updatedBets = myBetsRef.current.map((bet) => {
        if (bet.periodId === periodJustEnded && bet.status === 'pending') {
          const result = calculateWin(bet.targetType, bet.targetValue, outcome, bet.totalAmount);
          
          if (result.isWin) {
            totalWon += result.winAmount;
            return {
              ...bet,
              status: 'won' as const,
              winAmount: result.winAmount,
              periodOutcome: outcome
            };
          } else {
            totalLost += bet.totalAmount;
            return {
              ...bet,
              status: 'lost' as const,
              winAmount: 0,
              periodOutcome: outcome
            };
          }
        }
        return bet;
      });

      setMyBets(updatedBets);

      if (totalWon > 0) {
        soundEffects.win();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Update balance
        const newBalance = userRef.current.balance + totalWon;
        onUpdateBalance(newBalance);

        onAddTransaction({
          id: 'TX' + Date.now(),
          type: 'win',
          amount: totalWon,
          status: 'completed',
          timestamp: Date.now(),
          title: `Win Go Payout (#${periodJustEnded.slice(-4)})`,
          description: `Server-verified win ₹${totalWon.toFixed(2)} on Draw #${draw.number}`
        });
      } else {
        soundEffects.lose();
      }

      setResultModal({
        isOpen: true,
        periodId: periodJustEnded,
        outcome,
        bets: betsForThisPeriod,
        totalWon,
        totalLost
      });
    }
  };

  // Open bet slip
  const handleSelectBet = (type: 'color' | 'number' | 'size', value: string | number) => {
    soundEffects.click();
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (timeLeft <= 5) {
      // Locked in last 5 seconds
      return;
    }

    setBetTargetType(type);
    setBetTargetValue(value);
    setMultiplier(1);
    setBetModalOpen(true);
  };

  // Confirm bet with backend
  const handleConfirmBet = async () => {
    soundEffects.betPlaced();
    const totalAmount = baseChip * multiplier;

    if (totalAmount > user.balance) {
      onOpenWallet('deposit');
      return;
    }

    const newBet: WinGoBet = {
      id: 'BET' + Math.floor(100000 + Math.random() * 900000),
      periodId: currentPeriod,
      gameType: `Win Go ${gameDuration / 60}M`,
      targetType: betTargetType,
      targetValue: betTargetValue,
      baseAmount: baseChip,
      multiplier: multiplier,
      totalAmount: totalAmount,
      status: 'pending',
      createdAt: Date.now()
    };

    // Deduct balance
    const updatedBalance = user.balance - totalAmount;
    onUpdateBalance(updatedBalance);

    onAddTransaction({
      id: 'TX' + Date.now(),
      type: 'bet',
      amount: totalAmount,
      status: 'completed',
      timestamp: Date.now(),
      title: `Win Go Bet on ${String(betTargetValue).toUpperCase()}`,
      description: `Period: #${currentPeriod.slice(-4)} | Amount: ₹${totalAmount}`
    });

    setMyBets((prev) => [newBet, ...prev]);
    setBetModalOpen(false);

    // Sync bet to backend server
    try {
      await api.placeWinGoBet(typeKey, betTargetType, betTargetValue, baseChip, multiplier);
    } catch {
      // Handled locally
    }
  };

  // Quick multipliers
  const MULTIPLIERS = [1, 5, 10, 20, 50, 100];
  const BASE_CHIPS = [10, 50, 100, 500, 1000, 5000];

  const isLocked = timeLeft <= 5;

  return (
    <div className="space-y-3 pb-8">
      {/* Game Duration Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 grid grid-cols-4 gap-1.5 shadow-md">
        {[
          { sec: 60, label: 'Win Go 1Min', time: '1M' },
          { sec: 180, label: 'Win Go 3Min', time: '3M' },
          { sec: 300, label: 'Win Go 5Min', time: '5M' },
          { sec: 600, label: 'Win Go 10Min', time: '10M' }
        ].map((item) => (
          <button
            key={item.sec}
            onClick={() => {
              soundEffects.click();
              setGameDuration(item.sec);
              setTimeLeft(item.sec - 5);
            }}
            className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
              gameDuration === item.sec
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold leading-none">{item.time}</span>
            <span className="text-[9px] opacity-80 leading-none">Win Go</span>
          </button>
        ))}
      </div>

      {/* Live Timer & Period Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Period</span>
              <button 
                onClick={() => setShowRules(true)} 
                className="text-amber-400 hover:underline flex items-center gap-0.5 text-[11px]"
              >
                <HelpCircle className="w-3 h-3" />
                How to play
              </button>
            </div>
            <div className="font-mono text-base font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
              <span>{currentPeriod}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>

          {/* Time Remaining Counter */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Time Remaining</div>
            <div className="flex items-center justify-end gap-1 font-mono text-xl font-black text-amber-400">
              <span className="px-2 py-0.5 bg-slate-950 rounded-lg border border-slate-700">
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}
              </span>
              <span className="text-amber-500 animate-pulse">:</span>
              <span className={`px-2 py-0.5 bg-slate-950 rounded-lg border ${timeLeft <= 5 ? 'border-rose-500 text-rose-400 animate-bounce' : 'border-slate-700'}`}>
                {String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Second Locked State Alert */}
        {isLocked && (
          <div className="mb-3 py-2 px-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-rose-200 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Time is locked! Drawing outcome in {timeLeft}s...</span>
          </div>
        )}

        {/* Color Prediction Primary Buttons */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          <button
            id="bet-green-btn"
            disabled={isLocked}
            onClick={() => handleSelectBet('color', 'green')}
            className="group relative py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <span>Green</span>
            <span className="text-[10px] text-emerald-200 font-normal">2x Payout</span>
          </button>

          <button
            id="bet-violet-btn"
            disabled={isLocked}
            onClick={() => handleSelectBet('color', 'violet')}
            className="group relative py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-extrabold text-sm shadow-lg shadow-purple-900/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <span>Violet</span>
            <span className="text-[10px] text-purple-200 font-normal">4.5x Payout</span>
          </button>

          <button
            id="bet-red-btn"
            disabled={isLocked}
            onClick={() => handleSelectBet('color', 'red')}
            className="group relative py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-extrabold text-sm shadow-lg shadow-rose-900/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <span>Red</span>
            <span className="text-[10px] text-rose-200 font-normal">2x Payout</span>
          </button>
        </div>

        {/* Number Selector Grid (0 - 9) */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 mb-3">
          <div className="text-[11px] text-slate-400 mb-1.5 font-medium flex items-center justify-between">
            <span>Select Number (0 - 9)</span>
            <span className="text-amber-400 font-bold">9x Payout</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const color = getNumberColor(num);
              let bgStyle = 'from-rose-600 to-rose-500'; // red
              if (color === 'green') bgStyle = 'from-emerald-600 to-emerald-500';
              if (color === 'red-violet') bgStyle = 'from-rose-600 via-purple-600 to-violet-600';
              if (color === 'green-violet') bgStyle = 'from-emerald-600 via-purple-600 to-violet-600';

              return (
                <button
                  key={num}
                  id={`bet-number-${num}-btn`}
                  disabled={isLocked}
                  onClick={() => handleSelectBet('number', num)}
                  className={`py-2 rounded-xl bg-gradient-to-br ${bgStyle} text-white font-black text-sm shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center`}
                >
                  <span className="font-mono text-base">{num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big / Small Choice */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="bet-big-btn"
            disabled={isLocked}
            onClick={() => handleSelectBet('size', 'Big')}
            className="py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            <span>Big (5-9)</span>
            <span className="text-xs bg-slate-950/20 px-1.5 py-0.5 rounded text-slate-950 font-bold">2x</span>
          </button>

          <button
            id="bet-small-btn"
            disabled={isLocked}
            onClick={() => handleSelectBet('size', 'Small')}
            className="py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white font-extrabold text-sm shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            <span>Small (0-4)</span>
            <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded text-white font-bold">2x</span>
          </button>
        </div>
      </div>

      {/* Tabs for Game Records, Chart, My History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            id="tab-game-history-btn"
            onClick={() => { soundEffects.click(); setActiveTab('history'); }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Game History
          </button>
          <button
            id="tab-chart-trend-btn"
            onClick={() => { soundEffects.click(); setActiveTab('chart'); }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chart'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Trend Chart
          </button>
          <button
            id="tab-my-bets-btn"
            onClick={() => { soundEffects.click(); setActiveTab('mybets'); }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'mybets'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            My History
            {myBets.filter(b => b.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Tab 1: Game History List */}
        {activeTab === 'history' && (
          <div className="p-2">
            <div className="grid grid-cols-4 px-3 py-2 text-[11px] font-bold text-slate-400 border-b border-slate-800">
              <div>Period</div>
              <div className="text-center">Number</div>
              <div className="text-center">Big/Small</div>
              <div className="text-right">Color</div>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {history.map((item, idx) => (
                <div key={item.periodId + idx} className="grid grid-cols-4 px-3 py-2 text-xs items-center hover:bg-slate-800/30">
                  <div className="font-mono text-slate-300 text-[11px]">
                    {item.periodId.slice(-4)}
                  </div>

                  <div className="flex justify-center">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black font-mono text-xs text-white shadow-sm ${
                        item.color === 'green'
                          ? 'bg-emerald-500'
                          : item.color === 'red'
                          ? 'bg-rose-500'
                          : item.color === 'green-violet'
                          ? 'bg-gradient-to-r from-emerald-500 to-purple-500'
                          : 'bg-gradient-to-r from-rose-500 to-purple-500'
                      }`}
                    >
                      {item.number}
                    </span>
                  </div>

                  <div className="text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.size === 'Big'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {item.size}
                    </span>
                  </div>

                  <div className="flex justify-end gap-1">
                    {item.color === 'green' && (
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    )}
                    {item.color === 'red' && (
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    )}
                    {item.color === 'green-violet' && (
                      <div className="flex gap-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      </div>
                    )}
                    {item.color === 'red-violet' && (
                      <div className="flex gap-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Trend Chart Graph */}
        {activeTab === 'chart' && (
          <div className="p-3">
            <div className="text-xs text-slate-400 mb-2 font-medium flex items-center justify-between">
              <span>Winning Numbers Flow</span>
              <span className="text-[11px] text-amber-400">Last 15 draws</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              {/* Scale Header */}
              <div className="grid grid-cols-10 gap-1 text-center font-mono text-[10px] text-slate-500 border-b border-slate-800 pb-1 mb-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {history.slice(0, 15).map((item) => (
                  <div key={item.periodId} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500 w-10 shrink-0">
                      {item.periodId.slice(-4)}
                    </span>
                    <div className="flex-1 grid grid-cols-10 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                        const isHit = item.number === n;
                        return (
                          <div key={n} className="flex justify-center items-center h-5">
                            {isHit ? (
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center font-black font-mono text-[10px] text-white ${
                                  item.color === 'green'
                                    ? 'bg-emerald-500'
                                    : item.color === 'red'
                                    ? 'bg-rose-500'
                                    : 'bg-purple-500'
                                }`}
                              >
                                {n}
                              </span>
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: My Betting History */}
        {activeTab === 'mybets' && (
          <div className="p-3">
            {myBets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No bet records found. Place your first bet to start winning!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {myBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-amber-300">
                          #{bet.periodId.slice(-4)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">
                          {bet.targetType.toUpperCase()}: {String(bet.targetValue).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Bet: ₹{bet.totalAmount} (₹{bet.baseAmount} x {bet.multiplier})
                      </div>
                    </div>

                    <div className="text-right">
                      {bet.status === 'pending' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" />
                          Pending
                        </span>
                      ) : bet.status === 'won' ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            +₹{bet.winAmount?.toFixed(2)}
                          </span>
                          <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Won</div>
                        </div>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                            -₹{bet.totalAmount.toFixed(2)}
                          </span>
                          <div className="text-[10px] text-rose-400 font-semibold mt-0.5">Lost</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bet Slip Bottom Sheet Modal */}
      {betModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border-t border-amber-500/40 rounded-t-2xl p-4 text-slate-100 animate-slideUp shadow-2xl">
            {/* Modal Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-200">Win Go {gameDuration / 60}M</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase">
                  Select {String(betTargetValue).toUpperCase()}
                </span>
              </div>
              <button
                id="close-bet-modal"
                onClick={() => setBetModalOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Balance Chip Amount */}
            <div className="py-3">
              <div className="text-xs text-slate-400 font-medium mb-1.5">Balance / Chip</div>
              <div className="grid grid-cols-6 gap-1.5">
                {BASE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => { soundEffects.click(); setBaseChip(chip); }}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      baseChip === chip
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ₹{chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplier Pills */}
            <div className="pb-3">
              <div className="text-xs text-slate-400 font-medium mb-1.5">Multiplier (x)</div>
              <div className="grid grid-cols-6 gap-1.5">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { soundEffects.click(); setMultiplier(m); }}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      multiplier === m
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    X{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper Quantity */}
            <div className="flex items-center justify-between py-2 px-3 bg-slate-950 rounded-xl border border-slate-800 mb-3">
              <span className="text-xs text-slate-400">Total Multiple</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { soundEffects.click(); if (multiplier > 1) setMultiplier(multiplier - 1); }}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center bg-transparent text-amber-300 font-mono font-bold text-sm focus:outline-none"
                />
                <button
                  onClick={() => { soundEffects.click(); setMultiplier(multiplier + 1); }}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Summary & Confirm */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="text-slate-400">
                Wallet: <span className="font-mono font-bold text-amber-300">₹{user.balance.toFixed(2)}</span>
              </div>
              <div className="text-slate-200">
                Total Bet: <span className="font-mono text-base font-black text-amber-400">₹{(baseChip * multiplier).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="cancel-bet-btn"
                onClick={() => setBetModalOpen(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                id="confirm-place-bet-btn"
                onClick={handleConfirmBet}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
              >
                Total ₹{(baseChip * multiplier).toFixed(2)} Place Bet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Announcement Modal */}
      {resultModal && resultModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/50 rounded-2xl p-5 text-center text-slate-100 shadow-2xl animate-scaleUp">
            {resultModal.totalWon > 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-2 text-amber-400 animate-bounce">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-amber-300 tracking-tight">
                  Congratulations!
                </h3>
                <div className="text-xs text-slate-300 mt-1">
                  Period <span className="font-mono font-bold">#{resultModal.periodId.slice(-4)}</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 my-3">
                  +₹{resultModal.totalWon.toFixed(2)}
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Flame className="w-7 h-7 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">
                  Next Time Lucky!
                </h3>
                <div className="text-xs text-slate-400 mt-1">
                  Period <span className="font-mono font-bold">#{resultModal.periodId.slice(-4)}</span>
                </div>
                <div className="text-xl font-bold font-mono text-rose-400 my-2">
                  -₹{resultModal.totalLost.toFixed(2)}
                </div>
              </>
            )}

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs mb-4 flex items-center justify-between">
              <span className="text-slate-400">Draw Result</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                    resultModal.outcome.color === 'green' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  {resultModal.outcome.number}
                </span>
                <span className="font-bold text-amber-400">{resultModal.outcome.size}</span>
              </div>
            </div>

            <button
              id="close-result-modal-btn"
              onClick={() => setResultModal(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-sm shadow-md"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-200 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-amber-400">Win Go Rules & Payouts</span>
              <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-slate-300">
              Win Go is a live probability game. Predict colors (Green, Red, Violet), Numbers (0-9), or Size (Big/Small) before the timer locks.
            </p>
            <ul className="space-y-1.5 text-slate-300">
              <li>🟢 <strong>Green (1,3,7,9)</strong>: 2x Payout (Number 5: 1.5x)</li>
              <li>🔴 <strong>Red (2,4,6,8)</strong>: 2x Payout (Number 0: 1.5x)</li>
              <li>🟣 <strong>Violet (0,5)</strong>: 4.5x Payout</li>
              <li>🔢 <strong>Direct Number (0-9)</strong>: 9x Payout</li>
              <li>⚖️ <strong>Big (5-9) / Small (0-4)</strong>: 2x Payout</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
