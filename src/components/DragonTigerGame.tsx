import React, { useState, useEffect, useRef } from 'react';
import { Flame, Shield, Trophy, Clock, Sparkles, CheckCircle2, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';

interface DragonTigerGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
}

type BetChoice = 'dragon' | 'tiger' | 'tie';

interface CardData {
  value: number; // 1 to 13 (1=A, 11=J, 12=Q, 13=K)
  name: string;
  suit: '♠' | '♥' | '♦' | '♣';
  isRed: boolean;
}

const SUITS: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
const CARD_NAMES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function getRandomCard(): CardData {
  const value = Math.floor(Math.random() * 13) + 1;
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return {
    value,
    name: CARD_NAMES[value],
    suit,
    isRed: suit === '♥' || suit === '♦',
  };
}

export const DragonTigerGame: React.FC<DragonTigerGameProps> = ({
  user,
  onUpdateBalance,
  onAddTransaction,
  onOpenAuth,
  onOpenWallet
}) => {
  const [roundTime, setRoundTime] = useState(12);
  const [phase, setPhase] = useState<'betting' | 'dealing' | 'settled'>('betting');
  const [selectedChip, setSelectedChip] = useState(50);
  const [bets, setBets] = useState<{ dragon: number; tiger: number; tie: number }>({
    dragon: 0,
    tiger: 0,
    tie: 0,
  });

  const [dragonCard, setDragonCard] = useState<CardData | null>(null);
  const [tigerCard, setTigerCard] = useState<CardData | null>(null);
  const [winner, setWinner] = useState<BetChoice | null>(null);
  const [roundId, setRoundId] = useState(() => Date.now().toString().slice(-8));

  // Bead plate roadmap
  const [roadmap, setRoadmap] = useState<Array<{ id: string; winner: BetChoice; dVal: number; tVal: number }>>([
    { id: '1', winner: 'dragon', dVal: 12, tVal: 4 },
    { id: '2', winner: 'tiger', dVal: 3, tVal: 9 },
    { id: '3', winner: 'dragon', dVal: 13, tVal: 10 },
    { id: '4', winner: 'tie', dVal: 8, tVal: 8 },
    { id: '5', winner: 'tiger', dVal: 5, tVal: 11 },
    { id: '6', winner: 'dragon', dVal: 9, tVal: 2 },
    { id: '7', winner: 'dragon', dVal: 10, tVal: 6 },
    { id: '8', winner: 'tiger', dVal: 4, tVal: 12 },
  ]);

  const betsRef = useRef(bets);
  betsRef.current = bets;

  const totalCurrentBet = bets.dragon + bets.tiger + bets.tie;

  // Round loop controller
  useEffect(() => {
    const timer = setInterval(() => {
      setRoundTime((prev) => {
        if (prev <= 1) {
          if (phase === 'betting') {
            handleDealPhase();
            return 0;
          }
          return 0;
        }
        if (prev <= 4 && phase === 'betting') {
          soundEffects.warningTick();
        } else if (phase === 'betting') {
          soundEffects.tick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const handleDealPhase = () => {
    setPhase('dealing');

    // Generate random cards for Dragon & Tiger
    const dCard = getRandomCard();
    const tCard = getRandomCard();

    setTimeout(() => {
      setDragonCard(dCard);
      soundEffects.click();
    }, 800);

    setTimeout(() => {
      setTigerCard(tCard);
      soundEffects.click();
    }, 1600);

    // Settle winner
    setTimeout(() => {
      let winChoice: BetChoice = 'tie';
      if (dCard.value > tCard.value) winChoice = 'dragon';
      else if (tCard.value > dCard.value) winChoice = 'tiger';

      setWinner(winChoice);
      setPhase('settled');

      // Update roadmap
      setRoadmap((prev) => [
        { id: Date.now().toString(), winner: winChoice, dVal: dCard.value, tVal: tCard.value },
        ...prev.slice(0, 19),
      ]);

      // Settle bets
      settleRound(winChoice, dCard, tCard);

      // Start next round after 4.5s
      setTimeout(() => {
        setBets({ dragon: 0, tiger: 0, tie: 0 });
        setDragonCard(null);
        setTigerCard(null);
        setWinner(null);
        setRoundId(Date.now().toString().slice(-8));
        setPhase('betting');
        setRoundTime(12);
      }, 4500);
    }, 2400);
  };

  const settleRound = (winChoice: BetChoice, dCard: CardData, tCard: CardData) => {
    const activeBets = betsRef.current;
    let winAmount = 0;

    if (winChoice === 'dragon' && activeBets.dragon > 0) {
      winAmount += activeBets.dragon * 2; // 2x
    }
    if (winChoice === 'tiger' && activeBets.tiger > 0) {
      winAmount += activeBets.tiger * 2; // 2x
    }
    if (winChoice === 'tie') {
      if (activeBets.tie > 0) {
        winAmount += activeBets.tie * 9; // 9x
      }
      // If tie, return 50% of dragon/tiger bets
      if (activeBets.dragon > 0) winAmount += activeBets.dragon * 0.5;
      if (activeBets.tiger > 0) winAmount += activeBets.tiger * 0.5;
    }

    if (winAmount > 0) {
      soundEffects.win();
      soundEffects.coins();
      onUpdateBalance(user.balance + winAmount);

      onAddTransaction({
        id: 'tx_dt_win_' + Date.now(),
        type: 'win',
        amount: winAmount,
        status: 'completed',
        timestamp: Date.now(),
        title: `Dragon vs Tiger Won (${winChoice.toUpperCase()})`,
        description: `D:${dCard.name} vs T:${tCard.name} -> Payout ₹${winAmount.toFixed(2)}`,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FF4500', '#1E90FF', '#FFFFFF']
      });
    } else if (activeBets.dragon > 0 || activeBets.tiger > 0 || activeBets.tie > 0) {
      soundEffects.lose();
    }
  };

  const handlePlaceBet = (choice: BetChoice) => {
    if (phase !== 'betting') return;
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }
    if (user.balance < selectedChip) {
      onOpenWallet();
      return;
    }

    soundEffects.betPlaced();

    // Deduct chip
    onUpdateBalance(user.balance - selectedChip);
    setBets((prev) => ({
      ...prev,
      [choice]: prev[choice] + selectedChip,
    }));

    onAddTransaction({
      id: 'tx_dt_bet_' + Date.now(),
      type: 'bet',
      amount: selectedChip,
      status: 'completed',
      timestamp: Date.now(),
      title: `Dragon vs Tiger Bet (${choice.toUpperCase()})`,
      description: `Wager ₹${selectedChip} on Round #${roundId}`,
    });
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Header Banner */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-md">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                Dragon vs Tiger <span className="text-[9px] text-[#D4AF37] font-mono px-1.5 py-0.2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">Live Arena</span>
              </h3>
              <p className="text-[10px] text-[#A0A0A0]">Round #{roundId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-[#666] font-bold">
                {phase === 'betting' ? 'Betting Closes In' : 'Dealing Cards'}
              </div>
              <div className="font-mono text-base font-bold text-[#D4AF37] flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                {phase === 'betting' ? `${roundTime}s` : '0s'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Bead Plate Roadmap */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar relative z-10">
          <span className="text-[9px] uppercase tracking-wider text-[#666] font-bold shrink-0">Roadmap:</span>
          {roadmap.map((r) => (
            <span
              key={r.id}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border ${
                r.winner === 'dragon'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : r.winner === 'tiger'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              }`}
            >
              {r.winner === 'dragon' ? 'D' : r.winner === 'tiger' ? 'T' : '='}
            </span>
          ))}
        </div>
      </div>

      {/* Battle Table Arena (Dragon Card vs Tiger Card) */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-28 h-28 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-28 h-28 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none"></div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Dragon Side */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-2">
              <Flame className="w-3.5 h-3.5" />
              Dragon (2X)
            </div>

            {/* Card Frame */}
            <div
              className={`w-24 h-36 rounded-xl border-2 flex flex-col items-center justify-between p-2.5 transition-all duration-300 shadow-xl ${
                winner === 'dragon'
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-[#D4AF37]/30 scale-105'
                  : 'border-amber-500/40'
              } ${dragonCard ? 'bg-[#151515]' : 'bg-[#1a1308] border-dashed'}`}
            >
              {dragonCard ? (
                <>
                  <div className={`text-sm font-bold self-start ${dragonCard.isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                    {dragonCard.name} <span className="text-xs">{dragonCard.suit}</span>
                  </div>
                  <div className={`text-3xl font-black ${dragonCard.isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                    {dragonCard.suit}
                  </div>
                  <div className={`text-xs font-bold self-end font-mono ${dragonCard.isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                    Pts: {dragonCard.value}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#555] text-[10px] uppercase font-bold tracking-wider">
                  <Flame className="w-6 h-6 opacity-30 mb-1" />
                  Dealing...
                </div>
              )}
            </div>
          </div>

          {/* Tiger Side */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1 mb-2">
              <Shield className="w-3.5 h-3.5" />
              Tiger (2X)
            </div>

            {/* Card Frame */}
            <div
              className={`w-24 h-36 rounded-xl border-2 flex flex-col items-center justify-between p-2.5 transition-all duration-300 shadow-xl ${
                winner === 'tiger'
                  ? 'border-blue-400 ring-2 ring-blue-400/50 shadow-blue-500/30 scale-105'
                  : 'border-blue-500/40'
              } ${tigerCard ? 'bg-[#151515]' : 'bg-[#0a121f] border-dashed'}`}
            >
              {tigerCard ? (
                <>
                  <div className={`text-sm font-bold self-start ${tigerCard.isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                    {tigerCard.name} <span className="text-xs">{tigerCard.suit}</span>
                  </div>
                  <div className={`text-3xl font-black ${tigerCard.isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                    {tigerCard.suit}
                  </div>
                  <div className={`text-xs font-bold self-end font-mono ${tigerCard.isRed ? 'text-rose-500' : 'text-slate-100'}`}>
                    Pts: {tigerCard.value}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#555] text-[10px] uppercase font-bold tracking-wider">
                  <Shield className="w-6 h-6 opacity-30 mb-1" />
                  Dealing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {phase === 'settled' && winner && (
          <div className="mt-4 p-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-xl text-center animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center justify-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
              {winner === 'dragon' ? 'Dragon Wins!' : winner === 'tiger' ? 'Tiger Wins!' : 'TIE MATCH (9X) !'}
            </span>
          </div>
        )}
      </div>

      {/* Betting Zones Grid (Dragon, Tie, Tiger) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Dragon Bet Box */}
        <button
          id="bet-dragon-btn"
          disabled={phase !== 'betting'}
          onClick={() => handlePlaceBet('dragon')}
          className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            winner === 'dragon' && phase === 'settled'
              ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 scale-102'
              : 'bg-[#0D0D0D] border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10'
          } ${phase !== 'betting' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Dragon</span>
          <span className="text-[10px] font-mono text-[#A0A0A0] mt-0.5">Pays 2.0x</span>
          {bets.dragon > 0 && (
            <span className="mt-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-[#050505] text-[10px] font-mono font-bold shadow">
              ₹{bets.dragon}
            </span>
          )}
        </button>

        {/* Tie Bet Box */}
        <button
          id="bet-tie-btn"
          disabled={phase !== 'betting'}
          onClick={() => handlePlaceBet('tie')}
          className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            winner === 'tie' && phase === 'settled'
              ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400 scale-102'
              : 'bg-[#0D0D0D] border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10'
          } ${phase !== 'betting' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tie</span>
          <span className="text-[10px] font-mono text-[#D4AF37] font-bold mt-0.5">Pays 9.0x</span>
          {bets.tie > 0 && (
            <span className="mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-[#050505] text-[10px] font-mono font-bold shadow">
              ₹{bets.tie}
            </span>
          )}
        </button>

        {/* Tiger Bet Box */}
        <button
          id="bet-tiger-btn"
          disabled={phase !== 'betting'}
          onClick={() => handlePlaceBet('tiger')}
          className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            winner === 'tiger' && phase === 'settled'
              ? 'bg-blue-500/25 border-blue-400 ring-2 ring-blue-400 scale-102'
              : 'bg-[#0D0D0D] border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10'
          } ${phase !== 'betting' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Tiger</span>
          <span className="text-[10px] font-mono text-[#A0A0A0] mt-0.5">Pays 2.0x</span>
          {bets.tiger > 0 && (
            <span className="mt-1.5 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-mono font-bold shadow">
              ₹{bets.tiger}
            </span>
          )}
        </button>
      </div>

      {/* Chip Selector Controls */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
            Select Betting Chip
          </span>
          <span className="text-xs font-mono font-bold text-[#D4AF37]">
            Total Wagered: ₹{totalCurrentBet}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {[10, 50, 100, 500, 1000].map((amt) => (
            <button
              key={amt}
              onClick={() => {
                soundEffects.click();
                setSelectedChip(amt);
              }}
              className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                selectedChip === amt
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 scale-105'
                  : 'bg-white/5 border-white/10 text-[#A0A0A0] hover:bg-white/10'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
