import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, ShieldAlert, Clock, Ban, Check, AlertTriangle } from 'lucide-react';
import { UserProfile, ResponsibleGamingSettings } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';

interface ResponsibleGamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export const ResponsibleGamingModal: React.FC<ResponsibleGamingModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [dailyLimit, setDailyLimit] = useState(user.responsibleGaming?.dailyDepositLimit ?? 50000);
  const [weeklyLimit, setWeeklyLimit] = useState(user.responsibleGaming?.weeklyDepositLimit ?? 200000);
  const [monthlyLimit, setMonthlyLimit] = useState(user.responsibleGaming?.monthlyDepositLimit ?? 500000);
  const [sessionLimit, setSessionLimit] = useState(user.responsibleGaming?.sessionTimeLimitMinutes ?? 120);
  const [realityCheck, setRealityCheck] = useState(user.responsibleGaming?.realityCheckMinutes ?? 45);
  const [exclusionDays, setExclusionDays] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const res = await api.getResponsibleGamingSettings();
          if (res && res.settings) {
            setDailyLimit(res.settings.dailyDepositLimit);
            setWeeklyLimit(res.settings.weeklyDepositLimit);
            setMonthlyLimit(res.settings.monthlyDepositLimit);
            setSessionLimit(res.settings.sessionTimeLimitMinutes);
            setRealityCheck(res.settings.realityCheckMinutes);
          }
        } catch {
          // keep fallback
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    soundEffects.click();

    try {
      const res = await api.updateResponsibleGamingSettings({
        dailyDepositLimit: dailyLimit,
        weeklyDepositLimit: weeklyLimit,
        monthlyDepositLimit: monthlyLimit,
        sessionTimeLimitMinutes: sessionLimit,
        realityCheckMinutes: realityCheck,
        selfExclusionDays: exclusionDays > 0 ? exclusionDays : undefined,
      });

      if (res && res.success) {
        soundEffects.win();
        setMessage({ type: 'success', text: 'Responsible gaming controls updated.' });
        onUpdateUser({
          ...user,
          responsibleGaming: res.settings,
        });
      } else {
        setMessage({ type: 'error', text: res?.message || 'Failed to update controls' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network connection issue' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c0c0f] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base font-serif-luxury">Responsible Gaming</h3>
              <p className="text-[11px] text-slate-400">Play safe, set your limits, and maintain control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 18+ Warning Banner */}
        <div className="p-3 bg-amber-950/40 border-b border-amber-500/30 flex items-center gap-2.5 px-4 text-xs text-amber-200">
          <div className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-xs shrink-0">18+</div>
          <div>
            <span className="font-bold">Age Compliance: </span>
            This platform is strictly for adults aged 18 and above. Gaming involves financial risk.
          </div>
        </div>

        {message && (
          <div className="px-4 pt-3">
            <div className={`p-2.5 rounded-xl text-xs font-semibold ${
              message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {message.text}
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Deposit Limits */}
          <div className="space-y-2.5">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Deposit Limits (Self-Imposed Max Cap)</span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900 border border-white/10 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block mb-1">Daily Cap</span>
                <div className="flex items-center text-white font-mono font-bold">
                  <span>₹</span>
                  <input
                    type="number"
                    min={100}
                    max={1000000}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full bg-transparent text-white px-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block mb-1">Weekly Cap</span>
                <div className="flex items-center text-white font-mono font-bold">
                  <span>₹</span>
                  <input
                    type="number"
                    min={500}
                    max={5000000}
                    value={weeklyLimit}
                    onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                    className="w-full bg-transparent text-white px-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block mb-1">Monthly Cap</span>
                <div className="flex items-center text-white font-mono font-bold">
                  <span>₹</span>
                  <input
                    type="number"
                    min={1000}
                    max={10000000}
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                    className="w-full bg-transparent text-white px-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Duration & Reality Check */}
          <div className="space-y-2.5">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Session Time & Reality-Check Alert</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 border border-white/10 rounded-xl p-2.5">
                <label className="text-[10px] text-slate-400 block mb-1">Max Daily Play Time</label>
                <select
                  value={sessionLimit}
                  onChange={(e) => setSessionLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white focus:outline-none"
                >
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours (Recommended)</option>
                  <option value={240}>4 Hours</option>
                  <option value={0}>No Limit</option>
                </select>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-xl p-2.5">
                <label className="text-[10px] text-slate-400 block mb-1">Reality Check Interval</label>
                <select
                  value={realityCheck}
                  onChange={(e) => setRealityCheck(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-white focus:outline-none"
                >
                  <option value={30}>Every 30 mins</option>
                  <option value={45}>Every 45 mins</option>
                  <option value={60}>Every 60 mins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Self-Exclusion / Cool-off */}
          <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Take a Break (Self-Exclusion)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Temporarily freeze your account. You will not be able to place bets or deposit during this period.
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { label: '24 Hours', days: 1 },
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setExclusionDays(opt.days)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    exclusionDays === opt.days
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
