import { useState, useEffect } from 'react';

/**
 * StatusBar — Fixed bottom footer with connection status and live UTC clock.
 */
export default function StatusBar({ connected }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-margin h-8 bg-surface-container-lowest border-t border-outline-variant text-on-surface-variant font-data-mono text-data-mono">
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
        WarePick Simulator © 2024
      </span>
      <div className="flex gap-stack-lg">
        <span className="hover:text-primary transition-colors cursor-default opacity-80 hover:opacity-100 flex items-center gap-unit">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-secondary' : 'bg-error'}`} />
          System: {connected ? 'WebSocket Connected' : 'Disconnected'}
        </span>
        <span className="hover:text-primary transition-colors cursor-default opacity-80 hover:opacity-100">
          Time: {time}
        </span>
      </div>
    </footer>
  );
}
