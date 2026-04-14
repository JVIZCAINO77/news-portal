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
      className="fixed top-0 left-0 w-full h-1 z-[110] pointer-events-none"
      style={{ transform: `translateX(${completion - 100}%)` }}
    >
      <div className="w-full h-full bg-red-600 transition-transform duration-100 ease-out shadow-[0_0_10px_rgba(187,27,33,0.5)]"></div>
    </div>
  );
}
