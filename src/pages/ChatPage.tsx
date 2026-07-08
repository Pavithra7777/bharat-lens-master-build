import { useState, useEffect, useRef } from 'react';
import { ai } from '@doable/ai';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { useRouter } from '../lib/Router';
import { t } from '../lib/i18n';
import { Send, Mic, Plus, MessageCircle, Trash2, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useApp();
  const { navigate } = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadSessions() {
    // In production, load from db
  }

  async function loadMessages(sessionId: string) {
    // In production, load from db
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSend() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    
    setLoading(true);

    try {
      // Build context for AI
      const systemPrompt = `You are Bharat Lens AI, a helpful assistant for Indian government services.
Answer in a friendly, clear manner. Help citizens understand government schemes, documents, and processes.
Always suggest verifying information from official government sources when appropriate.
Keep responses concise but informative. Use simple language accessible to all education levels.
Current language preference: ${language}`;

      let reply = '';
      
      try {
        // Call Doable AI
        for await (const token of ai.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ])) {
          reply += token;
        }
      } catch (aiError) {
        // Fallback response if AI fails
        reply = `I understand you're asking about: "${userMessage}". As Bharat Lens, I can help you with:\n\n• Finding government schemes you qualify for\n• Understanding documents like Aadhaar, PAN, etc.\n• Guidance on application processes\n• Checking for scams\n\nFor specific scheme information, try using the Schemes tab to browse verified government programs.`;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function startNewChat() {
    setMessages([]);
    setCurrentSessionId(null);
  }

  // Text-to-Speech for reading responses
  function speakMessage(content: string) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = language === 'en' ? 'en-IN' : language;
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  function startListening() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'en' ? 'en-IN' : language;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Bharat Lens AI
            </h1>
            <p className="text-white/70 text-sm">Ask about government services in any language</p>
          </div>
          <button
            onClick={startNewChat}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-[#1B3A6B]" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">How can I help you?</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Ask me about government schemes, document requirements, application processes, or anything else!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Find schemes for farmers', 'What documents for passport?', 'Check a suspicious message', 'Explain my Aadhaar'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setMessage(suggestion)}
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#1B3A6B] text-white rounded-br-md'
                  : 'bg-white border border-gray-100 rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakMessage(msg.content)}
                  className="mt-2 text-xs text-[#1B3A6B] hover:text-[#2A4A8B] flex items-center gap-1"
                >
                  {isSpeaking ? '🔊 Stop' : '🔊 Listen'}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about government schemes..."
              className="w-full px-4 py-3 bg-gray-100 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#1B3A6B] transition"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              isListening
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="w-12 h-12 bg-[#1B3A6B] text-white rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2 text-center">
          AI responses are for guidance only. Always verify with official sources.
        </p>
      </div>
    </div>
  );
}
