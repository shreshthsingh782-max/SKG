import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Gift, Users, Sparkles, MessageSquare, DollarSign, 
  Crown, Heart, Flame, Rocket, Smile, AlertCircle, CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/audio';

interface MultiplayerChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onAddTransaction: (tx: any) => void;
}

export const MultiplayerChatDrawer: React.FC<MultiplayerChatDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateBalance,
  onAddTransaction,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'players' | 'tip'>('chat');
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [tipAmount, setTipAmount] = useState(100);
  const [isSending, setIsSending] = useState(false);
  const [tipStatus, setTipStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatAndPlayers = async () => {
    try {
      const [chatRes, roomRes] = await Promise.all([
        api.getChatMessages(),
        api.getMultiplayerRoomState('aviator'),
      ]);

      if (chatRes && chatRes.messages) {
        setMessages(chatRes.messages);
      }
      if (roomRes && roomRes.players) {
        setOnlinePlayers(roomRes.players);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchChatAndPlayers();
    const interval = setInterval(fetchChatAndPlayers, 1800);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    soundEffects.click();

    try {
      const res = await api.sendChatMessage(text);
      if (res && res.success && res.message) {
        setMessages((prev) => [res.message, ...prev]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      // Fallback local echo
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTip = async () => {
    if (!selectedRecipient) {
      setTipStatus('Please select a player to tip');
      return;
    }
    if (tipAmount <= 0) {
      setTipStatus('Tip amount must be greater than 0');
      return;
    }
    if (user.balance < tipAmount) {
      setTipStatus('Insufficient wallet balance to send tip');
      return;
    }

    setIsSending(true);
    setTipStatus(null);
    soundEffects.click();

    try {
      const res = await api.tipPlayer(selectedRecipient.id, tipAmount);
      if (res && res.success) {
        soundEffects.win();
        soundEffects.coins();
        confetti({ particleCount: 70, spread: 60, colors: ['#D4AF37', '#FF0055', '#FFFFFF'] });

        if (res.senderNewBalance !== undefined) {
          onUpdateBalance(res.senderNewBalance);
        } else {
          onUpdateBalance(user.balance - tipAmount);
        }

        onAddTransaction({
          id: 'tx_tip_' + Date.now(),
          type: 'withdraw',
          amount: tipAmount,
          status: 'completed',
          timestamp: Date.now(),
          title: `Player Tip to ${selectedRecipient.name}`,
          description: `Gifted ₹${tipAmount} to ${selectedRecipient.name} in Room Chat`,
        });

        setTipStatus(`🎉 Successfully tipped ₹${tipAmount} to ${selectedRecipient.name}!`);
        setActiveTab('chat');
        fetchChatAndPlayers();
      } else {
        setTipStatus(res?.message || 'Failed to send tip');
      }
    } catch {
      setTipStatus('Network error sending tip');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        id="multiplayer-chat-drawer"
        className="w-full sm:max-w-md h-[88vh] sm:h-[620px] bg-[#0F1015] border-t sm:border border-indigo-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-slideUp"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-1.5">
                <span>VIP Live Room Chat</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-[10px] text-indigo-300 flex items-center gap-2">
                <span>{onlinePlayers.length} Players Online</span>
                <span>•</span>
                <span className="text-amber-400 font-mono">Balance: ₹{user.balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            id="chat-drawer-close-btn"
            onClick={() => {
              soundEffects.click();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/40 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({messages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'players' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players ({onlinePlayers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tip')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'tip' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>Tip / Gift</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {activeTab === 'chat' && (
            <div className="flex flex-col-reverse space-y-reverse space-y-2 min-h-full">
              <div ref={messagesEndRef} />
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No chat messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.userId === user.id;
                  const isTip = m.type === 'tip';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 text-xs animate-fadeIn ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                        alt={m.userName}
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`max-w-[78%] rounded-2xl p-2.5 shadow-sm ${
                        isTip
                          ? 'bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border border-amber-500/50 text-amber-200'
                          : isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                          <span className="font-bold text-white truncate max-w-[120px]">{m.userName}</span>
                          {m.vipLevel && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-400/30">
                              VIP{m.vipLevel}
                            </span>
                          )}
                          <span className="text-slate-500">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {isTip && (
                          <div className="flex items-center gap-1 font-bold text-amber-300 mb-0.5 text-[11px]">
                            <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>PLAYER TIP: ₹{m.amount}</span>
                          </div>
                        )}

                        <p className="text-xs break-words">{m.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 font-bold px-1">
                ONLINE PLAYERS IN ROOM ({onlinePlayers.length})
              </div>
              {onlinePlayers.map((p) => {
                const isCurrent = p.id === user.id;
                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/20"
                          referrerPolicy="no-referrer"
                        />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute bottom-0 right-0"></span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 text-[9px] font-black">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="text-amber-400 font-mono">₹{p.balance?.toFixed(2) || '0.00'}</span>
                          <span>•</span>
                          <span className="uppercase font-mono text-[9px] text-indigo-300">{p.currentGame || 'Aviator'}</span>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          setSelectedRecipient(p);
                          setActiveTab('tip');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Gift className="w-3 h-3 text-amber-400" />
                        <span>Tip</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'tip' && (
            <div className="space-y-3.5 p-2 bg-slate-900/80 border border-white/10 rounded-2xl">
              <div className="text-center pb-2 border-b border-white/10">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 mx-auto flex items-center justify-center text-amber-300 mb-1.5">
                  <Gift className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-white">Gift / Tip Another Player</h4>
                <p className="text-[11px] text-slate-400">Transfer real wallet funds instantly with a room announcement</p>
              </div>

              {tipStatus && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                  tipStatus.includes('Successfully')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tipStatus}</span>
                </div>
              )}

              {/* Recipient Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Select Player to Gift:</label>
                <select
                  value={selectedRecipient?.id || ''}
                  onChange={(e) => {
                    const found = onlinePlayers.find((p) => p.id === e.target.value);
                    setSelectedRecipient(found || null);
                  }}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Choose Online Player --</option>
                  {onlinePlayers
                    .filter((p) => p.id !== user.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.balance?.toFixed(2) || '0.00'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Tip Preset Chips */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Tip Amount (₹):</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTipAmount(amt)}
                      className={`py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                        tipAmount === amt
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                          : 'bg-black/50 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  placeholder="Custom amount"
                />
              </div>

              <button
                id="send-player-tip-submit-btn"
                disabled={isSending || !selectedRecipient}
                onClick={handleSendTip}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Gift className="w-4 h-4 text-black" />
                <span>Send Tip ₹{tipAmount} to {selectedRecipient?.name || 'Player'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Chat Input & Emoji Quick Bar */}
        {activeTab === 'chat' && (
          <div className="p-2.5 bg-slate-900 border-t border-white/10 shrink-0">
            {/* Quick Emoji Reactions */}
            <div className="flex items-center justify-between gap-1 pb-2 overflow-x-auto">
              {['🚀', '🔥', '💰', '💎', '👏', '🤑', '❤️', '🎉'].map((em) => (
                <button
                  key={em}
                  onClick={() => {
                    soundEffects.click();
                    api.sendChatMessage(em);
                    setMessages((prev) => [
                      {
                        id: 'msg_' + Date.now(),
                        userId: user.id,
                        userName: user.name,
                        avatar: user.avatar,
                        vipLevel: user.vipLevel,
                        text: em,
                        type: 'chat',
                        timestamp: Date.now(),
                      },
                      ...prev,
                    ]);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-base transition-transform active:scale-125"
                >
                  {em}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Say something to the room..."
                maxLength={120}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center justify-center shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
