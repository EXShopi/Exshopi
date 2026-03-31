import React, { useState } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, ArrowRight, ShoppingBag, HelpCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
export function WhatsAppButton() {
  const phoneNumber = "+971522608063"; // Placeholder UAE number
  const message = "Hello ExShopi! I'm interested in your products.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition"    >
<img
  src="public/Banners/call.png"
  alt="WhatsApp"
  className="w-10 h-10 group-hover:scale-110 transition rounded-full flex items-center justify-center"
  
/>      <div className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-xl text-xs font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-100">
        Chat on WhatsApp
      </div>
    </motion.a>
  );
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: "Hello! I'm ExShopi AI. How can I help you today in UAE?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let botResponse = "I'm here to help! You can ask about delivery, returns, or product recommendations.";
      
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('delivery')) {
        botResponse = "We offer Same Day Delivery in Dubai, Sharjah, and Ajman. Next Day Delivery for other Emirates!";
      } else if (lowerInput.includes('return')) {
        botResponse = "We have a 15-day easy return policy for all verified products.";
      } else if (lowerInput.includes('laptop')) {
        botResponse = "We are the best place for affordable laptops in UAE! Check our 'Refurbished Laptops' section for great deals.";
      } else if (lowerInput.includes('order')) {
        botResponse = "You can track your order in the 'Account' section. Just enter your Order ID.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  const quickActions = [
    { text: "Track my order", icon: ShoppingBag },
    { text: "Delivery info", icon: Phone },
    { text: "Return policy", icon: HelpCircle },
    { text: "Talk to human", icon: User }
  ];

  return (
    <>
      <motion.button
  onClick={() => setIsOpen(true)}
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  whileHover={{ scale: 1.15, rotate: 5 }}
  whileTap={{ scale: 0.9 }}
  className="fixed bottom-24 right-6 z-50 w-14 h-14 
  bg-violet-600 text-white rounded-full 
  flex items-center justify-center 
  shadow-[0_0_25px_rgba(139,92,246,0.6)] 
  hover:bg-violet-700 transition duration-300"
>
  <Bot size={26} />
</motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">ExShopi AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online Support</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                    msg.type === 'user' 
                      ? 'bg-violet-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 overflow-x-auto flex gap-3 custom-scrollbar no-scrollbar">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(action.text);
                    handleSend();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 rounded-xl whitespace-nowrap transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-violet-600 group"
                >
                  <action.icon size={14} className="group-hover:scale-110 transition-transform" />
                  {action.text}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-bold"
              />
              <button
                type="submit"
                className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-violet-600 transition-all active:scale-90 shadow-lg shadow-slate-900/10"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
