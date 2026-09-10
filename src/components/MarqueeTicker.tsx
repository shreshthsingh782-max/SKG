import React, { useState, useEffect } from 'react';
import { Volume2, Trophy, Flame } from 'lucide-react';

const ANNOUNCEMENTS = [
  { user: 'Member 98***41', game: 'Win Go 1Min', amount: '₹24,800.00' },
  { user: 'Member 77***12', game: 'TRX Win Go', amount: '₹50,000.00' },
  { user: 'Member 81***90', game: 'Aviator Pro', amount: '₹14,520.00' },
  { user: 'Member 94***33', game: 'Win Go 3Min', amount: '₹8,900.00' },
  { user: 'Member 63***55', game: '5D Lottery', amount: '₹98,000.00' },
  { user: 'Member 91***08', game: 'Slots 777', amount: '₹16,400.00' },
];

export const MarqueeTicker: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const current = ANNOUNCEMENTS[index];

  return (
    <div className="bg-[#0D0D0D] border-y border-white/5 px-4 py-2 flex items-center gap-2.5 overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold shrink-0">
        <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#D4AF37]" />
        <span className="text-[10px] bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative h-5">
        <div 
          key={index}
          className="flex items-center gap-2 text-[11px] text-[#A0A0A0] whitespace-nowrap animate-fadeIn"
        >
          <span className="text-[#E0E0E0] font-mono font-medium">{current.user}</span>
          <span className="text-[#666]">won in {current.game}</span>
          <span className="font-mono font-bold text-[#D4AF37]">{current.amount}</span>
          <Flame className="w-3 h-3 text-[#D4AF37] inline shrink-0" />
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[11px] text-[#D4AF37] font-bold uppercase tracking-wider">
        <Trophy className="w-3 h-3" />
        <span>Top Win</span>
      </div>
    </div>
  );
};
