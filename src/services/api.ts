// Client-side API Service for SKG8 Win Full-Stack Server Bridge

// Check URL search parameters first for isolated player session (e.g. ?player=UID1082914 or ?user=...)
const getInitialUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') || params.get('portal');
    if (roleParam === 'operator' || roleParam === 'admin') {
      sessionStorage.setItem('bdg_user_id', 'UID_CONTROLLER');
      sessionStorage.setItem('bdg_user_token', 'token_controller_master');
      return 'UID_CONTROLLER';
    }
    if (roleParam === 'player') {
      const playerId = params.get('player') || 'UID1082914';
      sessionStorage.setItem('bdg_user_id', playerId);
      sessionStorage.setItem('bdg_user_token', 'token_' + playerId);
      return playerId;
    }
    const paramPlayer = params.get('player') || params.get('user');
    if (paramPlayer) {
      sessionStorage.setItem('bdg_user_id', paramPlayer);
      sessionStorage.setItem('bdg_user_token', 'token_' + paramPlayer);
      return paramPlayer;
    }
    const sessionPlayer = sessionStorage.getItem('bdg_user_id');
    if (sessionPlayer) return sessionPlayer;
    return localStorage.getItem('bdg_user_id');
  }
  return null;
};

let storedToken: string | null = typeof window !== 'undefined' ? (sessionStorage.getItem('bdg_user_token') || localStorage.getItem('bdg_user_token')) : null;
let storedUserId: string | null = getInitialUserId();

export const setAuthSession = (token?: string, userId?: string) => {
  if (token) {
    storedToken = token;
    localStorage.setItem('bdg_user_token', token);
    sessionStorage.setItem('bdg_user_token', token);
  }
  if (userId) {
    storedUserId = userId;
    localStorage.setItem('bdg_user_id', userId);
    sessionStorage.setItem('bdg_user_id', userId);
  }
};

export const clearAuthSession = () => {
  storedToken = null;
  storedUserId = null;
  localStorage.removeItem('bdg_user_token');
  localStorage.removeItem('bdg_user_id');
  sessionStorage.removeItem('bdg_user_token');
  sessionStorage.removeItem('bdg_user_id');
};

export const getAuthHeaders = (customUserId?: string, customToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const tokenToUse = customToken || (customUserId ? 'token_' + customUserId : storedToken);
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }
  const effectiveUserId = customUserId || storedUserId;
  if (effectiveUserId) {
    headers['x-user-id'] = effectiveUserId;
  }
  return headers;
};

