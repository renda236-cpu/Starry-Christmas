import React, { useState } from 'react';
import html2canvas from 'html2canvas';

interface ControlsProps {
  onTriggerFirework: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onTriggerFirework }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        backgroundColor: '#020205',
        useCORS: true,
        allowTaint: true,
        ignoreElements: (el) => el.id === 'ui-controls', // Don't capture the buttons
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `GlimmeringNightfall_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Screenshot failed", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    // 布局修正：
    // top-[35%] right-[8%] flex-col: 
    // 让按钮组在右侧垂直居中偏上的位置，垂直排列(flex-col)，符合"对称放到右边"的感觉
    <div id="ui-controls" className="absolute top-[35%] right-[8%] z-[999] flex flex-col gap-6 items-center">
      
      {/* Capture Button */}
      <button 
        onClick={handleCapture}
        disabled={isCapturing}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
        title="保存这瞬间"
      >
        {isCapturing ? (
           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        )}
      </button>

      {/* Firework Trigger Button */}
      <button
        onClick={onTriggerFirework}
        className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 overflow-hidden p-1 hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all active:scale-90 duration-300"
        title="点亮烟火"
      >
        <img
          src="/my-trigger-icon.png"
          alt="点亮烟火"
          className="w-full h-full object-cover rounded-full"
        />
      </button>
    </div>
  );
};

export default Controls;