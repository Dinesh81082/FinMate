import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

export const AiAssistant: React.FC = () => {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'ai',
      text: `### 👋 Hello! I am FinMate AI, your intelligent financial co-pilot.\n\nI have live access to your transactions, budget records, and cash flow history. How can I help optimize your wealth today?\n\n*Try clicking one of the suggested prompts below!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const suggestedPrompts = [
    "Where did I spend the most?",
    "Analyze my expenses.",
    "Give me saving tips.",
    "Create a budget."
  ];

  const handleSendMessage = async (promptText?: string) => {
    const queryToUse = promptText || input;
    if (!queryToUse.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: queryToUse.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: queryToUse.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          sender: 'ai',
          text: data.reply || "I couldn't process your request.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSimulated: data.isSimulated
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errMsg: ChatMessage = {
          id: `msg_${Date.now()}_err`,
          sender: 'ai',
          text: "⚠️ **Error**: Could not connect to Gemini AI backend service.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } catch (err) {
      const netErr: ChatMessage = {
        id: `msg_${Date.now()}_net`,
        sender: 'ai',
        text: "⚠️ **Network Failure**: Please verify your internet connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, netErr]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              FinMate AI Co-Pilot
              <span className="bg-indigo-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Gemini 3.5</span>
            </h1>
            <p className="text-xs text-indigo-200 opacity-80">Instant contextual financial analysis & wealth optimization</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Scroll Canvas */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-bold uppercase text-slate-500">
                {m.sender === 'user' ? 'You' : '✨ FinMate AI'}
              </span>
              <span className="text-[10px] text-slate-400">{m.timestamp}</span>
            </div>

            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              {m.sender === 'user' ? (
                <p>{m.text}</p>
              ) : (
                <div className="markdown-body prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center gap-3 mr-auto bg-white p-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm max-w-xs">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center animate-pulse">
              ✨
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-semibold text-slate-400">Analyzing transactions...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts Rail */}
      <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-xs font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
          💡 Suggestions:
        </span>
        {suggestedPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 px-3 py-1.5 rounded-full font-medium transition border border-transparent shrink-0 whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box Footer */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-3 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask AI anything about your spending, budgets, or savings tips..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-100 border border-transparent rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 text-sm"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
