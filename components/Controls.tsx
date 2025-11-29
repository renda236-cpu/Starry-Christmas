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
        className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-yellow-200 hover:bg-white/20 hover:text-yellow-100 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all active:scale-90 duration-300"
        title="点亮烟火"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 15.03a.75.75 0 01.721.545l.139.487c.18.63.18 1.256 0 1.886l-.139.487a.75.75 0 01-1.442 0l-.139-.487a3.001 3.001 0 00-2.502-2.062l-.487-.139a.75.75 0 010-1.442l.487-.139a3.003 3.003 0 002.502-2.062l.139-.487a.75.75 0 011.442 0l.139.487c.18.63.18 1.256 0 1.886l-.139.487z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Controls;