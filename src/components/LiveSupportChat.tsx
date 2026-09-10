import React, { useState } from 'react';
import { Headphones, Send, X, Bot, User, HelpCircle, ShieldCheck } from 'lucide-react';
import { SupportMessage } from '../types';
import { soundEffects } from '../utils/audio';

interface LiveSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
}

const FAQ_SUGGESTIONS = [
  'How to deposit money via UPI?',
  'How fast is the withdrawal process?',
  'Win Go 1Min game calculation rules',
  'How to use my referral code 5226410218444?',
  'How to claim ₹500 welcome bonus?'
];

export const LiveSupportChat: React.FC<LiveSupportChatProps> = ({
  isOpen,
  onClose,
  onOpenWallet
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: '1',
      sender: 'agent',
      text: 'Hello! Welcome to SKG8 WIN Official 24/7 VIP Customer Service. How can I assist you with your gaming, deposits, or withdrawals today?',
      timestamp: Date.now() - 30000,
      options: FAQ_SUGGESTIONS
    }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    soundEffects.click();
    const userMsg: SupportMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Automated smart assistant response
    setTimeout(() => {
      soundEffects.tick();
      let reply = "Our support specialist is reviewing your inquiry. Your request is prioritized for instant resolution.";
      
      const lower = text.toLowerCase();
      if (lower.includes('deposit') || lower.includes('recharge') || lower.includes('upi')) {
        reply = "Deposits via UPI QR, Paytm, and USDT are processed instantly with a +5% recharge bonus. Click Deposit in the top header or Wallet to initiate.";
      } else if (lower.includes('withdraw') || lower.includes('payout')) {
        reply = "Withdrawals are supported 24/7 with minimum amount of ₹110. Payouts are credited directly to your bank account or UPI within 1-5 minutes.";
      } else if (lower.includes('referral') || lower.includes('invite') || lower.includes('5226410218444')) {
        reply = "Your referral code is 5226410218444. You earn multi-tier turnover commissions (0.6% on Tier 1) whenever your team members place bets.";
      } else if (lower.includes('bonus') || lower.includes('welcome') || lower.includes('gift')) {
        reply = "Welcome bonus of ₹500 is credited on registration. You can also redeem gift code 'SKGWIN2026' in the Activity center for additional bonuses.";
      } else if (lower.includes('wingo') || lower.includes('rule') || lower.includes('color')) {
        reply = "Win Go colors: Green (1,3,7,9 = 2x), Red (2,4,6,8 = 2x), Violet (0,5 = 4.5x), Exact Number (0-9 = 9x), Big/Small (2x). Draws occur every 60s.";
      }

      const botMsg: SupportMessage = {
        id: String(Date.now() + 1),
        sender: 'agent',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[560px] overflow-hidden text-[#E0E0E0] relative">
        {/* Chat Header */}
        <div className="bg-[#050505] px-5 py-4 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5 tracking-wider uppercase">
                <span className="text-white">Elite Concierge Support</span>
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              </div>
              <div className="text-[10px] text-[#A0A0A0]">Average response time: &lt; 0.01ms</div>
            </div>
          </div>
          <button
            id="close-support-chat-btn"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#A0A0A0] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#050505]/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#F2D06B] text-[#050505] flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-sm shadow-[#D4AF37]/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="max-w-[80%] space-y-2">
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] font-semibold rounded-tr-none shadow-md shadow-[#D4AF37]/20'
                      : 'bg-[#121212] border border-white/10 text-[#E0E0E0] rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Suggestions buttons */}
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(opt)}
                        className="text-[10px] py-1.5 px-3 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-left transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#0D0D0D] border-t border-white/10 flex gap-2"
        >
          <input
            id="support-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your inquiry..."
            className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50"
          />
          <button
            id="send-support-msg-btn"
            type="submit"
            className="p-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8952E] text-[#050505] hover:brightness-110 font-bold shadow-md shadow-[#D4AF37]/20 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
