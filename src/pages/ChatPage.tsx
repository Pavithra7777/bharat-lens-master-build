import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { useApp } from '../lib/AppContext';
import db from '../lib/db';
import { ai, type ChatMessage } from '@doable/ai';

export function ChatPage() {
  const { profile } = useApp();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history from Supabase on mount
  useEffect(() => {
    if (!profile?.id) return;
    loadHistory();
  }, [profile?.id]);

  async function loadHistory() {
    try {
      const sessions = await db.getChatSessions();
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1]; if (!lastSession) return;
        const history = await db.getChatMessages(lastSession.id);
        if (history.length > 0) {
          setMessages(
            history.map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          );
        }
      }
    } catch (e) {
      // No history yet
    }
  }

  async function handleSend() {
    if (!input.trim() || !profile?.id || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Save user message
      await db.addChatMessage({
        session_id: 'main',
        role: 'user',
        content: userMessage,
      });

      // Build context from saved schemes/vault for smarter answers
      const schemes = await db.getSchemes();
      const contextSchemes = schemes.slice(0, 10);

      const systemMsg: ChatMessage = {
        role: 'system',
        content: `You are Bharat Lens assistant — a helpful guide for Indian government schemes. The user is in ${profile?.state || 'India'} (${profile?.language || 'English'} preferred). You have access to ${contextSchemes.length} schemes. Key schemes: ${contextSchemes.map((s: any) => `${s.name}: ${s.description}`).join(' | ')}. Answer in ${profile?.language || 'English'}, be concise, and suggest relevant schemes.`,
      };

      const history: ChatMessage[] = [
        systemMsg,
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: userMessage },
      ];

      let reply = '';
      for await (const token of ai.chat(history)) {
        reply += token;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      await db.addChatMessage({ session_id: 'main', role: 'assistant', content: reply });
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function speakMessage(text: string) {
    try {
      setSpeaking(true);
      const { createDoableClient } = await import('@doable/sdk');
      const doable = createDoableClient();
      await doable.voice.speak(text);
    } catch (e) {
      if (e?.code !== 'PGRST205') console.error('TTS error:', e);
    } finally {
      setSpeaking(false);
    }
  }

  function newChat() {
    setMessages([]);
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">AI Scheme Advisor</h1>
              <p className="text-white/60 text-sm">Ask about government schemes in your language</p>
            </div>
          </div>
          <button
            onClick={newChat}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1B3A6B]/10 mb-4">
              <Bot className="w-8 h-8 text-[#1B3A6B]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">Welcome to Bharat Lens AI</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Ask me about government schemes you're eligible for, application processes, documents needed, or anything else!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-[#1B3A6B]' : 'bg-[#10B981]'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#1B3A6B] text-white rounded-tr-md'
                : 'bg-white text-[#1A1A2E] rounded-tl-md shadow-sm border border-gray-100'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speakMessage(msg.content)}
                  className="mt-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" /> Listen
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
              <Loader2 className="w-5 h-5 animate-spin text-[#1B3A6B]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about schemes, eligibility, documents..."
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-[#1B3A6B] text-white flex items-center justify-center hover:bg-[#2A4A8B] transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Powered by AI • For informational purposes only
        </p>
      </div>
    </div>
  );
}
