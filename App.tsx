import React, { useState, useEffect, useRef } from 'react';
import { AppStage } from './types';
import { Howl } from 'howler';
import IntroScreen from './components/IntroScreen';
import FireworkScene from './components/FireworkScene';
import TextOverlay from './components/TextOverlay';
import Controls from './components/Controls';
import { BGM_URL } from './constants';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.ENTRY);
  const [userName, setUserName] = useState('');
  const [fireworkTrigger, setFireworkTrigger] = useState(0);
  const audioRef = useRef<Howl | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Howl({
      src: [BGM_URL],
      loop: true,
      volume: 0.5,
      html5: true,
      preload: true,
    });

    return () => {
      audioRef.current?.unload();
    };
  }, []);

  const handleIntroComplete = (name: string) => {
    setUserName(name);
    // User interaction has occurred, safe to play audio
    audioRef.current?.play();
    audioRef.current?.fade(0, 0.5, 2000); // Fade in
    setStage(AppStage.IMMERSION);
  };

  const handleManualTrigger = () => {
    setFireworkTrigger(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden">
      
      {/* Background Layer: 3D Scene (Tree always visible) */}
      <FireworkScene 
        triggerSignal={fireworkTrigger} 
        enableFireworks={stage === AppStage.IMMERSION}
      />

      {/* Foreground Layer: UI & Text */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {stage === AppStage.ENTRY && (
          <div className="pointer-events-auto w-full h-full">
            <IntroScreen onComplete={handleIntroComplete} />
          </div>
        )}

        {stage === AppStage.IMMERSION && (
          <>
            <TextOverlay userName={userName} triggerNext={fireworkTrigger} />
            <div className="pointer-events-auto">
              <Controls onTriggerFirework={handleManualTrigger} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;