export const api = {
  // --- User & Multi-User Authentication ---
  getUserProfile: async (customUserId?: string) => {
    try {
      const res = await fetch('/api/user/profile', { headers: getAuthHeaders(customUserId) });
      return await res.json();
    } catch (e) {
      console.warn('API fetch failed, fallback to local', e);
      return null;
    }
  },

  registerUser: async (phone: string, invitationCode?: string, password?: string, name?: string, email?: string) => {
    const res = await fetch('/api/user/register', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, invitationCode, password, name, email }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthSession(data.token, data.user?.id);
    }
    return data;
  },

  loginUser: async (identifier: string, password?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthSession(data.token, data.user?.id);
    }
    return data;
  },

  loginPlayer: async (identifier: string, password?: string) => {
    const res = await fetch('/api/auth/player-login', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthSession(data.token, data.user?.id);
    }
    return data;
  },

  loginController: async (identifier: string, passkey: string, authCode?: string) => {
    const res = await fetch('/api/auth/controller-login', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifier, passkey, authCode }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthSession(data.token, data.user?.id);
    }
    return data;
  },

  switchUser: async (userId: string) => {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthSession(data.token, data.user?.id);
    }
    return data;
  },

  claimController: async () => {
    const res = await fetch('/api/auth/claim-controller', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAuthSession(data.token, data.user?.id);
    }
    return data;
  },

  getActivePlayers: async () => {
    const res = await fetch('/api/auth/active-players', { headers: getAuthHeaders() });
    return await res.json();
  },

  updateUserProfile: async (updates: any) => {
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return await res.json();
  },

  // --- Cashfree Payment Gateway Integration ---
  getCashfreeConfig: async () => {
    try {
      const res = await fetch('/api/cashfree/config', { headers: getAuthHeaders() });
      return await res.json();
    } catch {
      return { success: false, isConfigured: false, environment: 'sandbox' };
    }
  },

  createCashfreeOrder: async (amount: number, returnUrl?: string, customUserId?: string) => {
    const res = await fetch('/api/cashfree/create-order', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ amount, returnUrl }),
    });
    return await res.json();
  },

  getCashfreeOrderStatus: async (orderId: string, customUserId?: string) => {
    const res = await fetch(`/api/cashfree/order-status/${encodeURIComponent(orderId)}`, {
      headers: getAuthHeaders(customUserId),
    });
    return await res.json();
  },

  simulateCashfreePayment: async (orderId: string, cfPaymentId?: string, customUserId?: string) => {
    const res = await fetch('/api/cashfree/simulate-payment', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ orderId, cfPaymentId }),
    });
    return await res.json();
  },

  // --- Real-Money Wallet, Deposits & Withdrawals ---
  createDepositOrder: async (amount: number, channel?: string, customUserId?: string) => {
    const res = await fetch('/api/wallet/deposit/create-order', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ amount, channel }),
    });
    return await res.json();
  },

  submitDepositUtr: async (orderId: string, amount: number, channel: string, utrNumber: string, proofUrl?: string, autoApprove?: boolean, customUserId?: string) => {
    const res = await fetch('/api/wallet/deposit/submit-utr', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ orderId, amount, channel, utrNumber, proofUrl, autoApprove }),
    });
    return await res.json();
  },

  depositMoney: async (amount: number, channel?: string, customUserId?: string) => {
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ amount, channel }),
    });
    return await res.json();
  },

  withdrawMoney: async (amount: number, bankDetails?: any, customUserId?: string) => {
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ amount, bankDetails }),
    });
    return await res.json();
  },

  getTransactions: async (customUserId?: string) => {
    try {
      const res = await fetch('/api/wallet/transactions', { headers: getAuthHeaders(customUserId) });
      return await res.json();
    } catch {
      return null;
    }
  },

  // --- Aviator Server Crash Engine ---
  getAviatorState: async (customUserId?: string) => {
    const res = await fetch('/api/games/aviator/state', { headers: getAuthHeaders(customUserId) });
    return await res.json();
  },

  placeAviatorBet: async (amount: number, customUserId?: string) => {
    const res = await fetch('/api/games/aviator/bet', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ amount }),
    });
    return await res.json();
  },

  cashoutAviator: async (customUserId?: string) => {
    const res = await fetch('/api/games/aviator/cashout', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
    });
    return await res.json();
  },

  // --- Win Go / TRX Period Draw Engines ---
  getWinGoState: async (type: string = '1min', customUserId?: string) => {
    const res = await fetch(`/api/games/wingo/state?type=${encodeURIComponent(type)}`, { headers: getAuthHeaders(customUserId) });
    return await res.json();
  },

  placeWinGoBet: async (
    gameType: string,
    targetType: 'color' | 'number' | 'size',
    targetValue: string | number,
    amount: number,
    multiplier: number = 1,
    customUserId?: string
  ) => {
    const res = await fetch('/api/games/wingo/bet', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ gameType, targetType, targetValue, amount, multiplier }),
    });
    return await res.json();
  },

  // --- Dragon vs Tiger Live Arena ---
  getDragonTigerState: async (customUserId?: string) => {
    const res = await fetch('/api/games/dragontiger/state', { headers: getAuthHeaders(customUserId) });
    return await res.json();
  },

  placeDragonTigerBet: async (choice: 'dragon' | 'tiger' | 'tie', amount: number, customUserId?: string) => {
    const res = await fetch('/api/games/dragontiger/bet', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ choice, amount }),
    });
    return await res.json();
  },

  // --- Mines Pro ---
  startMines: async (betAmount: number, minesCount: number) => {
    const res = await fetch('/api/games/mines/start', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ betAmount, minesCount }),
    });
    return await res.json();
  },

  revealMinesTile: async (tileIndex: number) => {
    const res = await fetch('/api/games/mines/reveal', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tileIndex }),
    });
    return await res.json();
  },

  cashoutMines: async () => {
    const res = await fetch('/api/games/mines/cashout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  // --- Limbo & Roulette ---
  playLimbo: async (betAmount: number, targetMultiplier: number) => {
    const res = await fetch('/api/games/limbo/play', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ betAmount, targetMultiplier }),
    });
    return await res.json();
  },

  spinRoulette: async (bets: Record<string, number>, totalBet?: number) => {
    const res = await fetch('/api/games/roulette/spin', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bets, totalBet }),
    });
    return await res.json();
  },

  // ==========================================
  // MASTER OPERATOR & ADMIN CONTROLLER METHODS
  // ==========================================
  getAdminOverview: async () => {
    const res = await fetch('/api/admin/overview', { headers: getAuthHeaders() });
    return await res.json();
  },

  getAdminUsers: async () => {
    const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
    return await res.json();
  },

  adminUserAction: async (userId: string, action: string, payload: any = {}) => {
    const res = await fetch('/api/admin/users/action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, action, ...payload }),
    });
    return await res.json();
  },

  getAdminDeposits: async () => {
    const res = await fetch('/api/admin/deposits', { headers: getAuthHeaders() });
    return await res.json();
  },

  adminDepositAction: async (depositId: string, action: 'approve' | 'reject', rejectReason?: string) => {
    const res = await fetch('/api/admin/deposits/action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ depositId, action, rejectReason }),
    });
    return await res.json();
  },

  getAdminWithdrawals: async () => {
    const res = await fetch('/api/admin/withdrawals', { headers: getAuthHeaders() });
    return await res.json();
  },

  adminWithdrawalAction: async (withdrawalId: string, action: 'approve' | 'reject', impsRef?: string, rejectReason?: string) => {
    const res = await fetch('/api/admin/withdrawals/action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ withdrawalId, action, impsRef, rejectReason }),
    });
    return await res.json();
  },

  getAdminLiveBets: async () => {
    const res = await fetch('/api/admin/live-bets', { headers: getAuthHeaders() });
    return await res.json();
  },

  adminBroadcast: async (message: string) => {
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    return await res.json();
  },

  forceAviatorCrashNow: async () => {
    const res = await fetch('/api/admin/aviator/force-crash-now', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  setAviatorTarget: async (targetMultiplier?: number, mode?: string) => {
    const res = await fetch('/api/admin/aviator/set-target', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetMultiplier, mode }),
    });
    return await res.json();
  },

  setAviatorMode: async (mode: string) => {
    const res = await fetch('/api/admin/aviator/set-mode', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode }),
    });
    return await res.json();
  },

  setWinGoNextDraw: async (params: {
    gameType: string;
    number?: number;
    color?: 'green' | 'red' | 'violet';
    size?: 'Big' | 'Small';
  }) => {
    const res = await fetch('/api/admin/wingo/set-next-draw', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return await res.json();
  },

  setWinGoMode: async (gameType: string, mode: 'auto' | 'smart_house_profit' | 'manual') => {
    const res = await fetch('/api/admin/wingo/set-mode', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gameType, mode }),
    });
    return await res.json();
  },

  forceWinGoDrawNow: async (gameType: string) => {
    const res = await fetch('/api/admin/wingo/force-draw-now', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gameType }),
    });
    return await res.json();
  },

  setDragonTigerWinner: async (winner: 'auto' | 'dragon' | 'tiger' | 'tie') => {
    const res = await fetch('/api/admin/dragontiger/set-winner', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ winner }),
    });
    return await res.json();
  },

  setMinesRig: async (rigMode: 'auto' | 'safe' | 'explode') => {
    const res = await fetch('/api/admin/mines/set-rig', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rigMode }),
    });
    return await res.json();
  },

  setRouletteNumber: async (number: number) => {
    const res = await fetch('/api/admin/roulette/set-number', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ number }),
    });
    return await res.json();
  },

  setLimboMultiplier: async (multiplier: number) => {
    const res = await fetch('/api/admin/limbo/set-multiplier', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ multiplier }),
    });
    return await res.json();
  },

  // --- Real-Time Test & Sandbox Endpoints ---
  creditTestFunds: async (amount: number = 1000, customUserId?: string) => {
    const res = await fetch('/api/test/credit-funds', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ amount }),
    });
    return await res.json();
  },

  fastLaunchAviator: async () => {
    const res = await fetch('/api/test/aviator-takeoff', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  injectSimulatedBots: async () => {
    const res = await fetch('/api/test/inject-bots', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  spinSlots: async (betCost: number = 20, customUserId?: string) => {
    const res = await fetch('/api/games/slots/spin', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ betCost }),
    });
    return await res.json();
  },

  // --- Multiplayer Co-Play & Room Presence ---
  getMultiplayerRoomState: async (game: string = 'aviator', customUserId?: string) => {
    try {
      const res = await fetch(`/api/multiplayer/room-state?game=${encodeURIComponent(game)}`, {
        headers: getAuthHeaders(customUserId),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  sendMultiplayerHeartbeat: async (currentGame: string = 'aviator', customUserId?: string) => {
    try {
      const res = await fetch('/api/multiplayer/heartbeat', {
        method: 'POST',
        headers: getAuthHeaders(customUserId),
        body: JSON.stringify({ currentGame }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  sendMultiplayerReaction: async (text: string, type: 'emoji' | 'message' = 'emoji', customUserId?: string) => {
    const res = await fetch('/api/multiplayer/react', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ text, type }),
    });
    return await res.json();
  },

  quickCreateMultiplayerPlayer: async (name: string, initialBalance?: number) => {
    const res = await fetch('/api/multiplayer/quick-create-player', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, initialBalance }),
    });
    return await res.json();
  },

  // --- KYC Compliance & ID Verification ---
  submitKYC: async (data: {
    fullName: string;
    documentType: string;
    documentNumber: string;
    dateOfBirth?: string;
    idPhotoFront?: string;
    idPhotoBack?: string;
  }) => {
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  getKYCStatus: async () => {
    try {
      const res = await fetch('/api/kyc/status', { headers: getAuthHeaders() });
      return await res.json();
    } catch {
      return null;
    }
  },

  getAdminKYCList: async () => {
    const res = await fetch('/api/admin/kyc/list', { headers: getAuthHeaders() });
    return await res.json();
  },

  reviewAdminKYC: async (kycId: string, userId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    const res = await fetch('/api/admin/kyc/review', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ kycId, userId, action, rejectionReason }),
    });
    return await res.json();
  },

  // --- SMS OTP Mobile Verification ---
  sendPhoneOTP: async (phone: string) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone }),
    });
    return await res.json();
  },

  verifyPhoneOTP: async (otp: string, phone?: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ otp, phone }),
    });
    return await res.json();
  },

  // --- Responsible Gaming & Limits ---
  getResponsibleGamingSettings: async () => {
    try {
      const res = await fetch('/api/user/responsible-gaming', { headers: getAuthHeaders() });
      return await res.json();
    } catch {
      return null;
    }
  },

  updateResponsibleGamingSettings: async (settings: {
    dailyDepositLimit?: number;
    weeklyDepositLimit?: number;
    monthlyDepositLimit?: number;
    sessionTimeLimitMinutes?: number;
    realityCheckMinutes?: number;
    selfExclusionDays?: number;
  }) => {
    const res = await fetch('/api/user/responsible-gaming', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return await res.json();
  },

  // --- Provably Fair Verification ---
  getProvablyFairActiveSeeds: async () => {
    const res = await fetch('/api/provably-fair/active-seeds', { headers: getAuthHeaders() });
    return await res.json();
  },

  verifyProvablyFair: async (serverSeed: string, clientSeed: string, nonce: number, gameType: string) => {
    const res = await fetch('/api/provably-fair/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ serverSeed, clientSeed, nonce, gameType }),
    });
    return await res.json();
  },

  // --- Production Payment Webhook Simulator ---
  triggerPaymentWebhook: async (payload: {
    order_id: string;
    payment_id: string;
    order_amount: number;
    customer_details: { customer_phone?: string; customer_id?: string };
  }) => {
    const res = await fetch('/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // --- Financial Stats & GGR Audit ---
  getAdminFinancialStats: async () => {
    const res = await fetch('/api/admin/financial-stats', { headers: getAuthHeaders() });
    return await res.json();
  },

  // --- Real-Time Server-Sent Events (SSE) Stream ---
  createEventStream: (onEvent: (event: string, data: any) => void) => {
    if (typeof window === 'undefined' || !window.EventSource) return null;
    const es = new EventSource('/api/stream/events');

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent('message', parsed);
      } catch {}
    };

    ['connected', 'audit_log', 'balance_update', 'deposit_credited', 'chat_message', 'aviator_phase', 'aviator_tick'].forEach((evtType) => {
      es.addEventListener(evtType, (e: any) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(evtType, parsed);
        } catch {}
      });
    });

    return es;
  },

  // --- Operator Audit Trail ---
  getAdminAuditLogs: async () => {
    const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
    return await res.json();
  },

  // --- Dynamic Risk Management & Liability ---
  getRiskLiability: async () => {
    const res = await fetch('/api/admin/risk-liability', { headers: getAuthHeaders() });
    return await res.json();
  },

  setTargetRTP: async (rtp: number) => {
    const res = await fetch('/api/admin/risk-liability/set-target-rtp', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rtp }),
    });
    return await res.json();
  },

  // --- Automated Fraud & Bot Radar ---
  getFraudDetection: async () => {
    const res = await fetch('/api/admin/fraud-detection', { headers: getAuthHeaders() });
    return await res.json();
  },

  applyFraudAction: async (userId: string, action: 'quarantine' | 'unfreeze', reason?: string) => {
    const res = await fetch('/api/admin/fraud-action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, action, reason }),
    });
    return await res.json();
  },

  // --- Automated 12-Digit UPI UTR Verification ---
  verifyUtrAuto: async (utrNumber: string, amount: number, channel?: string, customUserId?: string) => {
    const res = await fetch('/api/wallet/deposit/verify-utr-auto', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ utrNumber, amount, channel }),
    });
    return await res.json();
  },

  // --- Tiered KYC Compliance ---
  getTieredKYCStatus: async () => {
    const res = await fetch('/api/kyc/tiered-status', { headers: getAuthHeaders() });
    return await res.json();
  },

  submitTieredKYC: async (data: {
    fullName: string;
    documentType: string;
    documentNumber: string;
    dateOfBirth?: string;
    idPhotoFront?: string;
  }) => {
    const res = await fetch('/api/kyc/tiered-submit', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // --- Live Multiplayer Room Chat & Gifting ---
  getChatMessages: async () => {
    const res = await fetch('/api/chat/messages', { headers: getAuthHeaders() });
    return await res.json();
  },

  sendChatMessage: async (text: string, customUserId?: string) => {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ text }),
    });
    return await res.json();
  },

  tipPlayer: async (toUserId: string, amount: number, customUserId?: string) => {
    const res = await fetch('/api/chat/tip', {
      method: 'POST',
      headers: getAuthHeaders(customUserId),
      body: JSON.stringify({ toUserId, amount }),
    });
    return await res.json();
  },

  // --- Settlement Reports ---
  getSettlementReport: async () => {
    const res = await fetch('/api/admin/settlement-report', { headers: getAuthHeaders() });
    return await res.json();
  },

  setAuthSession: (token?: string, userId?: string) => {
    setAuthSession(token, userId);
  },

  clearAuthSession: () => {
    clearAuthSession();
  },
};
