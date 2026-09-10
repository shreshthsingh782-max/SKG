export type GameType = '1min' | '3min' | '5min' | '10min' | 'trx1min' | '5d' | 'aviator' | 'slots' | 'mines' | 'dragontiger' | 'limbo' | 'roulette';

export type BetColor = 'green' | 'red' | 'violet' | 'green-violet' | 'red-violet';
export type BetSize = 'Big' | 'Small';

export type UserRole = 'player' | 'controller' | 'admin';

export interface KYCData {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  fullName: string;
  documentType: 'pan' | 'aadhaar' | 'passport' | 'national_id';
  documentNumber: string;
  dateOfBirth?: string;
  idPhotoFront?: string;
  idPhotoBack?: string;
  verifiedAt?: number;
  rejectionReason?: string;
  submittedAt?: number;
}

export interface ResponsibleGamingSettings {
  dailyDepositLimit: number; // 0 = unlimited
  weeklyDepositLimit: number;
  monthlyDepositLimit: number;
  sessionTimeLimitMinutes: number; // 0 = no limit
  selfExclusionUntil?: number; // timestamp
  realityCheckMinutes: number;
}

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  avatar: string;
  balance: number;
  role?: UserRole;
  isController?: boolean;
  isBanned?: boolean;
  isPhoneVerified?: boolean;
  kyc?: KYCData;
  responsibleGaming?: ResponsibleGamingSettings;
  vipLevel: number;
  vipPoints: number;
  invitationCode: string;
  referrerCode: string;
  isRegistered: boolean;
  registeredAt: number;
  dailyCheckins: number[]; // days claimed [1, 2...]
  totalBets: number;
  totalWins: number;
  totalWonAmount: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    bankName: string;
  };
}

export interface DepositRequest {
  id: string;
  userId: string;
  userPhone: string;
  userName?: string;
  amount: number;
  channel: string;
  utrNumber: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  approvedAt?: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userPhone: string;
  userName?: string;
  amount: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    bankName: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  impsRef?: string;
}

export interface LivePlayerBet {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  game: string;
  target: string;
  amount: number;
  multiplier?: number;
  winAmount?: number;
  timestamp: number;
  status: 'placed' | 'won' | 'lost';
}

export interface WinGoPeriod {
  periodId: string;
  duration: number; // in seconds
  timeLeft: number;
  outcome?: {
    number: number;
    color: BetColor;
    size: BetSize;
    hash?: string;
  };
  timestamp: number;
}

export interface PeriodHistoryItem {
  periodId: string;
  number: number;
  color: BetColor;
  size: BetSize;
  hash?: string;
  timestamp: number;
}

export interface WinGoBet {
  id: string;
  periodId: string;
  gameType: string;
  targetType: 'color' | 'number' | 'size';
  targetValue: string | number; // 'green', 'red', 'violet', 0..9, 'Big', 'Small'
  baseAmount: number;
  multiplier: number;
  totalAmount: number;
  status: 'pending' | 'won' | 'lost';
  winAmount?: number;
  createdAt: number;
  periodOutcome?: {
    number: number;
    color: BetColor;
    size: BetSize;
  };
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'referral_bonus' | 'checkin' | 'gift_code';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
  title: string;
  description: string;
  txHash?: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: number;
  options?: string[];
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  balance: number;
  vipLevel: number;
  role?: string;
  isOnline: boolean;
  currentGame?: string;
  lastActive: number;
}

export interface MultiplayerReaction {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  text: string;
  type?: 'emoji' | 'message';
  timestamp: number;
}

export interface MultiplayerRoomState {
  roomId: string;
  roomName: string;
  totalOnline: number;
  players: MultiplayerPlayer[];
  reactions: MultiplayerReaction[];
  aviatorRoundId?: string;
  aviatorPhase?: string;
  aviatorMultiplier?: number;
  aviatorActiveBetsCount?: number;
}

export type MainTab = 'home' | 'activity' | 'promotion' | 'wallet' | 'mine';
export type SubGame = 'wingo' | 'trx' | 'aviator' | 'mines' | 'dragontiger' | 'limbo' | 'roulette' | 'slots';
