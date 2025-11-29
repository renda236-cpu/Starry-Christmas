import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroScreenProps {
  onComplete: (name: string) => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  // Step 0: Typing Intro Text
  // Step 1: Input Name
  // Step 2: Transition Text (Waiting)
  // Step 3: Transition Text (Typing)
  const [step, setStep] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState('');
  const [name, setName] = useState('');
  
  // Phase 1 text
  const introText = "旧岁将尽，这一年的故事即将封箱。\n在翻开全新日历的那个瞬间，我想知道，该写下哪个名字，才能确信明年的风雪都有人共担？";
  // Phase 2 text (Literal X as requested, no substitution)
  const transitionText = "不妨就这样，就跟着 X的步伐，\n踩着季节细碎的落叶与初雪，不慌不忙，一起走向那温暖而充满希冀的岁末。";

  // Ref to handle intervals securely across renders
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let targetText = '';
    let shouldType = false;

    if (step === 0) {
      targetText = introText;
      shouldType = true;
    } else if (step === 3) {
      targetText = transitionText;
      shouldType = true;
    }

    if (shouldType) {
      setDisplayedText(''); // Clear text before starting
      let index = 0;
      
      // Clear any existing interval just in case
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      typingIntervalRef.current = setInterval(() => {
        // Use functional state update to ensure we don't miss chars
        // However, simple index closure is often safer for typewriter
        const char = targetText.charAt(index);
        setDisplayedText((prev) => prev + char);
        index++;

        if (index >= targetText.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          
          // Completion logic
          if (step === 0) {
            setStep(1);
          } else if (step === 3) {
            setTimeout(() => {
              onComplete(name);
            }, 2500);
          }
        }
      }, 100);
    }

    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [step]); // Only re-run when step changes

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    setStep(2); // Move to intermediate state to hide input
    
    // Slight delay before starting the transition text typing
    setTimeout(() => {
        setStep(3); // Start typing transition text
    }, 500);
  };

  return (
    // Added a gradient overlay to make text readable against the 3D tree
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] text-white p-8 transition-colors duration-1000">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Gradient Text for the typewriter effect */}
        {/* Only show text in steps 0 and 3. Step 1 shows introText (static) or stays. 
            Actually, step 1 is input phase. We keep the intro text visible? 
            The previous logic cleared it when typing started. 
            Let's keep displayedText visible. 
        */}
        {(step === 0 || step === 3) && (
            <div className="min-h-[120px] text-xl md:text-2xl font-light leading-loose whitespace-pre-wrap cursor font-serif
            text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-pink-100 to-cyan-100 drop-shadow-sm
            ">
            {displayedText}
            </div>
        )}
        
        {/* During step 1, we might want to keep the full intro text visible above the input, 
            or just let it sit there. The useEffect for step 0 finishes and sets step 1.
            The displayedText state holds the full text. So it stays visible. 
        */}
        {(step === 1 || step === 2) && (
             <div className="min-h-[120px] text-xl md:text-2xl font-light leading-loose whitespace-pre-wrap font-serif
             text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-pink-100 to-cyan-100 drop-shadow-sm
             ">
             {introText}
             </div>
        )}

        <AnimatePresence>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6"
            >
              <input
                type="text"
                maxLength={10}
                placeholder="在此输入名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  bg-transparent border-b-2 border-white/20 text-center text-2xl py-3 
                  focus:outline-none focus:border-cyan-300 transition-all 
                  placeholder-white/20 w-56 font-serif
                  text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200
                "
                autoFocus
              />
              
              {/* Enhanced Glassmorphism Button */}
              <button
                onClick={handleNameSubmit}
                disabled={!name.trim()}
                className="
                  group relative mt-6 px-8 py-3 rounded-full 
                  bg-white/10 backdrop-blur-md border border-white/30
                  shadow-[0_0_20px_rgba(255,255,255,0.1)]
                  hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]
                  hover:bg-white/20 hover:scale-105 active:scale-95
                  transition-all duration-300 ease-out
                  disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed
                "
              >
                <div className="flex items-center gap-2 text-white/90">
                  <span className="font-serif tracking-widest text-lg">确认</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
                {/* Inner Glow Ring */}
                <div className="absolute inset-0 rounded-full ring-1 ring-white/20 group-hover:ring-white/50 transition-all" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IntroScreen;