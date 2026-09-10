import React, { useState } from 'react';
import { X, Scale, ShieldCheck, FileText, AlertOctagon } from 'lucide-react';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'aml' | 'fairplay';
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'aml' | 'fairplay'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0c0c0f] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base font-serif-luxury">Compliance & Legal Policies</h3>
              <p className="text-[11px] text-slate-400">Official operating terms, player protection & disclosures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3">
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/50 border border-white/10 rounded-xl text-[11px]">
            {[
              { id: 'terms', label: 'Terms', icon: FileText },
              { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
              { id: 'aml', label: 'AML / KYC', icon: AlertOctagon },
              { id: 'fairplay', label: 'Fair Play', icon: Scale },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                    activeTab === tab.id ? 'bg-[#D4AF37] text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh]">
          {activeTab === 'terms' && (
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Terms & Conditions of Service</h4>
              <p>
                1. <strong>Eligibility:</strong> You must be at least 18 years of age or the legal age of majority in your jurisdiction to open an account or place wagers on SKG8 Win.
              </p>
              <p>
                2. <strong>Account Responsibility:</strong> Each player is allowed only one registered account. Multi-accounting, emulator manipulation, and automated bot syndicates are strictly forbidden and will result in wallet forfeiture.
              </p>
              <p>
                3. <strong>Deposits & Withdrawals:</strong> Deposits must be made from bank accounts or UPI IDs registered in the player&apos;s own legal name. All withdrawals undergo automated fraud verification and KYC compliance before IMPS dispatch.
              </p>
              <p>
                4. <strong>Financial Risk:</strong> Gaming carries financial risk of capital loss. Players should only wager discretionary entertainment funds.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Privacy & Data Protection Policy</h4>
              <p>
                1. <strong>Information Collection:</strong> We collect necessary registration credentials (phone number, hashed password, payment identifiers) solely for wallet accounting and regulatory compliance.
              </p>
              <p>
                2. <strong>Encryption & Storage:</strong> All personal records, bank account details, and KYC credentials are encrypted with AES-256 and SSL/TLS standards.
              </p>
              <p>
                3. <strong>Third-Party Sharing:</strong> We do not sell or rent player contact information to third-party advertisers. Data is shared exclusively with licensed payment processors (e.g. Cashfree/Razorpay) to execute requested deposits and payouts.
              </p>
            </div>
          )}

          {activeTab === 'aml' && (
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Anti-Money Laundering (AML) & KYC Policy</h4>
              <p>
                1. <strong>Identity Verification:</strong> In accordance with financial compliance rules, withdrawals exceeding standard recreational thresholds require PAN Card / National ID verification.
              </p>
              <p>
                2. <strong>Turnover Requirements:</strong> To prevent illegal laundering, deposited funds must achieve at least 100% turnover (wager volume) before withdrawal eligibility.
              </p>
              <p>
                3. <strong>Suspicious Activity Monitoring:</strong> Rapid deposit-and-withdraw cycles without gameplay will trigger an automated AML compliance freeze pending identity review.
              </p>
            </div>
          )}

          {activeTab === 'fairplay' && (
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Fair Play & Random Number Generation (RNG)</h4>
              <p>
                1. <strong>Provably Fair Standard:</strong> Our crash and lottery games utilize cryptographic SHA-256 and HMAC algorithms with pre-committed server seeds, ensuring complete transparency and mathematical immutability.
              </p>
              <p>
                2. <strong>Certified Return to Player (RTP):</strong> All games maintain mathematically defined RTP percentages between 94% and 98%, audited across millions of simulated game rounds.
              </p>
              <p>
                3. <strong>Zero Operator Intervention:</strong> Round outcomes are generated deterministically by the cryptographic engine without real-time operator alteration.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Official Compliance Standards v4.2</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#D4AF37] text-slate-950 font-bold transition-colors"
          >
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
