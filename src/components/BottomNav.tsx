import React from 'react';
import { Gamepad2, Gift, Users, Wallet, User } from 'lucide-react';
import { MainTab } from '../types';
import { soundEffects } from '../utils/audio';

interface BottomNavProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Gamepad2 },
    { id: 'activity', label: 'Activity', icon: Gift },
    { id: 'promotion', label: 'Promotion', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'mine', label: 'Mine', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/95 backdrop-blur-md border-t border-white/10 shadow-2xl">
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              id={`nav-tab-${t.id}`}
              onClick={() => {
                soundEffects.click();
                onChangeTab(t.id as MainTab);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all relative ${
                isActive
                  ? 'text-[#D4AF37] font-bold scale-105'
                  : 'text-[#666] hover:text-[#A0A0A0]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-[#D4AF37] drop-shadow' : 'stroke-[1.75px]'}`} />
              <span className="text-[10px] tracking-wider uppercase font-semibold mt-0.5">{t.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#D4AF37] mt-0.5 shadow-sm shadow-[#D4AF37]"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
