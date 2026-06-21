import { useState, useCallback, useEffect, useRef } from 'react';
import { Warehouse, LogOut, Wifi, WifiOff } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useRealtimeTable, useBroadcast } from './hooks/useWarePick';
import WarehouseFloor from './components/WarehouseFloor';
import OrderPanel from './components/OrderPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import LoginForm from './components/LoginForm';

export default function App() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const botPositionsRef = useRef({});

  // Auth
  const handleLogin = useCallback((u) => setUser(u), []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Real-time data from Supabase CDC
  const { data: orders } = useRealtimeTable('orders', { orderBy: 'created_at', ascending: false, limit: 50 });
  const { data: bots } = useRealtimeTable('bots', { orderBy: 'bot_code', ascending: true });
  const { data: inventory } = useRealtimeTable('inventory', { orderBy: 'sku', ascending: true });

  // Broadcast bot positions (ephemeral, high-frequency)
  const { lastMessage: lastBotPos } = useBroadcast('warehouse-floor', 'bot.position_updated');

  // Update ref with latest broadcast positions
  useEffect(() => {
    if (lastBotPos?.botId) {
      botPositionsRef.current = {
        ...botPositionsRef.current,
        [lastBotPos.botId]: lastBotPos,
      };
    }
  }, [lastBotPos]);

  // Track connection status
  useEffect(() => {
    // Simple approach: if we have bot data, we're connected
    setConnected(bots.length > 0);
  }, [bots]);

  // Count orders by status for statusbar
  const orderCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <div className="header__logo-icon">
            <Warehouse size={16} />
          </div>
          <span>WarePick</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            Command Center
          </span>
        </div>

        <div className="header__status">
          <div className="connection-indicator">
            {connected ? (
              <>
                <div className="connection-indicator__dot connection-indicator__dot--connected" />
                <span style={{ color: 'var(--status-success)' }}>Connected</span>
              </>
            ) : (
              <>
                <div className="connection-indicator__dot connection-indicator__dot--disconnected" />
                <span style={{ color: 'var(--status-error)' }}>Disconnected</span>
              </>
            )}
          </div>

          <div className="header__auth">
            <span className="text-xs text-muted">{user.email}</span>
            <button className="btn btn--sm" onClick={handleLogout} title="Sign Out">
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="command-center">
        {/* Left Panel — Orders */}
        <OrderPanel orders={orders} />

        {/* Center — Warehouse Floor */}
        <div className="main-viewport">
          <WarehouseFloor
            bots={bots}
            botPositions={botPositionsRef.current}
          />
        </div>

        {/* Right Panel — Analytics */}
        <AnalyticsPanel bots={bots} inventory={inventory} />
      </main>

      {/* Status Bar */}
      <footer className="statusbar">
        <div className="flex items-center gap-2">
          <span>🟢 {bots.filter(b => b.status === 'idle').length} idle</span>
          <span>🔵 {bots.filter(b => ['picking', 'assigned'].includes(b.status)).length} active</span>
          <span>🟠 {bots.filter(b => b.status === 'returning').length} returning</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📦 {orderCounts.created || 0} new</span>
          <span>⏳ {(orderCounts.checking_inventory || 0) + (orderCounts.picking || 0) + (orderCounts.waiting_for_bot || 0)} processing</span>
          <span>✅ {orderCounts.shipped || 0} shipped</span>
          <span>❌ {orderCounts.inventory_failed || 0} failed</span>
        </div>
        <div>
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </footer>
    </div>
  );
}
