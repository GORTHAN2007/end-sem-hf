import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Bot, User } from 'lucide-react';

export default function Chatbot({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [{ role: 'assistant', content: 'Hello! Ask me about the ISS or latest news on the dashboard.' }];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you?' }]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => {
      const newMsgs = [...prev, userMsg];
      return newMsgs.slice(-30);
    });
    setInput('');
    setIsTyping(true);

    try {
      const token = import.meta.env.VITE_AI_TOKEN;
      if (!token) throw new Error('VITE_AI_TOKEN is not defined');

      // Prepare context string
      const context = `You are a helpful dashboard assistant. Answer ONLY based on the following data:
      ISS DATA:
      - Location: ${dashboardData.iss?.location?.lat}, ${dashboardData.iss?.location?.lng}
      - Nearest Place: ${dashboardData.iss?.nearestPlace}
      - Speed: ${dashboardData.iss?.speed?.toFixed(2)} km/h
      - People in space: ${dashboardData.iss?.people?.length} (${dashboardData.iss?.people?.map(p => p.name).join(', ')})
      
      NEWS DATA (${dashboardData.news?.articles?.length || 0} articles total):
      ${dashboardData.news?.articles?.slice(0,5).map(a => `- ${a.title} (${a.source?.name})`).join('\n')}
      
      RULES:
      1. ONLY answer using the above data.
      2. If the answer is not in the data, say "I can only answer based on dashboard data and I don't see that info."
      3. Do not guess or use outside knowledge. Keep it concise.`;

      const requestData = {
        model: "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
        messages: [
          { role: "system", content: context },
          { role: "user", content: userMsg.content }
        ],
        max_tokens: 500
      };

      const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error ${res.status}: ${errorText}`);
      }
      
      const result = await res.json();
      let botReply = 'Sorry, I got an unexpected response format.';
      
      if (result.choices && result.choices.length > 0) {
        botReply = result.choices[0].message.content.trim();
      }

      setMessages(prev => {
        const newMsgs = [...prev, { role: 'assistant', content: botReply }];
        return newMsgs.slice(-30);
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMsgs = [...prev, { role: 'assistant', content: `Error: ${err.message}` }];
        return newMsgs.slice(-30);
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-semibold text-sm">Dashboard AI</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="p-1 hover:bg-blue-700 rounded transition" title="Clear Chat">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-blue-700 rounded transition">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900/50 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Bot size={14} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ISS or News..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition border border-transparent dark:border-gray-600"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
