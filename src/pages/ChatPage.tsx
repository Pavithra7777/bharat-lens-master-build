import { useState, useEffect, useRef } from 'react';
import { ai } from '@doable/ai';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { useRouter } from '../lib/Router';
import { t, LANGUAGES, type Language } from '../lib/i18n';
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

// Language codes for AI system prompt
const LANGUAGE_NAMES: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  hi: { name: 'Hindi', nativeName: 'हिंदी' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்' },
  te: { name: 'Telugu', nativeName: 'తెలుగు' },
  bn: { name: 'Bengali', nativeName: 'বাংলা' },
  mr: { name: 'Marathi', nativeName: 'मराठी' },
};

// Helper to get language info safely
function getLangInfo(lang: string) {
  return LANGUAGE_NAMES[lang] ?? LANGUAGE_NAMES['en']!;
}

export function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language, profile } = useApp();
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
    setGeneratingAnswer(true);

    try {
      const langInfo = getLangInfo(language);
      const userName = profile?.full_name || 'User';
      const isEnglishUser = language === 'en';
      
      // Build context for AI - bilingual only if preferred language is NOT English
      let systemPrompt: string;
      
      if (isEnglishUser) {
        // User's preferred language is English - respond ONLY in English
        systemPrompt = `You are Bharat Lens AI, a helpful assistant for Indian government services.

IMPORTANT: The user has selected English as their preferred language. Respond ONLY in English.

Answer in a friendly, clear manner. Help citizens understand government schemes, documents, and processes.
Always suggest verifying information from official government sources when appropriate.
Keep responses concise but informative. Use simple language accessible to all education levels.`;
      } else {
        // User's preferred language is NOT English - respond in both their language AND English
        systemPrompt = `You are Bharat Lens AI, a helpful assistant for Indian government services.

CRITICAL INSTRUCTION - BILINGUAL RESPONSE:
The user has selected "${langInfo.nativeName}" (${langInfo.name}) as their preferred language.
You MUST respond in the following format:
1. FIRST, write your entire response in "${langInfo.nativeName}" (the user's preferred language)
2. THEN, write "━━━ English Version ━━━" as a separator
3. AFTER the separator, write the SAME response again in English

Example format:
"नमस्ते! मैं आपकी कैसे सहायता कर सकता हूं। यह भारत लेंस AI है।
━━━ English Version ━━━
Hello! How can I help you. This is Bharat Lens AI."

Keep both versions complete and equivalent. Do not skip the English version.

Answer in a friendly, clear manner. Help citizens understand government schemes, documents, and processes.
Always suggest verifying information from official government sources when appropriate.
Keep responses concise but informative. Use simple language accessible to all education levels.`;
      }

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
        // Fallback response if AI fails - use the selected language
        const fallbackMessages: Record<Language, { main: string; english: string }> = {
          en: { 
            main: `Hello ${userName}! I am Bharat Lens AI. How can I help you?\n\nAsk me about government schemes, documents, and application processes.`, 
            english: '' 
          },
          hi: { 
            main: `नमस्ते ${userName}! मैं भारत लेंस AI हूं। मैं आपकी कैसे सहायता कर सकता हूं?\n\nसरकारी योजनाओं, दस्तावेज़ों और आवेदन प्रक्रियाओं के बारे में जानकारी के लिए मुझसे पूछें।`, 
            english: `━━━ English Version ━━━\nHello ${userName}! I am Bharat Lens AI. How can I help you?\n\nAsk me about government schemes, documents, and application processes.` 
          },
          ta: { 
            main: `வணக்கம் ${userName}! நான் பாரத லென்ஸ் AI ஆவேன். நான் உங்களுக்கு எப்படி உதவ முடியும்?\n\nஅரசு திட்டங்கள், ஆவணங்கள் மற்றும் விண்ணப்ப நடைமுறைகள் பற்றி என்னிடம் கேளுங்கள்.`, 
            english: `━━━ English Version ━━━\nHello ${userName}! I am Bharat Lens AI. How can I help you?\n\nAsk me about government schemes, documents, and application processes.` 
          },
          te: { 
            main: `నమస్కారం ${userName}! నేను భారత్ లెన్స్ AIని. నేను మీకు ఎలా సహాయపడగలను?\n\nప్రభుత్వ పథకాలు, పత్రాలు మరియు అప్లికేషన్ ప్రక్రియల గురించి నన్ను అడగండి.`, 
            english: `━━━ English Version ━━━\nHello ${userName}! I am Bharat Lens AI. How can I help you?\n\nAsk me about government schemes, documents, and application processes.` 
          },
          bn: { 
            main: `নমস্কার ${userName}! আমি ভারত লেন্স AI। আমি কীভাবে আপনাকে সাহায্য করতে পারি?\n\nসরকারি প্রকল্প, নথি এবং আবেদন প্রক্রিয়া সম্পর্কে আমাকে জিজ্ঞাসা করুন।`, 
            english: `━━━ English Version ━━━\nHello ${userName}! I am Bharat Lens AI. How can I help you?\n\nAsk me about government schemes, documents, and application processes.` 
          },
          mr: { 
            main: `नमस्कार ${userName}! मी भारत लेन्स AI आहे. मी आपली कशी मदत करू शकतो?\n\nसरकारी योजना, दस्तऐवज आणि अर्ज प्रक्रिया सर्वंच माहिती विचारा.`, 
            english: `━━━ English Version ━━━\nHello ${userName}! I am Bharat Lens AI. How can I help you?\n\nAsk me about government schemes, documents, and application processes.` 
          },
        };
        
        const fallback = fallbackMessages[language as Language] || fallbackMessages['en']!;
        reply = fallback.main + (fallback.english ? '\n' + fallback.english : '');
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
      const errorMessages: Record<Language, string> = {
        en: 'Something went wrong. Please try again.',
        hi: 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।\n━━━ English Version ━━━\nSomething went wrong. Please try again.',
        ta: 'ஏதோ தவறு ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.\n━━━ English Version ━━━\nSomething went wrong. Please try again.',
        te: 'ఏదో తప్పు జరిగింది.దయచేసి మళ్ళీ ప్రయత్నించండి.\n━━━ English Version ━━━\nSomething went wrong. Please try again.',
        bn: 'কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\n━━━ English Version ━━━\nSomething went wrong. Please try again.',
        mr: 'काहीतरी चूक झाली। कृपया पुन्हा प्रयत्न करा.\n━━━ English Version ━━━\nSomething went wrong. Please try again.',
      };
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessages[language as Language] || errorMessages['en']!,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setGeneratingAnswer(false);
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

  const langInfo = getLangInfo(language);
  const isEnglishUser = language === 'en';
  
  // Get localized suggestions based on language
  const suggestions = [
    t('chat.suggestion1', language as Language),
    t('chat.suggestion2', language as Language),
    t('chat.suggestion3', language as Language),
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              {t('chat.title', language as Language)}
            </h1>
            <p className="text-white/70 text-sm">
              {isEnglishUser
                ? t('chat.replyInEnglish', language as Language)
                : t('chat.replyIn', language as Language).replace('{lang}', langInfo.nativeName)
              }
            </p>
          </div>
          <button
            onClick={startNewChat}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
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
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">{t('chat.howCanIHelp', language as Language)}</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              {t('chat.askAbout', language as Language)}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
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
                  : 'bg-white border border-gray-100 rounded-bl-md shadow-sm'
              }`}
            >
              {msg.role === 'assistant' && !isEnglishUser && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full">
                    {langInfo.nativeName} + English
                  </span>
                </div>
              )}
              {msg.role === 'assistant' && isEnglishUser && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-[#0F9D58]/10 text-[#0F9D58] rounded-full">
                    English
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakMessage(msg.content)}
                  className="mt-2 text-xs text-[#1B3A6B] hover:text-[#2A4A8B] flex items-center gap-1"
                >
                  {isSpeaking ? t('chat.stop', language as Language) : t('chat.listen', language as Language)}
                </button>
              )}
            </div>
          </div>
        ))}

        {generatingAnswer && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-6 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-[#1B3A6B] rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1B3A6B]">
                    {t('chat.generating', language as Language)}
                    <span className="inline-flex ml-0.5">
                      <span className="w-1.5 h-1.5 bg-[#1B3A6B] rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                      <span className="w-1.5 h-1.5 bg-[#1B3A6B] rounded-full animate-bounce ml-0.5" style={{animationDelay:'200ms'}} />
                      <span className="w-1.5 h-1.5 bg-[#1B3A6B] rounded-full animate-bounce ml-0.5" style={{animationDelay:'400ms'}} />
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">{t('chat.pleaseWait', language as Language)}</p>
                </div>
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
              placeholder={t('chat.placeholder', language as Language)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#1B3A6B] transition"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="w-14 h-14 bg-[#1B3A6B] text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2A4A8B] transition shadow-md"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2 text-center">
          {t('chat.aiGuidance', language as Language)}
        </p>
      </div>
    </div>
  );
}
