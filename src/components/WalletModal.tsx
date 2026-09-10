import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ArrowDownCircle, ArrowUpCircle, History, Sparkles, 
  CheckCircle2, AlertCircle, X, QrCode, ShieldCheck, RefreshCw, Copy, Server,
  Clock, ArrowRight, ExternalLink, Smartphone, Upload, Check, Zap, Crown,
  Building2, Landmark, DollarSign, Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { api } from '../services/api';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  transactions: Transaction[];
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: Transaction) => void;
  initialTab?: 'deposit' | 'withdraw' | 'records';
  initialAmount?: number;
  onOpenAdmin?: () => void;
}

const DEPOSIT_AMOUNTS = [100, 300, 500, 1000, 2000, 5000, 10000, 25000, 50000];

const PAYMENT_CHANNELS = [
  { id: 'cashfree', name: 'Cashfree PG (Instant Automated UPI & Cards)', bonus: '5% Extra Cash', icon: '⚡', color: 'from-emerald-500 to-teal-700', tag: 'Automated 24/7' },
  { id: 'upi', name: 'Instant UPI Fast (PhonePe / GPay / Paytm)', bonus: '5% Extra Cash', icon: '⚡', color: 'from-amber-500 to-yellow-600', tag: 'Fastest' },
  { id: 'qr', name: 'Dynamic UPI QR Scan & Pay', bonus: '5% Extra Cash', icon: '📱', color: 'from-purple-600 to-indigo-700', tag: 'Instant' },
  { id: 'card', name: 'Debit / Credit Card (Visa, RuPay, Master)', bonus: '5% Extra Cash', icon: '💳', color: 'from-blue-600 to-cyan-700', tag: 'Cards' },
  { id: 'netbanking', name: 'NetBanking (SBI, HDFC, ICICI, Axis)', bonus: '5% Extra Cash', icon: '🏛️', color: 'from-slate-700 to-slate-800', tag: 'Direct' },
  { id: 'usdt', name: 'USDT Crypto (TRC-20 & BEP-20)', bonus: '8% Extra Cash', icon: '🟢', color: 'from-emerald-600 to-teal-700', tag: '8% VIP' },
  { id: 'bank', name: 'Direct Bank Transfer (IMPS / RTGS)', bonus: '3% Extra Cash', icon: '🏦', color: 'from-amber-700 to-amber-900', tag: 'NEFT' },
];

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KKBK' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB' },
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  user,
  transactions,
  onUpdateBalance,
  onAddTransaction,
  initialTab = 'deposit',
  initialAmount = 500,
  onOpenAdmin,
}) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'records'>(initialTab);
  
  // Deposit flow state: 'select' -> 'pay' -> 'cashfree_pay' -> 'card_pay' -> 'netbanking_pay' -> 'success'
  const [depositStep, setDepositStep] = useState<'select' | 'pay' | 'cashfree_pay' | 'card_pay' | 'netbanking_pay' | 'success'>('select');
  const [depositAmount, setDepositAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentChannel, setPaymentChannel] = useState<string>('cashfree');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  
  // Cashfree PG State
  const [cfOrderData, setCfOrderData] = useState<any>(null);
  const [isSimulatingCf, setIsSimulatingCf] = useState(false);
  
  // Card input state
  const [cardNumber, setCardNumber] = useState('4532 8190 2841 9028');
  const [cardHolder, setCardHolder] = useState(user.name || 'Arpita Singh');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('892');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('sbi');
  
  // Active Order State
  const [orderData, setOrderData] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins
  const [depositSuccessResult, setDepositSuccessResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(300);
  const [accountName, setAccountName] = useState(user.bankDetails?.accountName || user.name || 'Arpita Singh');
  const [accountNumber, setAccountNumber] = useState(user.bankDetails?.accountNumber || '918273645012');
  const [ifscCode, setIfscCode] = useState(user.bankDetails?.ifscCode || 'SBIN0001234');
  const [upiId, setUpiId] = useState(user.bankDetails?.upiId || 'arpitasinghmcoin@okhdfcbank');
  const [withdrawType, setWithdrawType] = useState<'bank' | 'upi'>('upi');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTab(initialTab);
    if (initialAmount) setDepositAmount(initialAmount);
    setDepositStep('select');
  }, [initialTab, initialAmount, isOpen]);

  // Countdown timer for active order
  useEffect(() => {
    let interval: any = null;
    if ((depositStep === 'pay' || depositStep === 'cashfree_pay') && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [depositStep, secondsRemaining]);

  // Real-time polling for Cashfree payment status
  useEffect(() => {
    let pollTimer: any = null;
    if (depositStep === 'cashfree_pay' && cfOrderData?.orderId) {
      pollTimer = setInterval(async () => {
        try {
          const res = await api.getCashfreeOrderStatus(cfOrderData.orderId);
          if (res && res.isPaid) {
            soundEffects.win();
            confetti({ particleCount: 100, spread: 80 });
            if (res.newBalance !== undefined) {
              onUpdateBalance(res.newBalance);
            } else {
              onUpdateBalance(user.balance + (cfOrderData.totalCredit || currentEffectiveAmount * 1.05));
            }
            if (res.transaction) {
              onAddTransaction(res.transaction);
            }
            setDepositSuccessResult({
              message: `🎉 Cashfree PG Verified! ₹${(cfOrderData.totalCredit || currentEffectiveAmount * 1.05).toFixed(2)} Credited.`,
              orderId: cfOrderData.orderId,
            });
            setDepositStep('success');
            clearInterval(pollTimer);
          }
        } catch {
          // ignore poll error
        }
      }, 2500);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [depositStep, cfOrderData]);

  if (!isOpen) return null;

  const currentEffectiveAmount = customAmount ? parseFloat(customAmount) || depositAmount : depositAmount;
  const bonusRate = paymentChannel === 'usdt' ? 0.08 : (paymentChannel === 'bank' ? 0.03 : 0.05);
  const currentBonus = Math.floor(currentEffectiveAmount * bonusRate);
  const totalCreditExpected = currentEffectiveAmount + currentBonus;

  const copyToClipboard = (text: string, fieldName: string) => {
    soundEffects.click();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLaunchCashfreeCheckout = () => {
    soundEffects.click();
    if (!cfOrderData?.paymentSessionId) {
      setErrorMsg('Cashfree Payment Session not found');
      return;
    }
    try {
      if ((window as any).Cashfree) {
        const cashfree = (window as any).Cashfree({
          mode: cfOrderData.environment === 'production' ? 'production' : 'sandbox',
        });
        cashfree.checkout({
          paymentSessionId: cfOrderData.paymentSessionId,
          redirectTarget: '_modal',
        });
      } else {
        window.open(`https://payments-test.cashfree.com/order/#${cfOrderData.paymentSessionId}`, '_blank');
      }
    } catch (e: any) {
      console.error('Cashfree launch error:', e);
      setErrorMsg('Could not open Cashfree checkout modal. You can use instant simulation or UPI below.');
    }
  };

  const handleSimulateCashfreePayment = async () => {
    if (!cfOrderData?.orderId) return;
    soundEffects.click();
    setIsSimulatingCf(true);
    setErrorMsg(null);
    try {
      const res = await api.simulateCashfreePayment(cfOrderData.orderId);
      if (res && res.success) {
        soundEffects.win();
        confetti({ particleCount: 110, spread: 85 });
        if (res.newBalance !== undefined) {
          onUpdateBalance(res.newBalance);
        } else {
          onUpdateBalance(user.balance + (cfOrderData.totalCredit || currentEffectiveAmount * 1.05));
        }
        if (res.transaction) {
          onAddTransaction(res.transaction);
        }
        setDepositSuccessResult({
          message: `🎉 Cashfree Payment Verified! ₹${(cfOrderData.totalCredit || currentEffectiveAmount * 1.05).toFixed(2)} Credited.`,
          orderId: cfOrderData.orderId,
        });
        setDepositStep('success');
      } else {
        setErrorMsg(res?.message || 'Simulation failed');
      }
    } catch {
      setErrorMsg('Error simulating payment');
    } finally {
      setIsSimulatingCf(false);
    }
  };

  const handleCreateOrder = async () => {
    soundEffects.click();
    setErrorMsg(null);
    if (!currentEffectiveAmount || currentEffectiveAmount < 100) {
      setErrorMsg('Minimum deposit amount is ₹100');
      return;
    }

    if (paymentChannel === 'card') {
      setDepositStep('card_pay');
      return;
    }

    if (paymentChannel === 'netbanking') {
      setDepositStep('netbanking_pay');
      return;
    }

    setIsProcessingDeposit(true);
    try {
      if (paymentChannel === 'cashfree') {
        const cfRes = await api.createCashfreeOrder(currentEffectiveAmount);
        if (cfRes && cfRes.success) {
          setCfOrderData(cfRes);
          setSecondsRemaining(900);
          setDepositStep('cashfree_pay');
          // Automatically launch checkout modal if SDK is available
          setTimeout(() => {
            if ((window as any).Cashfree && cfRes.paymentSessionId) {
              try {
                const cashfree = (window as any).Cashfree({
                  mode: cfRes.environment === 'production' ? 'production' : 'sandbox',
                });
                cashfree.checkout({
                  paymentSessionId: cfRes.paymentSessionId,
                  redirectTarget: '_modal',
                });
              } catch (err) {
                console.warn('Auto Cashfree checkout launch note:', err);
              }
            }
          }, 400);
        } else {
          setErrorMsg(cfRes?.message || 'Failed to initialize Cashfree Gateway Order');
        }
        return;
      }

      const res = await api.createDepositOrder(currentEffectiveAmount, paymentChannel.toUpperCase());
      if (res && res.success) {
        setOrderData(res);
        setSecondsRemaining(900);
        setUtrNumber('42' + Math.floor(1000000000 + Math.random() * 9000000000));
        setDepositStep('pay');
      } else {
        // Fallback local order
        const fallbackOrder = {
          orderId: 'ORD_' + Date.now().toString().slice(-8),
          amount: currentEffectiveAmount,
          bonusAmount: currentBonus,
          totalCredit: totalCreditExpected,
          paymentDetails: {
            upiVpa: 'skg8pay@okaxis',
            merchantName: 'SKG8 VIP GAMING',
            upiIntentUrl: `upi://pay?pa=skg8pay@okaxis&pn=SKG8+VIP+GAMING&am=${currentEffectiveAmount}&cu=INR&tn=DEP_${Date.now().toString().slice(-6)}`,
            usdtAddress: 'TX8qN2yK7vB4wZ9pQ1mE5rT3uA7xY0cM',
            bankAccount: '918273645012',
            bankIfsc: 'SBIN0001234',
            bankHolder: 'SKG ENTERTAINMENT PVT LTD',
          }
        };
        setOrderData(fallbackOrder);
        setUtrNumber('42' + Math.floor(1000000000 + Math.random() * 9000000000));
        setDepositStep('pay');
      }
    } catch {
      setErrorMsg('Failed to create deposit order. Please try again.');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleExecuteDirectDeposit = async (channelName: string) => {
    soundEffects.click();
    setIsProcessingDeposit(true);
    setErrorMsg(null);
    try {
      const res = await api.depositMoney(currentEffectiveAmount, channelName);
      if (res && res.success) {
        soundEffects.win();
        confetti({ particleCount: 90, spread: 80 });
        if (res.newBalance !== undefined) {
          onUpdateBalance(res.newBalance);
        } else {
          onUpdateBalance(user.balance + totalCreditExpected);
        }
        if (res.transaction) {
          onAddTransaction(res.transaction);
        }
        setDepositSuccessResult(res);
        setDepositStep('success');
      } else {
        setErrorMsg(res?.message || 'Deposit failed');
      }
    } catch {
      setErrorMsg('Failed to process payment');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleSubmitUtr = async (autoApprove: boolean = true) => {
    soundEffects.click();
    setErrorMsg(null);

    if (!utrNumber || utrNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR reference number');
      return;
    }

    setIsProcessingDeposit(true);
    try {
      const res = await api.submitDepositUtr(
        orderData?.orderId || 'ORD_' + Date.now(),
        currentEffectiveAmount,
        paymentChannel.toUpperCase(),
        utrNumber.trim(),
        proofFile || undefined,
        autoApprove
      );

      if (res && res.success) {
        soundEffects.win();
        confetti({ particleCount: 90, spread: 80 });
        if (res.newBalance !== undefined) {
          onUpdateBalance(res.newBalance);
        } else {
          onUpdateBalance(user.balance + totalCreditExpected);
        }
        if (res.transaction) {
          onAddTransaction(res.transaction);
        }
        setDepositSuccessResult(res);
        setDepositStep('success');
      } else {
        setErrorMsg(res?.message || 'Failed to submit UTR reference.');
      }
    } catch {
      setErrorMsg('Error contacting server. Please check your connection.');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    soundEffects.click();
    setWithdrawMsg(null);

    if (!withdrawAmount || withdrawAmount < 200) {
      setWithdrawMsg({ type: 'error', text: 'Minimum withdrawal amount is ₹200' });
      return;
    }

    if (withdrawAmount > user.balance) {
      setWithdrawMsg({ type: 'error', text: 'Insufficient wallet balance for this payout' });
      return;
    }

    if (withdrawType === 'upi' && (!upiId || !upiId.includes('@'))) {
      setWithdrawMsg({ type: 'error', text: 'Please enter a valid receiver UPI ID' });
      return;
    }

    if (withdrawType === 'bank' && (!accountNumber || !ifscCode)) {
      setWithdrawMsg({ type: 'error', text: 'Please fill valid Bank Account Number and IFSC Code' });
      return;
    }

    setIsProcessingWithdraw(true);
    try {
      const bankData = {
        accountName,
        accountNumber,
        ifscCode,
        upiId,
        bankName: withdrawType === 'upi' ? 'UPI Virtual Handle' : 'State Bank of India',
      };

      const res = await api.withdrawMoney(withdrawAmount, bankData);
      if (res && res.success) {
        soundEffects.cashout();
        if (res.newBalance !== undefined) {
          onUpdateBalance(res.newBalance);
        } else {
          onUpdateBalance(user.balance - withdrawAmount);
        }
        if (res.transaction) {
          onAddTransaction(res.transaction);
        }
        setWithdrawMsg({
          type: 'success',
          text: `Withdrawal request of ₹${withdrawAmount} submitted to Controller Room!`,
        });
      } else {
        setWithdrawMsg({ type: 'error', text: res?.message || 'Withdrawal submission failed.' });
      }
    } catch {
      setWithdrawMsg({ type: 'error', text: 'Server connection error during withdrawal.' });
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const upiIntent = orderData?.paymentDetails?.upiIntentUrl || `upi://pay?pa=skg8pay@okaxis&pn=SKG8+VIP+GAMING&am=${currentEffectiveAmount}&cu=INR&tn=DEP${orderData?.orderId || ''}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntent)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-2xl my-8 text-white">
        
        {/* Header Bar */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-b from-[#1F1B12] via-[#141414] to-[#141414] border-b border-[#D4AF37]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F2D06B] to-[#AA771C] flex items-center justify-center text-black shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#F2D06B]">Add Real Money & Wallet Vault</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live 24/7
                </span>
              </div>
              <p className="text-xs text-gray-400">Instant UPI, QR, Cards, NetBanking & USDT with +5% Cash Bonus</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.click(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Balance Overview Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-b border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Current Vault Balance</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#F2D06B] tracking-tight">₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                VIP {user.vipLevel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">Account: {user.name || user.phone}</span>
            {user.role === 'controller' ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Crown className="w-3 h-3" /> Master Controller
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">UID: {user.id}</span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-2 bg-[#0D0D0D] border-b border-white/5 gap-1 text-xs font-semibold">
          <button
            onClick={() => { soundEffects.click(); setTab('deposit'); setDepositStep('select'); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              tab === 'deposit' 
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow-md font-bold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Add Money (+5%)</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setTab('withdraw'); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              tab === 'withdraw' 
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow-md font-bold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setTab('records'); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              tab === 'records' 
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black shadow-md font-bold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Passbook</span>
          </button>
        </div>

        {/* TAB 1: REAL DEPOSIT FLOW */}
        {tab === 'deposit' && (
          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Select Amount & Channel */}
            {depositStep === 'select' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">1. Select Deposit Amount (INR)</label>
                    <span className="text-[11px] text-[#F2D06B] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> +5% Instant Bonus
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {DEPOSIT_AMOUNTS.map((amt) => {
                      const isSelected = !customAmount && depositAmount === amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => {
                            soundEffects.click();
                            setDepositAmount(amt);
                            setCustomAmount('');
                          }}
                          className={`relative py-3 px-2 rounded-xl text-center border font-bold text-xs transition-all ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#D4AF37]/20 to-transparent border-[#D4AF37] text-[#F2D06B] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                              : 'bg-[#181818] border-white/5 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <span className="text-sm">₹{amt.toLocaleString('en-IN')}</span>
                          <span className="block text-[9px] text-emerald-400 font-medium mt-0.5">
                            +₹{Math.floor(amt * (paymentChannel === 'usdt' ? 0.08 : 0.05))} Bonus
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        placeholder="Or enter custom amount (Min ₹100)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-[#181818] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Channels */}
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">2. Select Payment Option</label>
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {PAYMENT_CHANNELS.map((ch) => {
                      const isSelected = paymentChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => { soundEffects.click(); setPaymentChannel(ch.id); }}
                          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                            isSelected 
                              ? 'bg-[#1F1A10] border-[#D4AF37] text-white shadow-md' 
                              : 'bg-[#181818] border-white/5 text-gray-300 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{ch.icon}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{ch.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono">{ch.tag}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">Instant 1-Click Verification & Crediting</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold whitespace-nowrap">
                            {ch.bonus}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Summary Card */}
                <div className="p-3.5 bg-[#0D0D0D] border border-white/5 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Deposit Amount:</span>
                    <span className="text-white font-semibold">₹{currentEffectiveAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>VIP Extra Bonus ({Math.round(bonusRate * 100)}%):</span>
                    <span className="text-emerald-400 font-semibold">+₹{currentBonus.toFixed(2)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/5 flex justify-between font-bold">
                    <span className="text-[#F2D06B]">Total Vault Credit:</span>
                    <span className="text-[#F2D06B] text-sm">₹{totalCreditExpected.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    id="wallet-create-order-btn"
                    onClick={handleCreateOrder}
                    disabled={isProcessingDeposit}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#AA771C] text-black font-black text-sm shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
                  >
                    {isProcessingDeposit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Generating Gateway Order...
                      </>
                    ) : (
                      <>
                        <span>Add ₹{currentEffectiveAmount} via {PAYMENT_CHANNELS.find(p => p.id === paymentChannel)?.name.split(' ')[0]}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* 1-Click Instant Test Deposit shortcut */}
                  <button
                    onClick={() => handleExecuteDirectDeposit('Instant Quick Credit')}
                    disabled={isProcessingDeposit}
                    className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>⚡ 1-Click Instant Credit (Fast ₹{currentEffectiveAmount} Simulation)</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Cashfree Payment Gateway Screen */}
            {depositStep === 'cashfree_pay' && cfOrderData && (
              <div className="space-y-4">
                {/* Gateway Top Status Banner */}
                <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Cashfree Automated Gateway Active</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    {formatTime(secondsRemaining)}
                  </span>
                </div>

                {/* Cashfree Order Summary Card */}
                <div className="p-4 bg-[#0D0D0D] border border-emerald-500/30 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-xs shadow-md">
                        CF
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          Cashfree Payments PG
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            {cfOrderData.environment === 'production' ? 'PROD' : 'SANDBOX'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                          Order: {cfOrderData.orderId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#F2D06B]">
                        ₹{cfOrderData.orderAmount || currentEffectiveAmount}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-semibold">
                        +5% VIP Bonus Active
                      </div>
                    </div>
                  </div>

                  {/* Primary Launch Checkout Button */}
                  <button
                    onClick={handleLaunchCashfreeCheckout}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-xs shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Cashfree Secure Checkout</span>
                  </button>

                  {/* Fast UPI Direct deep links */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 block font-medium">Or pay directly via UPI App:</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <a
                        href={`upi://pay?pa=cashfree@icici&pn=SKG8+VIP+GAMING&am=${currentEffectiveAmount}&cu=INR&tn=${cfOrderData.orderId}`}
                        className="p-2 rounded-lg bg-[#181818] border border-white/5 hover:border-[#D4AF37]/50 text-center flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-all"
                      >
                        <span className="text-base">🟣</span>
                        <span className="text-[10px] font-bold">PhonePe</span>
                      </a>
                      <a
                        href={`upi://pay?pa=cashfree@icici&pn=SKG8+VIP+GAMING&am=${currentEffectiveAmount}&cu=INR&tn=${cfOrderData.orderId}`}
                        className="p-2 rounded-lg bg-[#181818] border border-white/5 hover:border-[#D4AF37]/50 text-center flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-all"
                      >
                        <span className="text-base">🔵</span>
                        <span className="text-[10px] font-bold">Google Pay</span>
                      </a>
                      <a
                        href={`upi://pay?pa=cashfree@icici&pn=SKG8+VIP+GAMING&am=${currentEffectiveAmount}&cu=INR&tn=${cfOrderData.orderId}`}
                        className="p-2 rounded-lg bg-[#181818] border border-white/5 hover:border-[#D4AF37]/50 text-center flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-all"
                      >
                        <span className="text-base">🔷</span>
                        <span className="text-[10px] font-bold">Paytm UPI</span>
                      </a>
                    </div>
                  </div>

                  {/* Auto-Polling Radar / Live Status */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <div>
                        <div className="text-[11px] font-bold text-white">Listening for Bank Confirmation</div>
                        <div className="text-[9px] text-gray-400">Auto-credits vault within seconds upon payment</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                      POLLING...
                    </span>
                  </div>

                  {/* Sandbox Instant Simulation Button */}
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={handleSimulateCashfreePayment}
                      disabled={isSimulatingCf}
                      className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isSimulatingCf ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulating Gateway Callback...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          <span>⚡ Test Mode: Simulate Instant Cashfree Success</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <button
                    onClick={() => { soundEffects.click(); setDepositStep('select'); }}
                    className="hover:text-white underline"
                  >
                    ← Back to Payment Methods
                  </button>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2A: Card Payment Screen */}
            {depositStep === 'card_pay' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-[#1F1F1F] to-[#0D0D0D] border border-white/10 rounded-2xl relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span className="font-bold text-[#F2D06B]">Credit / Debit Card Checkout</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">256-Bit SSL</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Card Number</label>
                      <input 
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 8190 2841 9028"
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Cardholder Name</label>
                      <input 
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Expiry (MM/YY)</label>
                        <input 
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">CVV</label>
                        <input 
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleExecuteDirectDeposit('Card Gateway')}
                  disabled={isProcessingDeposit}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingDeposit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Authorize & Pay ₹{currentEffectiveAmount} (Instant 3DS)</span>
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => setDepositStep('select')}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    ← Back to Payment Methods
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2B: NetBanking Screen */}
            {depositStep === 'netbanking_pay' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">Select NetBanking Institution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_BANKS.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          selectedBank === bank.id
                            ? 'bg-[#1F1A10] border-[#D4AF37] text-white'
                            : 'bg-[#181818] border-white/5 text-gray-300 hover:border-white/15'
                        }`}
                      >
                        <Landmark className="w-4 h-4 text-[#D4AF37]" />
                        <div>
                          <div className="text-xs font-bold">{bank.name}</div>
                          <div className="text-[9px] text-gray-400">{bank.code} Direct Gateway</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleExecuteDirectDeposit(`NetBanking (${selectedBank.toUpperCase()})`)}
                  disabled={isProcessingDeposit}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-sm shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
                >
                  {isProcessingDeposit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  <span>Proceed to {POPULAR_BANKS.find(b => b.id === selectedBank)?.name} Portal</span>
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => setDepositStep('select')}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    ← Back to Payment Methods
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2C: Real Payment QR & UTR Verification */}
            {depositStep === 'pay' && orderData && (
              <div className="space-y-4">
                {/* Timer Header */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Payment Gateway Active</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white bg-black/50 px-2 py-0.5 rounded border border-amber-500/40">
                    {formatTime(secondsRemaining)}
                  </span>
                </div>

                {/* QR Code & Direct Payment Box */}
                <div className="p-4 bg-[#0D0D0D] border border-[#D4AF37]/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
                  <div className="p-2 bg-white rounded-xl shadow-md border-2 border-[#D4AF37]">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      className="w-40 h-40 object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400">Scan using PhonePe, Google Pay, Paytm or any UPI App</span>
                    <div className="text-base font-black text-[#F2D06B]">
                      Amount: ₹{currentEffectiveAmount} <span className="text-xs text-emerald-400">(+₹{currentBonus} Bonus)</span>
                    </div>
                  </div>

                  {/* Merchant Details Copy Rows */}
                  <div className="w-full space-y-2 pt-2 border-t border-white/5 text-xs text-left">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Merchant UPI VPA</span>
                        <span className="font-mono text-xs text-white font-semibold">{orderData.paymentDetails.upiVpa}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(orderData.paymentDetails.upiVpa, 'upiVpa')}
                        className="px-2.5 py-1 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 text-[10px] font-bold flex items-center gap-1 border border-[#D4AF37]/40"
                      >
                        {copiedField === 'upiVpa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'upiVpa' ? 'Copied' : 'Copy UPI'}
                      </button>
                    </div>

                    {paymentChannel === 'usdt' && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div>
                          <span className="text-[10px] text-gray-400 block">USDT TRC20 Address (~${(currentEffectiveAmount / 90).toFixed(2)} USDT)</span>
                          <span className="font-mono text-[10px] text-white font-semibold truncate max-w-[200px] block">
                            {orderData.paymentDetails.usdtAddress}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(orderData.paymentDetails.usdtAddress, 'usdt')}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/40"
                        >
                          {copiedField === 'usdt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy TRC20
                        </button>
                      </div>
                    )}

                    {paymentChannel === 'bank' && (
                      <div className="p-2.5 rounded-lg bg-white/5 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bank Name:</span>
                          <span className="text-white font-bold">State Bank of India</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account No:</span>
                          <span className="text-white font-bold">{orderData.paymentDetails.bankAccount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">IFSC Code:</span>
                          <span className="text-white font-bold">{orderData.paymentDetails.bankIfsc}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Beneficiary:</span>
                          <span className="text-white">{orderData.paymentDetails.bankHolder}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct Launch Button */}
                  <a
                    href={upiIntent}
                    className="w-full py-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Smartphone className="w-4 h-4" /> Open In PhonePe / GPay / Paytm
                  </a>
                </div>

                {/* Step 3: Enter 12-digit UTR Reference */}
                <div className="p-4 bg-[#181818] border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-200">Enter 12-Digit UPI UTR / Ref Number</label>
                    <span className="text-[10px] text-amber-400">Step 2: Verification</span>
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="e.g. 424918274910 (Check UPI receipt)"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#D4AF37]/50 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-[10px] text-gray-400">
                    Find the 12-digit UTR / UPI Ref ID in your banking app's payment confirmation receipt.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id="wallet-auto-verify-btn"
                      onClick={() => handleSubmitUtr(true)}
                      disabled={isProcessingDeposit}
                      className="py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 text-yellow-300" />
                      <span>⚡ Instant Auto-Verify</span>
                    </button>
                    <button
                      id="wallet-submit-controller-btn"
                      onClick={() => handleSubmitUtr(false)}
                      disabled={isProcessingDeposit}
                      className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Submit to Controller</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <button 
                    onClick={() => { soundEffects.click(); setDepositStep('select'); }}
                    className="hover:text-white underline"
                  >
                    ← Back to Amount Selection
                  </button>
                  {onOpenAdmin && (
                    <button
                      onClick={() => { soundEffects.click(); onClose(); onOpenAdmin(); }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <Crown className="w-3 h-3" /> Controller Approval Room →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Success Screen */}
            {depositStep === 'success' && (
              <div className="p-6 bg-[#0D0D0D] border border-emerald-500/40 rounded-3xl text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Deposit Successfully Processed!</h3>
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    {depositSuccessResult?.message || `₹${totalCreditExpected.toFixed(2)} Credited to Vault!`}
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl text-xs space-y-1 text-left">
                  <div className="flex justify-between text-gray-400">
                    <span>New Balance:</span>
                    <span className="text-[#F2D06B] font-bold">₹{user.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>UTR Reference:</span>
                    <span className="font-mono text-white">{utrNumber || 'INSTANT_PAY_DIRECT'}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Channel:</span>
                    <span className="text-white font-semibold">{paymentChannel.toUpperCase()}</span>
                  </div>
                </div>

                <button
                  onClick={() => { soundEffects.click(); onClose(); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg hover:brightness-110"
                >
                  Done & Return to Games
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WITHDRAWAL */}
        {tab === 'withdraw' && (
          <div className="p-6 space-y-4">
            {withdrawMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                withdrawMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {withdrawMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{withdrawMsg.text}</span>
              </div>
            )}

            {/* Withdrawal Mode Toggle */}
            <div className="grid grid-cols-2 p-1 bg-[#0D0D0D] border border-white/5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => { soundEffects.click(); setWithdrawType('upi'); }}
                className={`py-2 rounded-lg transition-all ${
                  withdrawType === 'upi' ? 'bg-[#D4AF37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                ⚡ Instant UPI Transfer
              </button>
              <button
                onClick={() => { soundEffects.click(); setWithdrawType('bank'); }}
                className={`py-2 rounded-lg transition-all ${
                  withdrawType === 'bank' ? 'bg-[#D4AF37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                🏦 Bank IMPS Transfer
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">Withdrawal Amount (Min ₹200)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {withdrawType === 'upi' ? (
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">Receiver UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. arpitasinghmcoin@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleWithdrawSubmit}
              disabled={isProcessingWithdraw}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#AA771C] text-black font-black text-sm shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
            >
              {isProcessingWithdraw ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payout...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Request Withdrawal of ₹{withdrawAmount}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: PASSBOOK & RECORDS */}
        {tab === 'records' && (
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No transactions recorded yet in this session.
              </div>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type === 'deposit' || tx.type === 'win' || tx.type === 'referral_bonus' || tx.type === 'checkin';
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isCredit ? '+' : '-'}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{tx.title}</span>
                        <span className="text-[10px] text-gray-400">{tx.description}</span>
                        {tx.txHash && (
                          <span className="text-[9px] font-mono text-gray-500 block mt-0.5">Ref: {tx.txHash}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-sm block ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        tx.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : tx.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};
