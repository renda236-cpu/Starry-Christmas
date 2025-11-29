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
      loop: true,   // --- 完美保留：循环播放 ---
      volume: 0.5,
      html5: false, // --- 必须修改：改为 false 以解决手机端播放不稳定的问题 ---
      preload: true,
    });

    return () => {
      audioRef.current?.unload();
    };
  }, []);

  const handleStartMusic = () => {
    // 点击按钮直接播放，没有淡入，没有静音
    if (audioRef.current && !audioRef.current.playing()) {
      audioRef.current.play();
    }
  };

  const handleIntroComplete = (name: string) => {
    setUserName(name);
    // 之前这里的播放逻辑已移动到 handleStartMusic，这里只负责切换场景
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
            <IntroScreen 
              onComplete={handleIntroComplete} 
              onUserInteract={handleStartMusic} 
            />
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