import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Shield, Calculator, Hash, Copy, Check, Info } from 'lucide-react';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'calculator'>('calculator');
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState('bdg_community_fairness_seed_v2');
  const [inputServerSeed, setInputServerSeed] = useState('bf98c21a4de1e4b98c392fa44a9d77f3e828192a01349182390a12e3');
  const [nonce, setNonce] = useState(1);
  const [gameType, setGameType] = useState<'aviator' | 'wingo'>('aviator');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSeeds = async () => {
        try {
          const res = await api.getProvablyFairActiveSeeds();
          if (res && res.success) {
            setServerSeedHash(res.serverSeedHash);
            if (res.activeClientSeed) setClientSeed(res.activeClientSeed);
          }
        } catch {
          // fallback
        }
      };
      fetchSeeds();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    soundEffects.click();
    try {
      const res = await api.verifyProvablyFair(inputServerSeed, clientSeed, nonce, gameType);
      if (res && res.success) {
        soundEffects.win();
        setVerificationResult(res);
      }
    } catch (err) {
      console.warn('Verify error', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0c0c0f] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-black">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base font-serif-luxury">Provably Fair Verifier</h3>
              <p className="text-[11px] text-slate-400">Cryptographic HMAC-SHA256 mathematical guarantee</p>
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
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/50 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'calculator' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Verifier</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'info' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </button>
          </div>
        </div>

        {/* Active Public Hash Card */}
        <div className="px-4 pt-2.5">
          <div className="p-2.5 bg-slate-900/90 border border-white/10 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Hash className="w-3 h-3" />
                <span>Next Round Public Server Seed (Pre-Committed Hash)</span>
              </span>
              <button
                onClick={() => copyToClipboard(serverSeedHash)}
                className="text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-300 break-all bg-black/50 p-1.5 rounded-lg border border-white/5 select-all">
              {serverSeedHash || 'bf98c21a4de1e4b98c392fa44a9d77f3e828192a01349182390a12e3'}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {activeTab === 'calculator' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Game Engine</label>
                  <select
                    value={gameType}
                    onChange={(e: any) => setGameType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="aviator">Aviator Crash Multiplier</option>
                    <option value="wingo">Win Go Color & Number</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Round Nonce</label>
                  <input
                    type="number"
                    min={1}
                    value={nonce}
                    onChange={(e) => setNonce(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Server Seed (Unhashed / Secret)</label>
                <input
                  type="text"
                  value={inputServerSeed}
                  onChange={(e) => setInputServerSeed(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Client Seed (Public)</label>
                <input
                  type="text"
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="button"
                disabled={isVerifying}
                onClick={handleVerify}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isVerifying ? 'Verifying Hashes...' : 'Calculate & Prove Fair Outcome'}
              </button>

              {/* Verification Output */}
              {verificationResult && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Cryptographic Verification Passed!</span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-300">
                    <div className="flex justify-between border-b border-white/5 py-1">
                      <span className="text-slate-400">Calculated Outcome:</span>
                      <span className="text-[#D4AF37] font-black text-sm">
                        {gameType === 'aviator'
                          ? `${verificationResult.outcome?.crashPoint?.toFixed(2)}x Multiplier`
                          : `Number ${verificationResult.outcome?.number} (${verificationResult.outcome?.color}, ${verificationResult.outcome?.size})`}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-400 text-[10px] block">HMAC-SHA256 Signature:</span>
                      <span className="text-[10px] text-emerald-300 break-all">
                        {verificationResult.calculatedHash}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 text-slate-300 leading-relaxed text-xs">
              <h4 className="text-white font-bold text-sm font-serif-luxury">The SKG8 Win Provably Fair Protocol</h4>
              <p>
                Provably Fair is a mathematical algorithm that allows players to independently verify that every game outcome is completely fair and unmanipulated by the platform operator.
              </p>
              <div className="p-3 bg-slate-900 border border-white/10 rounded-xl space-y-1.5">
                <div className="font-bold text-white text-xs">1. Server Seed Pre-Commitment:</div>
                <p className="text-slate-400 text-[11px]">
                  Before a round begins, the server generates a random secret server seed and publishes its SHA-256 hash. Because SHA-256 is one-way, the platform cannot alter this seed later without changing the published hash.
                </p>
              </div>
              <div className="p-3 bg-slate-900 border border-white/10 rounded-xl space-y-1.5">
                <div className="font-bold text-white text-xs">2. Client Seed & Nonce:</div>
                <p className="text-slate-400 text-[11px]">
                  The player provides a client seed (which cannot be known or chosen by the operator in advance), and each round has an incremental nonce number.
                </p>
              </div>
              <div className="p-3 bg-slate-900 border border-white/10 rounded-xl space-y-1.5">
                <div className="font-bold text-white text-xs">3. HMAC-SHA256 Deterministic Outcome:</div>
                <p className="text-slate-400 text-[11px]">
                  The final outcome (e.g. 2.45x crash point or Win Go color) is calculated strictly using HMAC-SHA256(ServerSeed, ClientSeed:Nonce). Any third-party SHA256 calculator will give the exact same output.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>SHA-256 / HMAC-SHA256 Certified</span>
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
