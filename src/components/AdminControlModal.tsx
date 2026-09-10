import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Zap, Plane, Palette, Crown, RefreshCw, X, Check,
  AlertTriangle, DollarSign, Sliders, Play, Flame, Layers, Award,
  Sparkles, CheckCircle2, ChevronRight, Activity, Cpu, ArrowUpRight,
  Users, ArrowDownCircle, ArrowUpCircle, Radio, Megaphone, Eye,
  Lock, Unlock, UserCheck, ShieldCheck, CheckCircle, Scale, Download,
  FileSpreadsheet, AlertOctagon, FileText, Search, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshUserData: () => void;
}

export const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  onRefreshUserData,
}) => {
  const [activeTab, setActiveTab] = useState<
    'aviator' | 'wingo' | 'risk' | 'fraud' | 'audit' | 'settlement' | 'users' | 'deposits' | 'withdrawals' | 'games' | 'broadcast' | 'kyc' | 'finance'
  >('aviator');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live overview & rosters
  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [depositsList, setDepositsList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [liveBetsList, setLiveBetsList] = useState<any[]>([]);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  // Enterprise Modules State
  const [riskData, setRiskData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('');
  const [fraudData, setFraudData] = useState<any>(null);
  const [fraudFilter, setFraudFilter] = useState('');
  const [settlementData, setSettlementData] = useState<any>(null);
  const [targetRtpInput, setTargetRtpInput] = useState<number>(95);

  // Aviator controls
  const [aviatorTarget, setAviatorTarget] = useState<string>('2.50');
  const [aviatorMode, setAviatorMode] = useState<string>('auto');

  // WinGo controls
  const [selectedWinGoType, setSelectedWinGoType] = useState<string>('1min');
  const [forcedNumber, setForcedNumber] = useState<number | null>(null);
  const [forcedColor, setForcedColor] = useState<'green' | 'red' | 'violet' | null>(null);
  const [forcedSize, setForcedSize] = useState<'Big' | 'Small' | null>(null);
  const [winGoMode, setWinGoMode] = useState<'auto' | 'smart_house_profit' | 'manual'>('auto');

  // Dragon Tiger, Mines, Roulette & Limbo
  const [dtWinner, setDtWinner] = useState<'auto' | 'dragon' | 'tiger' | 'tie'>('auto');
  const [minesRig, setMinesRig] = useState<'auto' | 'safe' | 'explode'>('auto');
  const [rouletteNum, setRouletteNum] = useState<string>('7');
  const [limboMult, setLimboMult] = useState<string>('2.00');

  // User management modal state
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('1000');

  // Broadcast message input
  const [broadcastText, setBroadcastText] = useState<string>('');

  // Fetch all admin surveillance data
  const fetchAllData = async () => {
    try {
      const [ov, users, deps, wdrs, bets, kyc, fin, risk, audits, fraud, settlement] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminDeposits(),
        api.getAdminWithdrawals(),
        api.getAdminLiveBets(),
        api.getAdminKYCList(),
        api.getAdminFinancialStats(),
        api.getRiskLiability().catch(() => null),
        api.getAdminAuditLogs().catch(() => null),
        api.getFraudDetection().catch(() => null),
        api.getSettlementReport().catch(() => null),
      ]);

      if (ov && ov.success) {
        setOverview(ov);
        if (ov.settings?.aviator?.mode) setAviatorMode(ov.settings.aviator.mode);
      }
      if (users && users.users) setUsersList(users.users);
      if (deps && deps.deposits) setDepositsList(deps.deposits);
      if (wdrs && wdrs.withdrawals) setWithdrawalsList(wdrs.withdrawals);
      if (bets && bets.bets) setLiveBetsList(bets.bets);
      if (kyc && kyc.records) setKycQueue(kyc.records);
      if (fin && fin.metrics) setFinancialMetrics(fin.metrics);
      if (risk && risk.success) {
        setRiskData(risk);
        if (risk.targetPlatformRTP) setTargetRtpInput(risk.targetPlatformRTP);
      }
      if (audits && audits.logs) setAuditLogs(audits.logs);
      if (fraud && fraud.success) setFraudData(fraud);
      if (settlement && settlement.report) setSettlementData(settlement.report);
    } catch (e) {
      console.error('Failed to poll admin data', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchAllData();
    const interval = setInterval(fetchAllData, 1500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // --- RISK & FRAUD ACTION HANDLERS ---
  const handleUpdateTargetRtp = async () => {
    if (targetRtpInput < 50 || targetRtpInput > 99) {
      showToast('Target RTP must be between 50% and 99%');
      return;
    }
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.setTargetRTP(targetRtpInput);
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
      }
    } catch {
      showToast('Failed to update platform target RTP');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFraudAction = async (userId: string, action: 'quarantine' | 'unfreeze', reason: string) => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.applyFraudAction(userId, action, reason);
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
      }
    } catch {
      showToast('Failed to execute fraud radar action');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditCsv = () => {
    soundEffects.click();
    if (!auditLogs.length) {
      showToast('No audit logs to export');
      return;
    }
    const headers = 'ID,Timestamp,Operator,Role,Action,Details,IP\n';
    const rows = auditLogs.map((l) =>
      `"${l.id}","${new Date(l.timestamp).toISOString()}","${l.operatorName}","${l.operatorRole}","${l.action}","${(l.details || '').replace(/"/g, '""')}","${l.ipAddress || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SKG8_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit Trail CSV Downloaded!');
  };

  const handleExportSettlementCsv = () => {
    soundEffects.click();
    if (!settlementData) {
      showToast('No settlement data to export');
      return;
    }
    const lines = [
      'SKG8 ENTERTAINMENT DAILY FINANCIAL SETTLEMENT REPORT',
      `Date,${settlementData.date}`,
      `Total Bets Turnover (INR),${settlementData.totalTurnover}`,
      `Total Wins Paid (INR),${settlementData.totalWinsPaid}`,
      `Gross Gaming Revenue - GGR (INR),${settlementData.grossGamingRevenue}`,
      `Actual Platform RTP (%),${settlementData.rtpPercentage}%`,
      `Total Deposits Credited (INR),${settlementData.totalDeposits}`,
      `Total Withdrawals Cleared (INR),${settlementData.totalWithdrawals}`,
      `Player Balances Liability (INR),${settlementData.playerBalancesLiability}`,
      `Estimated House Net Margin (INR),${settlementData.netMargin}`,
      `Reconciliation Status,${settlementData.reconciliationStatus}`,
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SKG8_Settlement_Report_${settlementData.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Settlement Report CSV Downloaded!');
  };

  // --- AVIATOR CONTROLS ---
  const handleForceCrashNow = async () => {
    setLoading(true);
    soundEffects.error();
    try {
      const res = await api.forceAviatorCrashNow();
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
      } else {
        showToast(res?.message || 'Could not trigger crash');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to force crash');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAviatorTarget = async (target?: number) => {
    const mult = target !== undefined ? target : parseFloat(aviatorTarget);
    if (!mult || mult < 1.01) {
      showToast('Please enter a valid multiplier ≥ 1.01x');
      return;
    }
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.setAviatorTarget(mult, 'manual');
      if (res && res.success) {
        setAviatorMode('manual');
        showToast(`Next Aviator Flight Locked at ${mult.toFixed(2)}X!`);
        fetchAllData();
      }
    } catch {
      showToast('Failed to set multiplier');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAviatorMode = async (mode: string) => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.setAviatorMode(mode);
      if (res && res.success) {
        setAviatorMode(mode);
        showToast(`Aviator mode switched to ${mode.toUpperCase()}`);
        fetchAllData();
      }
    } catch {
      showToast('Failed to set mode');
    } finally {
      setLoading(false);
    }
  };

  // --- WINGO CONTROLS ---
  const handleApplyWinGoRig = async () => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.setWinGoNextDraw({
        gameType: selectedWinGoType,
        number: forcedNumber !== null ? forcedNumber : undefined,
        color: forcedColor || undefined,
        size: forcedSize || undefined,
      });
      if (res && res.success) {
        showToast(`Outcome Locked for Win Go [${selectedWinGoType.toUpperCase()}]!`);
        fetchAllData();
      }
    } catch {
      showToast('Failed to lock Win Go draw');
    } finally {
      setLoading(false);
    }
  };

  const handleSetWinGoMode = async (mode: 'auto' | 'smart_house_profit' | 'manual') => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.setWinGoMode(selectedWinGoType, mode);
      if (res && res.success) {
        setWinGoMode(mode);
        showToast(`Win Go [${selectedWinGoType.toUpperCase()}] mode: ${mode.toUpperCase()}`);
        fetchAllData();
      }
    } catch {
      showToast('Failed to set Win Go mode');
    } finally {
      setLoading(false);
    }
  };

  const handleForceWinGoDrawNow = async () => {
    setLoading(true);
    soundEffects.error();
    try {
      const res = await api.forceWinGoDrawNow(selectedWinGoType);
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
        onRefreshUserData();
      }
    } catch {
      showToast('Failed to force draw');
    } finally {
      setLoading(false);
    }
  };

  // --- USER ACTIONS ---
  const handleUserBalanceAction = async (userId: string, action: 'credit' | 'debit' | 'set_balance') => {
    const num = parseFloat(adjustAmount);
    if (!num && num !== 0) return;
    setLoading(true);
    try {
      const res = await api.adminUserAction(userId, action, { amount: num, reason: 'Operator Vault Adjustment' });
      if (res && res.success) {
        showToast(`Updated balance for ${res.user.name}`);
        fetchAllData();
        onRefreshUserData();
      }
    } catch {
      showToast('Failed to update balance');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: string, currentBan: boolean) => {
    setLoading(true);
    try {
      const res = await api.adminUserAction(userId, 'toggle_ban', { isBanned: !currentBan });
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
      }
    } catch {
      showToast('Failed to toggle ban');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToUserPerspective = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.switchUser(userId);
      if (res && res.success) {
        showToast(`Switched active session to ${res.user.name}`);
        onRefreshUserData();
        fetchAllData();
      }
    } catch {
      showToast('Failed to switch user');
    } finally {
      setLoading(false);
    }
  };

  // --- DEPOSIT APPROVALS ---
  const handleDepositAction = async (depId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.adminDepositAction(depId, action);
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
        onRefreshUserData();
      }
    } catch {
      showToast('Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  // --- WITHDRAWAL APPROVALS ---
  const handleWithdrawalAction = async (wdrId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.adminWithdrawalAction(wdrId, action);
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
        onRefreshUserData();
      }
    } catch {
      showToast('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // --- BROADCAST ---
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setLoading(true);
    try {
      const res = await api.adminBroadcast(broadcastText.trim());
      if (res && res.success) {
        showToast('Marquee broadcast published to all player screens!');
        setBroadcastText('');
        fetchAllData();
      }
    } catch {
      showToast('Failed to broadcast');
    } finally {
      setLoading(false);
    }
  };

  // --- KYC APPROVALS ---
  const handleKycReview = async (kycId: string, userId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    soundEffects.click();
    try {
      const res = await api.reviewAdminKYC(kycId, userId, action);
      if (res && res.success) {
        showToast(res.message);
        fetchAllData();
        onRefreshUserData();
      }
    } catch {
      showToast('Failed to review KYC');
    } finally {
      setLoading(false);
    }
  };

  // --- SIMULATE INSTANT WEBHOOK ---
  const handleSimulateWebhook = async (amount: number = 1000) => {
    setSimulatingWebhook(true);
    soundEffects.coins();
    try {
      const res = await api.triggerPaymentWebhook({
        order_id: 'CF_ORD_' + Date.now().toString().slice(-6),
        payment_id: 'pay_' + Date.now().toString().slice(-8),
        order_amount: amount,
        customer_details: { customer_phone: '+91 9876543210' },
      });
      if (res && res.status === 'SUCCESS') {
        showToast(`Instant Webhook Success: Credited ₹${res.creditedAmount}!`);
        fetchAllData();
        onRefreshUserData();
      } else {
        showToast('Webhook processed');
      }
    } catch {
      showToast('Webhook error');
    } finally {
      setSimulatingWebhook(false);
    }
  };

  if (!isOpen) return null;

  const pendingDepsCount = depositsList.filter((d) => d.status === 'pending').length;
  const pendingWdrsCount = withdrawalsList.filter((w) => w.status === 'pending').length;
  const pendingKycCount = kycQueue.filter((k) => k.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111113] border-2 border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] my-4 text-white flex flex-col max-h-[92vh]">
        
        {/* Master Controller Top Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-[#2A1D0B] via-[#1A1813] to-[#111113] border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F2D06B] via-[#D4AF37] to-[#8C6010] flex items-center justify-center text-black font-black text-xl shadow-lg border border-yellow-200">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#F2D06B] tracking-wide flex items-center gap-1.5">
                  MASTER CONTROLLER ROOM
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-red-500" /> LIVE ENGINE RIG
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Logged in as: <span className="text-amber-300 font-bold">Arpita Singh (arpitasinghmcoin@gmail.com)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 flex items-center gap-1.5 border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
            <button
              onClick={() => { soundEffects.click(); onClose(); }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast Message */}
        {statusMessage && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border-b border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-2 animate-fadeIn shrink-0">
            <Sparkles className="w-4 h-4 text-[#F2D06B]" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center p-2 bg-[#0A0A0C] border-b border-white/5 gap-1 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => { soundEffects.click(); setActiveTab('aviator'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'aviator' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>✈️ Aviator</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('wingo'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'wingo' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎨 Win Go / TRX</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('risk'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'risk' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>⚖️ Risk & Liability</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('fraud'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap relative transition-all ${
              activeTab === 'fraud' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>🚨 Fraud Radar</span>
            {fraudData?.criticalAlertsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center -top-1 -right-1">
                {fraudData.criticalAlertsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('audit'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'audit' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>📜 Audit Trail</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('settlement'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'settlement' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>📑 Daily Settlement</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('deposits'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap relative transition-all ${
              activeTab === 'deposits' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>💰 Deposits</span>
            {pendingDepsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center -top-1 -right-1">
                {pendingDepsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('withdrawals'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap relative transition-all ${
              activeTab === 'withdrawals' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>💸 Payouts</span>
            {pendingWdrsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center -top-1 -right-1">
                {pendingWdrsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('users'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'users' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👥 Players ({usersList.length})</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('games'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'games' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🎲 Other Games</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('broadcast'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'broadcast' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>📢 Broadcast</span>
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('kyc'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap relative transition-all ${
              activeTab === 'kyc' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🪪 KYC Audit</span>
            {pendingKycCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center -top-1 -right-1">
                {pendingKycCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { soundEffects.click(); setActiveTab('finance'); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'finance' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>📊 Finance & Gateway</span>
          </button>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* TAB 1: AVIATOR RIGGING ROOM */}
          {activeTab === 'aviator' && (
            <div className="space-y-6">
              {/* Aviator Live Monitor Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#1A1114] to-black border border-red-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Live Flight Telemetry</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-rose-400 font-mono">
                      {overview?.aviator?.currentMultiplier ? `${overview.aviator.currentMultiplier}X` : '1.00X'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      overview?.aviator?.phase === 'flying' 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : overview?.aviator?.phase === 'crashed'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {overview?.aviator?.phase || 'waiting'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 block mt-1">
                    Round #{overview?.aviator?.roundId} • House Crash Target: <strong className="text-yellow-300 font-mono">{overview?.aviator?.crashTarget}X</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="admin-aviator-crash-now-btn"
                    onClick={handleForceCrashNow}
                    disabled={loading || overview?.aviator?.phase !== 'flying'}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 disabled:opacity-40"
                  >
                    <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
                    <span>⚡ FORCE FLEW OFF NOW!</span>
                  </button>
                </div>
              </div>

              {/* Set Next Crash Multiplier */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#F2D06B]" /> Set Next Target Multiplier
                    </h3>
                    <p className="text-xs text-gray-400">Force the plane to crash at an exact multiplier value</p>
                  </div>
                  <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Mode: {aviatorMode.toUpperCase()}
                  </span>
                </div>

                {/* Fast Presets */}
                <div>
                  <span className="text-[11px] text-gray-400 block mb-2 font-medium">Quick Multiplier Presets:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[
                      { label: '1.05X (Kill)', val: 1.05, color: 'border-rose-500/50 text-rose-400' },
                      { label: '1.20X', val: 1.20, color: 'border-amber-500/50 text-amber-400' },
                      { label: '1.50X', val: 1.50, color: 'border-yellow-500/50 text-yellow-400' },
                      { label: '2.00X', val: 2.00, color: 'border-emerald-500/50 text-emerald-400' },
                      { label: '3.50X', val: 3.50, color: 'border-teal-500/50 text-teal-400' },
                      { label: '5.00X', val: 5.00, color: 'border-cyan-500/50 text-cyan-400' },
                      { label: '10.00X', val: 10.00, color: 'border-indigo-500/50 text-indigo-400' },
                      { label: '50.00X 🚀', val: 50.00, color: 'border-purple-500/50 text-purple-400 font-black' },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => handleSetAviatorTarget(preset.val)}
                        disabled={loading}
                        className={`p-2.5 rounded-xl bg-black/40 border hover:bg-white/10 text-xs font-mono font-bold text-center transition-all ${preset.color}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">X</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      placeholder="e.g. 2.75"
                      value={aviatorTarget}
                      onChange={(e) => setAviatorTarget(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <button
                    onClick={() => handleSetAviatorTarget()}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs uppercase tracking-wide hover:brightness-110"
                  >
                    Lock Multiplier
                  </button>
                </div>
              </div>

              {/* Operating House Modes */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#F2D06B]" /> House Algorithm Strategies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'auto', name: 'Fair RNG (Standard)', desc: 'Standard mathematical distribution' },
                    { id: 'house_kill', name: '⚡ House Profit Kill', desc: 'Forces fast crash (1.01x - 1.25x)' },
                    { id: 'jackpot', name: '🎉 Mega Jackpot Mode', desc: 'Allows super flight (10x - 88x)' },
                    { id: 'manual', name: '🎯 Manual Overrides', desc: 'Waits for operator specified target' },
                  ].map((m) => {
                    const isSelected = aviatorMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSetAviatorMode(m.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-[#2A2312] border-[#D4AF37] text-white shadow-md' 
                            : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/15'
                        }`}
                      >
                        <span className="text-xs font-bold block text-white">{m.name}</span>
                        <span className="text-[10px] text-gray-400">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WIN GO & TRX RIGGING */}
          {activeTab === 'wingo' && (
            <div className="space-y-6">
              {/* Game Type Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['1min', '3min', '5min', '10min', 'trx1min'].map((gt) => (
                  <button
                    key={gt}
                    onClick={() => { soundEffects.click(); setSelectedWinGoType(gt); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                      selectedWinGoType === gt
                        ? 'bg-[#D4AF37] text-black font-black shadow-md'
                        : 'bg-[#181818] text-gray-400 hover:text-white'
                    }`}
                  >
                    Win Go {gt}
                  </button>
                ))}
              </div>

              {/* Live Round Header */}
              {(() => {
                const cur = overview?.wingo?.find((w: any) => w.gameType === selectedWinGoType);
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#16121D] to-black border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Period Draw Telemetry</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-purple-300 font-mono">
                          #{cur?.periodId || '20260906001'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          ⏱ {cur?.secondsLeft || 60}s Left
                        </span>
                      </div>
                    </div>

                    <button
                      id="admin-force-wingo-draw-btn"
                      onClick={handleForceWinGoDrawNow}
                      disabled={loading}
                      className="py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span>⚡ Force Instant Draw Now!</span>
                    </button>
                  </div>
                );
              })()}

              {/* Force Outcome Controller */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#F2D06B]" /> Lock Exact Draw Outcome for Next Period
                </h3>

                {/* Numbers 0-9 */}
                <div>
                  <span className="text-xs font-semibold text-gray-300 block mb-2">1. Force Number Outcome (0 to 9):</span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const isSel = forcedNumber === num;
                      const isGreen = [1, 3, 7, 9].includes(num);
                      const isRed = [2, 4, 6, 8].includes(num);
                      const isViolet = num === 0 || num === 5;
                      return (
                        <button
                          key={num}
                          onClick={() => {
                            soundEffects.click();
                            setForcedNumber(isSel ? null : num);
                          }}
                          className={`h-12 rounded-xl border font-black text-base flex flex-col items-center justify-center transition-all ${
                            isSel
                              ? 'bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-400 shadow-lg scale-105'
                              : 'bg-black/40 border-white/10 text-white hover:border-white/30'
                          }`}
                        >
                          <span>{num}</span>
                          <span className={`text-[8px] font-bold ${
                            isViolet ? 'text-purple-400' : isGreen ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isViolet ? 'VIOLET' : isGreen ? 'GREEN' : 'RED'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <span className="text-xs font-semibold text-gray-300 block mb-2">2. Force Color Outcome:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'green', label: 'GREEN (1, 3, 7, 9)', bg: 'bg-emerald-600', border: 'border-emerald-400' },
                      { id: 'red', label: 'RED (2, 4, 6, 8)', bg: 'bg-rose-600', border: 'border-rose-400' },
                      { id: 'violet', label: 'VIOLET (0, 5)', bg: 'bg-purple-600', border: 'border-purple-400' },
                    ].map((col) => {
                      const isSel = forcedColor === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => {
                            soundEffects.click();
                            setForcedColor(isSel ? null : (col.id as any));
                          }}
                          className={`py-3 rounded-xl font-bold text-xs border text-white transition-all ${col.bg} ${
                            isSel ? 'ring-4 ring-yellow-400 shadow-xl' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <span className="text-xs font-semibold text-gray-300 block mb-2">3. Force Big / Small:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Big', label: 'BIG (5, 6, 7, 8, 9)' },
                      { id: 'Small', label: 'SMALL (0, 1, 2, 3, 4)' },
                    ].map((sz) => {
                      const isSel = forcedSize === sz.id;
                      return (
                        <button
                          key={sz.id}
                          onClick={() => {
                            soundEffects.click();
                            setForcedSize(isSel ? null : (sz.id as any));
                          }}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            isSel
                              ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                              : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          {sz.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleApplyWinGoRig}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110"
                  >
                    Lock Outcome on Live Server
                  </button>
                  <button
                    onClick={() => {
                      setForcedNumber(null);
                      setForcedColor(null);
                      setForcedSize(null);
                    }}
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Smart House Profit AI Mode */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F2D06B]" /> Smart AI Profit Maximizer
                    </h3>
                    <p className="text-xs text-gray-400">Automatically inspects all placed player bets and picks the outcome with lowest payout</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSetWinGoMode('smart_house_profit')}
                    className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110"
                  >
                    <CheckCircle className="w-4 h-4" /> Enable Smart House Profit Mode
                  </button>
                  <button
                    onClick={() => handleSetWinGoMode('auto')}
                    className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                  >
                    Reset to Normal Fair RNG
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPOSIT APPROVAL QUEUE */}
          {activeTab === 'deposits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-emerald-400" /> Pending Real Money Deposit Requests
                  </h3>
                  <p className="text-xs text-gray-400">Review submitted UPI UTR numbers and approve vault credits</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {pendingDepsCount} Pending Review
                </span>
              </div>

              {depositsList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs bg-[#17171A] rounded-2xl border border-white/5">
                  No deposit requests currently pending.
                </div>
              ) : (
                <div className="space-y-3">
                  {depositsList.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-4 rounded-2xl bg-[#17171A] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{dep.userName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({dep.userId})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                            {dep.channel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 flex items-center gap-3">
                          <span>Phone: <strong className="text-white">{dep.userPhone}</strong></span>
                          <span>UTR: <strong className="font-mono text-yellow-300">{dep.utrNumber}</strong></span>
                        </div>
                        <span className="text-[10px] text-gray-500 block">
                          Submitted: {new Date(dep.timestamp).toLocaleTimeString()} • Order ID: {dep.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-400 block">
                            ₹{dep.amount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-300 font-semibold">
                            +₹{Math.floor(dep.amount * 0.05)} (5% Bonus)
                          </span>
                        </div>

                        {dep.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleDepositAction(dep.id, 'approve')}
                              disabled={loading}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Credit
                            </button>
                            <button
                              onClick={() => handleDepositAction(dep.id, 'reject')}
                              disabled={loading}
                              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs border border-rose-500/30"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                            dep.status === 'approved' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {dep.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WITHDRAWAL PAYOUT QUEUE */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-amber-400" /> Pending Withdrawal Payout Queue
                  </h3>
                  <p className="text-xs text-gray-400">Review payout details, transfer to player account, and mark completed</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                  {pendingWdrsCount} Pending Payout
                </span>
              </div>

              {withdrawalsList.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs bg-[#17171A] rounded-2xl border border-white/5">
                  No withdrawal requests currently pending.
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawalsList.map((wdr) => (
                    <div
                      key={wdr.id}
                      className="p-4 rounded-2xl bg-[#17171A] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{wdr.userName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({wdr.userId})</span>
                        </div>
                        <div className="text-xs text-gray-300 space-y-0.5">
                          {wdr.bankDetails?.upiId && (
                            <div>UPI ID: <strong className="font-mono text-yellow-300">{wdr.bankDetails.upiId}</strong></div>
                          )}
                          {wdr.bankDetails?.accountNumber && (
                            <div>
                              Bank: <strong className="text-white">{wdr.bankDetails.bankName || 'Bank'}</strong> (A/C: {wdr.bankDetails.accountNumber}, IFSC: {wdr.bankDetails.ifscCode})
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 block">
                          Requested: {new Date(wdr.timestamp).toLocaleTimeString()} • ID: {wdr.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-black text-amber-400 block">
                            ₹{wdr.amount.toFixed(2)}
                          </span>
                        </div>

                        {wdr.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleWithdrawalAction(wdr.id, 'approve')}
                              disabled={loading}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-black font-bold text-xs flex items-center gap-1 shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Issue IMPS
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(wdr.id, 'reject')}
                              disabled={loading}
                              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs border border-rose-500/30"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                            wdr.status === 'approved' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {wdr.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MULTI-USER ROSTER & SURVEILLANCE */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#F2D06B]" /> Registered Multi-User Database
                  </h3>
                  <p className="text-xs text-gray-400">Live roster of connected players, balances, and operator overrides</p>
                </div>
              </div>

              <div className="space-y-2">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-[#17171A] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{u.name}</span>
                          {u.isController ? (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                              👑 Controller
                            </span>
                          ) : (
                            <span className="text-[9px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                              Player
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                              Suspended
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          UID: {u.id} • {u.phone} {u.email ? `• ${u.email}` : ''}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          Bets: {u.totalBets} • Wins: {u.totalWins} (₹{u.totalWonAmount.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-base font-black text-[#F2D06B] block">
                          ₹{u.balance.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">VIP {u.vipLevel}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSwitchToUserPerspective(u.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-[10px] font-bold border border-blue-500/30"
                          title="Switch perspective into this account"
                        >
                          Switch To
                        </button>
                        <button
                          onClick={() => handleUserBalanceAction(u.id, 'credit')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold border border-emerald-500/30"
                        >
                          +₹1,000
                        </button>
                        <button
                          onClick={() => handleToggleBan(u.id, u.isBanned)}
                          className={`p-1.5 rounded-lg text-[10px] font-bold border ${
                            u.isBanned 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {u.isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: OTHER GAMES RIGGING */}
          {activeTab === 'games' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dragon vs Tiger */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🐉 Dragon vs Tiger Outcome Rig
                </h3>
                <p className="text-xs text-gray-400">Force next deal winning hand</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {['auto', 'dragon', 'tiger', 'tie'].map((w) => (
                    <button
                      key={w}
                      onClick={async () => {
                        soundEffects.click();
                        setDtWinner(w as any);
                        await api.setDragonTigerWinner(w as any);
                        showToast(`Dragon vs Tiger next winner: ${w.toUpperCase()}`);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        dtWinner === w
                          ? 'bg-[#D4AF37] text-black font-black'
                          : 'bg-black/40 text-gray-300 hover:border-white/20 border border-white/5'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mines Pro Rig */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  💣 Mines Pro Tile Rig
                </h3>
                <p className="text-xs text-gray-400">Control tile reveal outcome</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'auto', label: 'Auto RNG' },
                    { id: 'safe', label: '100% Safe (Win)' },
                    { id: 'explode', label: '💥 Explode (Kill)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={async () => {
                        soundEffects.click();
                        setMinesRig(m.id as any);
                        await api.setMinesRig(m.id as any);
                        showToast(`Mines Rig set to: ${m.label}`);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        minesRig === m.id
                          ? 'bg-[#D4AF37] text-black font-black'
                          : 'bg-black/40 text-gray-300 hover:border-white/20 border border-white/5'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* European Roulette */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🎡 European Roulette Exact Ball Drop
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="36"
                    placeholder="0-36"
                    value={rouletteNum}
                    onChange={(e) => setRouletteNum(e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                  <button
                    onClick={async () => {
                      const num = parseInt(rouletteNum, 10);
                      if (num >= 0 && num <= 36) {
                        await api.setRouletteNumber(num);
                        showToast(`Roulette next ball locked on #${num}`);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs"
                  >
                    Lock Ball Drop Number
                  </button>
                </div>
              </div>

              {/* Limbo Rocket */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🚀 Limbo Rocket Multiplier Target
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    placeholder="e.g. 5.0"
                    value={limboMult}
                    onChange={(e) => setLimboMult(e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                  <button
                    onClick={async () => {
                      const m = parseFloat(limboMult);
                      if (m >= 1.0) {
                        await api.setLimboMultiplier(m);
                        showToast(`Limbo next roll target locked to ${m}X`);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs"
                  >
                    Lock Limbo Multiplier
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BROADCAST & LIVE SURVEILLANCE */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              {/* Marquee Broadcast Sender */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#F2D06B]" /> Push Live Marquee Ticker Announcement
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 🎉 Grand Festival: 10% Extra on all UPI Deposits! Next Aviator Jackpot incoming..."
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    onClick={handleSendBroadcast}
                    disabled={loading || !broadcastText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs shadow-md disabled:opacity-40"
                  >
                    Broadcast Now
                  </button>
                </div>
              </div>

              {/* Live Bets Feed */}
              <div className="p-5 rounded-2xl bg-[#17171A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" /> Active Player Bets Surveillance
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Feed
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {liveBetsList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      No active bets running currently. Bets placed by any connected user will appear here in real-time.
                    </div>
                  ) : (
                    liveBetsList.map((bet) => (
                      <div
                        key={bet.id}
                        className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={bet.avatar}
                            alt={bet.userName}
                            className="w-7 h-7 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <span className="font-bold text-white">{bet.userName}</span>
                            <span className="text-[10px] text-gray-400 block">{bet.game} • {bet.target}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-white block">₹{bet.amount.toFixed(2)}</span>
                          <span className={`text-[9px] font-bold uppercase ${
                            bet.status === 'won' ? 'text-emerald-400' : bet.status === 'lost' ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {bet.status === 'won' ? `Won ₹${bet.winAmount?.toFixed(2)}` : bet.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: KYC AUDIT QUEUE */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Identity Verification Queue (KYC)
                  </h3>
                  <p className="text-xs text-gray-400">Review PAN cards, national IDs & compliance approvals</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  {kycQueue.length} Total Records
                </span>
              </div>

              {kycQueue.length === 0 ? (
                <div className="p-8 text-center bg-black/30 rounded-2xl border border-white/5 text-gray-400 text-xs">
                  No KYC verification requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {kycQueue.map((k) => (
                    <div
                      key={k.id}
                      className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-white text-sm block">{k.fullName}</span>
                          <span className="text-xs text-gray-400 font-mono">{k.phone} • {k.userId}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          k.status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : k.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {k.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white/5 p-2.5 rounded-xl font-mono">
                        <div>
                          <span className="text-gray-400 text-[10px] block">Document Type</span>
                          <span className="text-white uppercase font-bold">{k.documentType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">Document Number</span>
                          <span className="text-amber-300 font-bold">{k.documentNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">Submitted Time</span>
                          <span className="text-gray-300">{new Date(k.submittedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {k.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleKycReview(k.id, k.userId, 'approve')}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                          >
                            ✓ Approve Identity
                          </button>
                          <button
                            onClick={() => handleKycReview(k.id, k.userId, 'reject')}
                            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
                          >
                            ✕ Reject (Mismatch)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: FINANCIAL AUDIT & WEBHOOK SIMULATOR */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" /> Financial Ledger & GGR Audit
                </h3>
                <p className="text-xs text-gray-400">Real-time Gross Gaming Revenue, cashflow & payment gateway health</p>
              </div>

              {financialMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-black/40 border border-white/10 rounded-2xl">
                    <span className="text-[10px] text-gray-400 block mb-1">Total Deposits</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      ₹{financialMetrics.totalDepositedVolume?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/10 rounded-2xl">
                    <span className="text-[10px] text-gray-400 block mb-1">Total Payouts</span>
                    <span className="text-lg font-mono font-bold text-amber-400">
                      ₹{financialMetrics.totalWithdrawnVolume?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/10 rounded-2xl">
                    <span className="text-[10px] text-gray-400 block mb-1">Net Cashflow</span>
                    <span className="text-lg font-mono font-bold text-white">
                      ₹{financialMetrics.netCashflow?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/10 rounded-2xl">
                    <span className="text-[10px] text-gray-400 block mb-1">Platform RTP (House Margin)</span>
                    <span className="text-lg font-mono font-bold text-[#D4AF37]">
                      {financialMetrics.platformRTP}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Gateway Webhook Testing Console */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Production Payment Gateway Webhook Dispatcher</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                    Active: Cashfree / Razorpay Intent v3
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simulate automated incoming webhooks from banking aggregators. This tests end-to-end cryptographic callback validation and auto-credits the player wallet without manual approval.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleSimulateWebhook(amt)}
                      disabled={simulatingWebhook}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      {simulatingWebhook ? 'Dispatching...' : `Simulate ₹${amt} Instant UPI Webhook (+5% bonus)`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: DYNAMIC RISK MANAGEMENT & LIABILITY ENGINE */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" /> Dynamic Risk Management & House Liability
                  </h3>
                  <p className="text-xs text-gray-400">
                    Real-time mathematical exposure monitoring, vault safety triggers, and automated RTP governance
                  </p>
                </div>

                {/* Target RTP Setting Control */}
                <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-2 rounded-xl">
                  <span className="text-[11px] text-slate-300 font-bold">Target Platform RTP:</span>
                  <input
                    type="number"
                    min="50"
                    max="99"
                    value={targetRtpInput}
                    onChange={(e) => setTargetRtpInput(parseInt(e.target.value) || 95)}
                    className="w-16 bg-slate-900 border border-white/20 rounded-lg px-2 py-1 text-xs font-mono text-center text-[#D4AF37] font-bold"
                  />
                  <span className="text-xs text-[#D4AF37] font-bold">%</span>
                  <button
                    onClick={handleUpdateTargetRtp}
                    disabled={loading}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shadow transition-all"
                  >
                    Lock RTP
                  </button>
                </div>
              </div>

              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1">
                    Win Go Active Pool & Safety
                  </span>
                  <div className="text-xl font-mono font-black text-white">
                    ₹{riskData?.wingoLiability?.totalPool?.toLocaleString() || '0'}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Recommended Vault Safe Number: {riskData?.wingoLiability?.recommendedSafeNumber ?? '0'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl">
                  <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block mb-1">
                    Aviator Live Active Exposure
                  </span>
                  <div className="text-xl font-mono font-black text-white">
                    ₹{riskData?.aviatorLiability?.totalActiveBetVolume?.toLocaleString() || '0'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Liability at 2x: <span className="text-amber-400 font-mono">₹{riskData?.aviatorLiability?.exposureAt2x?.toLocaleString() || '0'}</span> | 
                    at 5x: <span className="text-rose-400 font-mono">₹{riskData?.aviatorLiability?.exposureAt5x?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">
                    Risk Engine Status
                  </span>
                  <div className="text-xl font-mono font-black text-[#D4AF37]">
                    {riskData?.targetPlatformRTP || 95}% Target RTP
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Automated House Protection: ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Win Go Number Liability Matrix */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Win Go Simulated Number Liability Matrix (0 - 9)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Calculates exact net house profit if that number is drawn
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {riskData?.wingoLiability?.numberExposures?.map((item: any) => {
                    const isRecommended = item.number === riskData?.wingoLiability?.recommendedSafeNumber;
                    const isProfitable = item.houseNetProfit >= 0;

                    return (
                      <div
                        key={item.number}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          isRecommended
                            ? 'bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-500/10'
                            : 'bg-black/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-black text-sm text-white font-mono">
                            {item.number}
                          </span>
                          {isRecommended && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-black border border-emerald-500/40">
                              SAFE
                            </span>
                          )}
                        </div>

                        <div className="my-2 text-[10px] space-y-0.5">
                          <div className="text-slate-400 flex justify-between">
                            <span>Wagers:</span>
                            <span className="font-mono text-white">₹{item.totalWagers}</span>
                          </div>
                          <div className="text-slate-400 flex justify-between">
                            <span>Payout:</span>
                            <span className="font-mono text-amber-300">₹{item.simulatedPayout}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-1 border-t border-white/10">
                            <span className="text-slate-300">Net Profit:</span>
                            <span className={`font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfitable ? '+' : ''}₹{item.houseNetProfit}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            setForcedNumber(item.number);
                            soundEffects.click();
                            try {
                              await api.setWinGoNextDraw({
                                gameType: selectedWinGoType,
                                number: item.number,
                              });
                              showToast(`Locked Win Go Draw to Number ${item.number}!`);
                              fetchAllData();
                            } catch {
                              showToast('Failed to lock number');
                            }
                          }}
                          className="w-full py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors"
                        >
                          Lock Draw #{item.number}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: AUTOMATED FRAUD & BOT RADAR */}
          {activeTab === 'fraud' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" /> Automated Fraud & Bot Detection Radar
                  </h3>
                  <p className="text-xs text-gray-400">
                    Real-time anomaly scoring, betting velocity tracking, and automated account isolation
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search flagged player..."
                      value={fraudFilter}
                      onChange={(e) => setFraudFilter(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Fraud Radar Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-gradient-to-br from-rose-950/50 to-slate-900 border border-rose-500/40 rounded-2xl">
                  <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block mb-1">
                    Critical Risk Players
                  </span>
                  <span className="text-2xl font-mono font-black text-rose-400">
                    {fraudData?.criticalAlertsCount || 0}
                  </span>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-500/40 rounded-2xl">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">
                    Medium Risk Warnings
                  </span>
                  <span className="text-2xl font-mono font-black text-amber-400">
                    {fraudData?.mediumAlertsCount || 0}
                  </span>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Total Monitored Accounts
                  </span>
                  <span className="text-2xl font-mono font-black text-white">
                    {fraudData?.scannedUsersCount || usersList.length}
                  </span>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block mb-1">
                    Radar Status
                  </span>
                  <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Real-time Shield: ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Flagged Accounts Table */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-3 bg-black/40 border-b border-white/10 text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>FLAGGED PLAYERS RADAR QUEUE</span>
                  <span className="text-[10px] text-slate-400">Sorted by Anomaly Risk Score</span>
                </div>

                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {fraudData?.flaggedUsers?.filter((u: any) =>
                    !fraudFilter || u.name.toLowerCase().includes(fraudFilter.toLowerCase()) || u.id.includes(fraudFilter)
                  ).map((flagged: any) => {
                    const isCritical = flagged.riskLevel === 'Critical';
                    const isQuarantined = flagged.status === 'banned';

                    return (
                      <div key={flagged.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <img
                            src={flagged.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                            alt={flagged.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/20"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{flagged.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isCritical
                                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                                  : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                              }`}>
                                {flagged.riskLevel} Risk ({flagged.fraudScore}/100)
                              </span>
                              {isQuarantined && (
                                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black">
                                  FROZEN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-2">
                              <span>ID: <code className="text-slate-300">{flagged.id}</code></span>
                              <span>•</span>
                              <span className="text-amber-400 font-mono">Bal: ₹{flagged.balance?.toFixed(2)}</span>
                              <span>•</span>
                              <span>Win Rate: <strong className="text-white">{flagged.winRate}%</strong></span>
                            </div>

                            {/* Anomaly Flags */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {flagged.reasons?.map((r: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] text-rose-300 font-mono">
                                  ⚠️ {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-2">
                          {isQuarantined ? (
                            <button
                              onClick={() => handleApplyFraudAction(flagged.id, 'unfreeze', 'Operator manual unfreeze')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all"
                            >
                              Unfreeze Account
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApplyFraudAction(flagged.id, 'quarantine', flagged.reasons?.join(', ') || 'High Fraud Score')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                            >
                              🚨 Quarantine Account
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: OPERATOR SURVEILLANCE & IMMUTABLE AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Operator Surveillance & Immutable Audit Trail
                  </h3>
                  <p className="text-xs text-gray-400">
                    Comprehensive compliance log of all privileged outcome modifications and ledger edits
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search audit trail..."
                      value={auditFilter}
                      onChange={(e) => setAuditFilter(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    id="export-audit-csv-btn"
                    onClick={handleExportAuditCsv}
                    className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#F2D06B] text-black font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Audit Table */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-3 bg-black/40 border-b border-white/10 text-[11px] font-bold text-slate-400 grid grid-cols-12 gap-2">
                  <span className="col-span-2">TIMESTAMP</span>
                  <span className="col-span-2">OPERATOR</span>
                  <span className="col-span-3">ACTION</span>
                  <span className="col-span-4">DETAILS</span>
                  <span className="col-span-1 text-right">IP</span>
                </div>

                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto text-xs">
                  {auditLogs.filter((l) =>
                    !auditFilter || l.action.toLowerCase().includes(auditFilter.toLowerCase()) || l.details?.toLowerCase().includes(auditFilter.toLowerCase())
                  ).map((l) => (
                    <div key={l.id} className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-white/5 transition-colors">
                      <span className="col-span-2 text-slate-400 font-mono text-[10px]">
                        {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div className="col-span-2 truncate">
                        <span className="font-bold text-white block truncate">{l.operatorName}</span>
                        <span className="text-[9px] text-amber-400 uppercase font-mono">{l.operatorRole}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                          {l.action}
                        </span>
                      </div>
                      <div className="col-span-4 text-slate-300 text-[11px] truncate">
                        {l.details}
                      </div>
                      <div className="col-span-1 text-right text-slate-500 font-mono text-[10px]">
                        {l.ipAddress || '127.0.0.1'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: DAILY SETTLEMENT & RECONCILIATION */}
          {activeTab === 'settlement' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Daily Financial Settlement & Reconciliation
                  </h3>
                  <p className="text-xs text-gray-400">
                    Automated daily reconciliation: Turnover, Gross Gaming Revenue (GGR), and Player Wallet Liabilities
                  </p>
                </div>

                <button
                  id="export-settlement-csv-btn"
                  onClick={handleExportSettlementCsv}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Settlement CSV</span>
                </button>
              </div>

              {settlementData && (
                <div className="space-y-4">
                  {/* Key Financial KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl">
                      <span className="text-[10px] text-gray-400 block mb-1">Total Bet Turnover</span>
                      <span className="text-xl font-mono font-black text-white">
                        ₹{settlementData.totalTurnover?.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl">
                      <span className="text-[10px] text-gray-400 block mb-1">Total Wins Disbursed</span>
                      <span className="text-xl font-mono font-black text-amber-400">
                        ₹{settlementData.totalWinsPaid?.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl">
                      <span className="text-[10px] text-gray-400 block mb-1">Gross Gaming Revenue (GGR)</span>
                      <span className="text-xl font-mono font-black text-emerald-400">
                        ₹{settlementData.grossGamingRevenue?.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl">
                      <span className="text-[10px] text-gray-400 block mb-1">Realized Platform RTP</span>
                      <span className="text-xl font-mono font-black text-[#D4AF37]">
                        {settlementData.rtpPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Comprehensive Reconciliation Table */}
                  <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white">SETTLEMENT LEDGER RECONCILIATION</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                        STATUS: {settlementData.reconciliationStatus}
                      </span>
                    </div>

                    <div className="divide-y divide-white/5 text-xs">
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Total Player Deposits Credited</span>
                        <span className="font-mono text-emerald-400 font-bold">₹{settlementData.totalDeposits?.toLocaleString()}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Total Player Withdrawals Cleared</span>
                        <span className="font-mono text-rose-400 font-bold">₹{settlementData.totalWithdrawals?.toLocaleString()}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Active Player Balances Liability</span>
                        <span className="font-mono text-amber-300 font-bold">₹{settlementData.playerBalancesLiability?.toLocaleString()}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Estimated Net Operator Margin</span>
                        <span className="font-mono text-white font-black text-sm">₹{settlementData.netMargin?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
