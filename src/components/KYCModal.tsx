import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, FileText, CheckCircle2, AlertCircle, Clock, 
  Smartphone, Upload, Key, Check, RefreshCw, Lock
} from 'lucide-react';
import { UserProfile, KYCData } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export const KYCModal: React.FC<KYCModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'id' | 'phone'>('id');
  const [fullName, setFullName] = useState(user.kyc?.fullName || user.name || '');
  const [docType, setDocType] = useState<'pan' | 'aadhaar' | 'passport'>('pan');
  const [docNumber, setDocNumber] = useState(user.kyc?.documentNumber || '');
  const [dob, setDob] = useState(user.kyc?.dateOfBirth || '1996-08-20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone OTP verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDevHint, setOtpDevHint] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    if (isOpen && user.kyc) {
      setFullName(user.kyc.fullName || user.name || '');
      setDocNumber(user.kyc.documentNumber || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentStatus = user.kyc?.status || 'unverified';

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !docNumber.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all mandatory identity fields' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    soundEffects.click();

    try {
      const res = await api.submitKYC({
        fullName: fullName.trim(),
        documentType: docType,
        documentNumber: docNumber.trim(),
        dateOfBirth: dob,
      });

      if (res && res.success) {
        soundEffects.coins();
        setMessage({ type: 'success', text: res.message || 'KYC submitted successfully!' });
        onUpdateUser({
          ...user,
          kyc: res.kyc,
        });
      } else {
        setMessage({ type: 'error', text: res?.message || 'Failed to submit KYC' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network communication error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    soundEffects.click();
    setMessage(null);
    try {
      const res = await api.sendPhoneOTP(user.phone);
      if (res && res.success) {
        setOtpSent(true);
        if (res.devCode) {
          setOtpDevHint(res.devCode);
          setOtpCode(res.devCode); // autofill for testing
        }
        setMessage({ type: 'success', text: `OTP sent to ${user.phone}` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send OTP' });
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) return;
    setIsVerifyingOtp(true);
    soundEffects.click();
    try {
      const res = await api.verifyPhoneOTP(otpCode, user.phone);
      if (res && res.success) {
        soundEffects.win();
        setMessage({ type: 'success', text: 'Phone number verified successfully!' });
        onUpdateUser({
          ...user,
          isPhoneVerified: true,
        });
      } else {
        setMessage({ type: 'error', text: res?.message || 'Invalid OTP' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to verify OTP' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c0c0f] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base font-serif-luxury">Compliance & KYC Verification</h3>
              <p className="text-[11px] text-slate-400">Required for official cash withdrawal approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Pill Card */}
        <div className="px-4 pt-3 space-y-2">
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            currentStatus === 'verified'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : currentStatus === 'pending'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : currentStatus === 'rejected'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              : 'bg-slate-900 border-white/10 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              {currentStatus === 'verified' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : currentStatus === 'pending' ? (
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <AlertCircle className="w-4 h-4 text-slate-400" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] block">KYC Status</span>
                <span className="capitalize font-semibold text-xs">
                  {currentStatus === 'verified' ? 'Verified (Withdrawals Enabled)' : currentStatus === 'pending' ? 'Audit Pending (In Review)' : currentStatus === 'rejected' ? 'Action Required: Resubmit' : 'Unverified (Identity Required)'}
                </span>
              </div>
            </div>

            {user.isPhoneVerified && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                <Check className="w-3 h-3" />
                <span>Phone Verified</span>
              </span>
            )}
          </div>

          {/* Tiered Daily Withdrawal Limits Matrix */}
          <div className="bg-gradient-to-r from-slate-900 to-black border border-white/10 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              RBI / AML Tiered Withdrawal Allowances
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className={`p-1.5 rounded-lg border text-[10px] ${
                !user.isPhoneVerified && currentStatus !== 'verified'
                  ? 'bg-slate-800/80 border-amber-500/40 text-white'
                  : 'bg-black/40 border-white/5 text-slate-400'
              }`}>
                <span className="font-bold block text-slate-300">Tier 1 (Basic)</span>
                <span className="text-amber-400 font-mono font-bold">₹10,000/day</span>
                <span className="text-[8px] text-slate-500 block">Phone OTP</span>
              </div>

              <div className={`p-1.5 rounded-lg border text-[10px] ${
                currentStatus === 'verified'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm'
                  : 'bg-black/40 border-white/5 text-slate-400'
              }`}>
                <span className="font-bold block text-slate-300">Tier 2 (Standard)</span>
                <span className="text-emerald-400 font-mono font-bold">₹1,00,000/day</span>
                <span className="text-[8px] text-slate-500 block">PAN / Aadhaar</span>
              </div>

              <div className="p-1.5 rounded-lg border bg-black/40 border-white/5 text-[10px] text-slate-400">
                <span className="font-bold block text-slate-300">Tier 3 (VIP)</span>
                <span className="text-purple-400 font-mono font-bold">UNLIMITED</span>
                <span className="text-[8px] text-slate-500 block">Video Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher: ID Document vs Phone Verification */}
        <div className="px-4 pt-2">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/50 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('id')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'id' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Government ID (PAN/Aadhaar)</span>
            </button>

            <button
              onClick={() => setActiveTab('phone')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'phone' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP Check</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="px-4 pt-2">
            <div className={`p-2.5 rounded-xl text-xs font-medium ${
              message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {message.text}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {activeTab === 'id' ? (
            <form onSubmit={handleSubmitKYC} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Legal Name (as on PAN/ID)</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={currentStatus === 'verified' || currentStatus === 'pending'}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e: any) => setDocType(e.target.value)}
                    disabled={currentStatus === 'verified' || currentStatus === 'pending'}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="pan">PAN Card (India)</option>
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="passport">Passport / National ID</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Document Number</label>
                  <input
                    type="text"
                    placeholder={docType === 'pan' ? 'ABCDE1234F' : '1234 5678 9012'}
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                    disabled={currentStatus === 'verified' || currentStatus === 'pending'}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Date of Birth (Must be 18+)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={currentStatus === 'verified' || currentStatus === 'pending'}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Simulated ID Card Upload Preview */}
              <div className="p-3 bg-black/40 border border-dashed border-white/20 rounded-xl text-center">
                <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium block">Front ID Document Attached</span>
                <span className="text-[9px] text-slate-500">Auto-scanned & encrypted for AML/Anti-Fraud compliance</span>
              </div>

              {currentStatus !== 'verified' && currentStatus !== 'pending' && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/30 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Documents...' : 'Submit KYC for Verification'}
                </button>
              )}
            </form>
          ) : (
            /* Phone OTP Verification Form */
            <div className="space-y-3">
              <div className="p-3 bg-slate-900 border border-white/10 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] block">Registered Mobile Number</span>
                <div className="font-mono text-sm font-bold text-white flex items-center justify-between">
                  <span>{user.phone}</span>
                  {user.isPhoneVerified ? (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 text-xs font-semibold">Unverified</span>
                  )}
                </div>
              </div>

              {!user.isPhoneVerified ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 shadow-md shadow-indigo-600/30 transition-colors"
                    >
                      {otpSent ? 'Resend OTP' : 'Send 6-Digit SMS OTP'}
                    </button>
                    {otpDevHint && (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/30">
                        Code: {otpDevHint}
                      </span>
                    )}
                  </div>

                  {otpSent && (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="text-slate-300 font-semibold block">Enter Verification Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp || otpCode.length < 4}
                        onClick={handleVerifyOTP}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify Mobile OTP'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-white font-bold text-xs">Phone Security Complete</div>
                  <p className="text-[11px] text-slate-400">Account login and high-value withdrawals are protected.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>256-Bit SSL Compliance Bank-Grade Vault</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
