import { useEffect, useState } from 'react';

export default function Footer() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s} UTC`);
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-margin h-8 bg-surface-container-lowest border-t border-outline-variant text-on-surface-variant font-data-mono text-data-mono">
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">WarePick Simulator © 2024</span>
      <div className="flex gap-stack-lg">
        <span className="hover:text-primary transition-colors cursor-default opacity-80 hover:opacity-100 flex items-center gap-unit">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          System: WebSocket Connected
        </span>
        <span className="hover:text-primary transition-colors cursor-default opacity-80 hover:opacity-100">
          Time: <span>{timeStr}</span>
        </span>
      </div>
    </footer>
  );
}
