import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useRealtimeTable, useBroadcast } from './hooks/useWarePick';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import WarehouseFloorPage from './pages/WarehouseFloorPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activePage, setActivePage] = useState('floor');
  const [selectedBot, setSelectedBot] = useState(null);
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
    setConnected(bots.length > 0);
  }, [bots]);

  // Show login if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Render active page
  const renderPage = () => {
    switch (activePage) {
      case 'floor':
        return (
          <WarehouseFloorPage
            bots={bots}
            botPositions={botPositionsRef.current}
            orders={orders}
            onBotClick={(id) => setSelectedBot(id)}
          />
        );
      case 'orders':
        return <OrdersPage orders={orders} />;
      case 'inventory':
        return <InventoryPage inventory={inventory} orders={orders} />;
      case 'analytics':
        return <AnalyticsPage bots={bots} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      user={user}
      connected={connected}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppLayout>
  );
}
