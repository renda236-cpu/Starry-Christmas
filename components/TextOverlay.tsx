import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateBlessing, getRandomPosition } from '../utils/helpers';

interface TextOverlayProps {
  userName: string;
  triggerNext: number; 
}

interface Message {
  id: number;
  text: string;
  x: number; // Percent
  y: number; // Percent
}

const TextOverlay: React.FC<TextOverlayProps> = ({ userName, triggerNext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(0);

  const addMessage = () => {
    const text = generateBlessing(userName);
    const { x, y } = getRandomPosition();

    const newMessage: Message = {
      id: nextId.current++,
      text,
      x,
      y,
    };

    setMessages((prev) => {
        // Keep max 8 messages to populate screen more (requested: "存在的可以更多一点")
        const clean = prev.slice(-7);
        return [...clean, newMessage];
    });

    // Auto remove after some time
    setTimeout(() => {
       setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }, 6000); 
  };

  useEffect(() => {
    // Initial message
    addMessage();

    // Spawn faster (800ms) to create a denser atmosphere
    const interval = setInterval(() => {
      addMessage();
    }, 800);

    return () => clearInterval(interval);
  }, [userName]);

  // Handle manual trigger (add extra message)
  useEffect(() => {
    if (triggerNext > 0) {
      addMessage();
    }
  }, [triggerNext]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)', transition: { duration: 1.5 } }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex justify-center w-auto"
            style={{
              top: `${msg.y}%`,
              left: `${msg.x}%`, 
            }}
          >
            {/* The Text Bubble */}
            <div 
                className="
                    relative max-w-[280px] md:max-w-[360px]
                    bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem]
                    px-5 py-4
                    shadow-[0_0_20px_rgba(255,255,255,0.1)]
                "
            >
                <p className="
                    text-base md:text-lg font-serif tracking-wide leading-relaxed text-center font-medium
                    text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200
                    drop-shadow-sm
                ">
                {msg.text}
                </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TextOverlay;