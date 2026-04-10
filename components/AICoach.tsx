
import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { getCoachResponse } from '../services/geminiService';
import { UserProfile, DailyStats, ChatMessage } from '../types';

interface AICoachProps {
  profile: UserProfile;
  stats: DailyStats;
  isDark: boolean;
}

export const AICoach: React.FC<AICoachProps> = ({ profile, stats, isDark }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = `lifesteps_coach_chat_${profile.id}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedChat = localStorage.getItem(STORAGE_KEY);
    let initialMessages: ChatMessage[] = [
      {
        role: 'model',
        text: `Olá ${profile.name}! Sou seu LifeSteps Coach. Como posso te ajudar hoje com seu objetivo de ${profile.goal}?`,
        timestamp: new Date().toISOString()
      }
    ];

    if (savedChat) {
      try {
        const { messages: savedMessages, lastUpdated } = JSON.parse(savedChat);
        const lastDate = new Date(lastUpdated).toDateString();
        const today = new Date().toDateString();

        if (lastDate === today) {
          initialMessages = savedMessages;
        }
      } catch (e) {
        console.error("Erro ao carregar histórico do chat:", e);
      }
    }
    setMessages(initialMessages);
  }, [profile.id, profile.name, profile.goal]);

  useEffect(() => {
    if (messages.length > 0) {
      const chatData = {
        messages,
        lastUpdated: new Date().getTime()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatData));
    }
  }, [messages, STORAGE_KEY]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Prepare history for Gemini
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await getCoachResponse(input, history, profile, stats);

    const modelMessage: ChatMessage = {
      role: 'model',
      text: responseText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, modelMessage]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : isDark ? 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none' : 'bg-white text-black/80 border border-black/5 rounded-tl-none'
            }`}>
              <div className="markdown-body text-sm leading-relaxed">
                <Markdown>{msg.text}</Markdown>
              </div>
              <p className={`text-[8px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-2xl rounded-tl-none ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/5'}`}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-transparent">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo ao seu coach..."
            className={`w-full py-4 pl-5 pr-14 rounded-2xl text-sm focus:outline-none transition-all ${
              isDark 
                ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50' 
                : 'bg-white border border-black/10 text-black placeholder:text-black/30 focus:border-blue-500/50 shadow-lg'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
        <p className={`text-[8px] text-center mt-2 uppercase tracking-widest font-black ${isDark ? 'text-white/10' : 'text-black/10'}`}>
          Powered by LifeSteps AI
        </p>
      </div>
    </div>
  );
};
