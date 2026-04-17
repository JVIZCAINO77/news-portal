'use client';
import { useEffect, useState } from 'react';

export default function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setCompletion(
          Number((currentProgress / scrollHeight).toFixed(2)) * 100
        );
      }
    };

    window.addEventListener('scroll', updateScrollCompletion);

    return () => {
      window.removeEventListener('scroll', updateScrollCompletion);
    };
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-full h-[3px] z-[120] pointer-events-none transition-all duration-300"
      style={{ transform: `translateX(${completion - 100}%)` }}
    >
      <div className="w-full h-full bg-red-600 relative">
        {/* Glow Sparkle at the end */}
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/60 blur-[2px]"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-400 blur-[4px] rounded-full"></div>
      </div>
    </div>
  );
}
