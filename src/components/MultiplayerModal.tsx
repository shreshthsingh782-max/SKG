import React, { useState, useEffect } from 'react';
import { 
  X, Users, UserPlus, ExternalLink, Copy, Check, Sparkles, 
  Flame, Rocket, DollarSign, Crown, RefreshCw, Smartphone, 
  Monitor, MessageSquare, ShieldCheck, Zap
} from 'lucide-react';
import { MultiplayerPlayer, MultiplayerReaction, MultiplayerRoomState, UserProfile } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  isDualPlayerActive: boolean;
  onToggleDualPlayer: (active: boolean) => void;
  selectedPlayer2: MultiplayerPlayer | null;
  onSelectPlayer2: (player: MultiplayerPlayer) => void;
  onSwitchUser?: (userId: string) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isDualPlayerActive,
  onToggleDualPlayer,
  selectedPlayer2,
  onSelectPlayer2,
  onSwitchUser,
}) => {
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Friend Creator state
  const [showCreateFriend, setShowCreateFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendBalance, setFriendBalance] = useState(5000);
  const [isCreatingFriend, setIsCreatingFriend] = useState(false);

  // Reaction state
  const [reactionText, setReactionText] = useState('');
  const [isSendingReaction, setIsSendingReaction] = useState(false);

  const fetchRoom = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMultiplayerRoomState('aviator');
      if (res && res.success) {
        setRoomState(res);
        // Default select player 2 if none selected yet
        if (!selectedPlayer2 && res.players.length > 1) {
          const second = res.players.find((p: MultiplayerPlayer) => p.id !== currentUser.id) || res.players[1];
          if (second) onSelectPlayer2(second);
        }
      }
    } catch (e) {
      console.error('Failed to fetch multiplayer room', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoom();
      const interval = setInterval(fetchRoom, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleCreateFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    setIsCreatingFriend(true);
    try {
      soundEffects.click();
      const res = await api.quickCreateMultiplayerPlayer(friendName.trim(), friendBalance);
      if (res && res.success && res.user) {
        soundEffects.coins();
        setShowCreateFriend(false);
        setFriendName('');
        await fetchRoom();
        const newP: MultiplayerPlayer = {
          id: res.user.id,
          name: res.user.name,
          phone: res.user.phone,
          avatar: res.user.avatar,
          balance: res.user.balance,
          vipLevel: res.user.vipLevel,
          isOnline: true,
          currentGame: 'aviator',
          lastActive: Date.now(),
        };
        onSelectPlayer2(newP);
      }
    } catch (err) {
      console.error('Create friend error', err);
    } finally {
      setIsCreatingFriend(false);
    }
  };

  const handleSendReaction = async (text: string, type: 'emoji' | 'message' = 'emoji') => {
    if (!text.trim()) return;
    setIsSendingReaction(true);
    soundEffects.click();
    try {
      await api.sendMultiplayerReaction(text, type);
      setReactionText('');
      fetchRoom();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingReaction(false);
    }
  };

  const handleCopyLink = (playerId?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const targetPlayerId = playerId || (selectedPlayer2 ? selectedPlayer2.id : 'UID1082914');
    const link = `${origin}/?player=${encodeURIComponent(targetPlayerId)}&room=vip_table`;
    navigator.clipboard.writeText(link);
    soundEffects.click();
    if (playerId) {
      setCopiedId(playerId);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOpenNewTab = (playerId: string) => {
    soundEffects.click();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/?player=${encodeURIComponent(playerId)}&room=vip_table`;
    window.open(link, '_blank');
  };

  const players = roomState?.players || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0c0c0f] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base font-serif-luxury">Multi-User Play Center</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {roomState?.totalOnline || 4} Online Now
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Play simultaneously on same screen, split tabs, or with friends</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchRoom}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`}
              title="Refresh Roster"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Primary Feature 1: Dual Player Split Mode Toggle */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-3.5 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span className="text-white font-bold text-sm">Dual-Player Split-Screen Mode</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    2 PLAYERS • 1 SCREEN
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Enables two independent betting decks side-by-side in Aviator and casino games with separate balances and cashouts!
                </p>
              </div>

              <button
                id="toggle-dual-player-btn"
                onClick={() => {
                  soundEffects.click();
                  onToggleDualPlayer(!isDualPlayerActive);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition-all flex items-center gap-1.5 shadow-lg ${
                  isDualPlayerActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                }`}
              >
                {isDualPlayerActive ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950 font-bold" />
                    <span>Active ON</span>
                  </>
                ) : (
                  <span>Turn ON</span>
                )}
              </button>
            </div>

            {/* Currently Selected Co-Player */}
            {selectedPlayer2 && (
              <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Co-Player (P2):</span>
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                    <img
                      src={selectedPlayer2.avatar}
                      alt={selectedPlayer2.name}
                      className="w-4 h-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-white font-bold text-[11px]">{selectedPlayer2.name}</span>
                    <span className="text-emerald-400 font-mono font-bold text-[10px]">
                      ₹{selectedPlayer2.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-indigo-300 italic">Select another player below to switch P2</span>
              </div>
            )}
          </div>

          {/* Primary Feature 2: Multi-Device / Multi-Tab Co-Play Link */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold text-xs">Multi-Tab & Friends Invite Link</span>
              </div>
              <span className="text-[10px] text-slate-400">Play from 2 different tabs or phones</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open a new tab or send this link to a friend. Each tab maintains an independent authenticated user session while syncing on the exact same live server round in real-time.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-300 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/?player=${selectedPlayer2?.id || 'UID1082914'}&room=vip_table` : ''}
              </div>

              <button
                id="copy-multiplayer-link-btn"
                onClick={() => handleCopyLink()}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                id="open-tab-player2-btn"
                onClick={() => handleOpenNewTab(selectedPlayer2?.id || 'UID1082914')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-md shadow-indigo-600/30 transition-transform active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </button>
            </div>
          </div>

          {/* Active Co-Players Roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Available Player Profiles ({players.length})</span>
              </div>

              <button
                id="add-friend-profile-btn"
                onClick={() => setShowCreateFriend(!showCreateFriend)}
                className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-[10px] flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Add Friend Account</span>
              </button>
            </div>

            {/* Quick Friend Creation Form */}
            {showCreateFriend && (
              <form onSubmit={handleCreateFriend} className="bg-slate-900 border border-[#D4AF37]/40 rounded-xl p-3 space-y-2.5 animate-scaleUp">
                <div className="text-white font-bold text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Create Instant Co-Player Profile</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Player Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Starting Balance (₹)</label>
                    <input
                      type="number"
                      value={friendBalance}
                      onChange={(e) => setFriendBalance(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                      min="100"
                      step="100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateFriend(false)}
                    className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingFriend || !friendName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-slate-950 font-black text-[11px] disabled:opacity-50"
                  >
                    {isCreatingFriend ? 'Creating...' : 'Create & Play'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Players */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {players.map((p) => {
                const isCurrent = p.id === currentUser.id;
                const isSelectedAsP2 = selectedPlayer2?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isCurrent
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : isSelectedAsP2
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold text-xs truncate">{p.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-400/40">
                              YOU (P1)
                            </span>
                          )}
                          {isSelectedAsP2 && !isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                              CO-PLAYER (P2)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-mono text-emerald-400 font-bold">
                            ₹{p.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{p.currentGame || 'Aviator'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent && (
                        <>
                          <button
                            onClick={() => {
                              soundEffects.click();
                              onSelectPlayer2(p);
                              if (!isDualPlayerActive) onToggleDualPlayer(true);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isSelectedAsP2
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                            }`}
                            title="Set this user as Player 2 for Split Mode"
                          >
                            {isSelectedAsP2 ? 'Selected P2' : 'Set as P2'}
                          </button>

                          <button
                            onClick={() => handleOpenNewTab(p.id)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10"
                            title="Open in new window as this user"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {onSwitchUser && !isCurrent && (
                        <button
                          onClick={() => {
                            soundEffects.click();
                            onSwitchUser(p.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-[10px] text-slate-400 hover:text-[#D4AF37] border border-white/5"
                          title="Switch perspective to this user"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Community Reactions & Live Shoutouts */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Live Multiplayer Cheers & Reactions</span>
              </span>
              <span className="text-[10px] text-slate-400">Broadcasts to all connected screens</span>
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { emoji: '🚀', label: 'Fly High' },
                { emoji: '🔥', label: 'Fire' },
                { emoji: '💰', label: 'Cashout' },
                { emoji: '💎', label: 'Diamond' },
                { emoji: '👏', label: 'Clap' },
                { emoji: '⚡', label: 'Target 10X' },
                { emoji: '🎯', label: 'Bullseye' },
                { emoji: '👑', label: 'VIP' },
              ].map((item) => (
                <button
                  key={item.emoji}
                  disabled={isSendingReaction}
                  onClick={() => handleSendReaction(item.emoji, 'emoji')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-90 transition-transform text-sm shrink-0 border border-white/5"
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            {/* Preset Tactical Shouts */}
            <div className="flex flex-wrap gap-1.5">
              {[
                '🚀 CASHOUT NOW!',
                '🔥 Let’s ride to 5X!',
                '💰 Big Win in Flight!',
                '⚡ High Multiplier Incoming!',
              ].map((shout) => (
                <button
                  key={shout}
                  disabled={isSendingReaction}
                  onClick={() => handleSendReaction(shout, 'message')}
                  className="px-2 py-1 rounded-md bg-black/40 hover:bg-white/10 text-[10px] text-slate-300 font-medium border border-white/5 transition-colors"
                >
                  {shout}
                </button>
              ))}
            </div>

            {/* Recent Reactions Ticker */}
            {roomState?.reactions && roomState.reactions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 max-h-24 overflow-y-auto">
                {roomState.reactions.slice(0, 4).map((r: MultiplayerReaction) => (
                  <div key={r.id} className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-bold text-white">{r.userName}:</span>
                    <span className="text-amber-300 font-semibold">{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Server-Authoritative Sync Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
