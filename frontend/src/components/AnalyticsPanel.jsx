import { useAnalytics, useSystemEvents } from '../hooks/useWarePick';
import { Activity, Bot, Package, Truck } from 'lucide-react';

/**
 * AnalyticsPanel — Right panel with KPIs, bot status, inventory levels, and event feed.
 */
export default function AnalyticsPanel({ bots = [], inventory = [] }) {
  const summary = useAnalytics(4000);
  const systemEvents = useSystemEvents();

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getEventIcon = (eventName) => {
    if (!eventName) return '📋';
    if (eventName.includes('order')) return '📦';
    if (eventName.includes('inventory')) return '📊';
    if (eventName.includes('task')) return '🎯';
    if (eventName.includes('bot')) return '🤖';
    if (eventName.includes('package')) return '📋';
    if (eventName.includes('shipment')) return '🚚';
    return '📋';
  };

  return (
    <div className="panel panel--right">
      {/* KPI Cards */}
      <div>
        <div className="section-header">Key Metrics</div>
        <div className="kpi-grid" style={{ marginTop: 8 }}>
          <div className="kpi-card">
            <span className="kpi-card__label"><Package size={10} /> Total Orders</span>
            <span className="kpi-card__value kpi-card__value--info">{summary?.orders?.total ?? '-'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-card__label"><Truck size={10} /> Shipped</span>
            <span className="kpi-card__value kpi-card__value--success">{summary?.orders?.shipped ?? '-'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-card__label"><Activity size={10} /> In Progress</span>
            <span className="kpi-card__value kpi-card__value--warning">{summary?.orders?.inProgress ?? '-'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-card__label"><Bot size={10} /> Active Bots</span>
            <span className="kpi-card__value">{summary?.bots?.active ?? '-'}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/{summary?.bots?.total ?? '?'}</span></span>
          </div>
        </div>
      </div>

      {/* Bot Status */}
      <div>
        <div className="section-header">Bot Fleet</div>
        <div className="bot-status-list" style={{ marginTop: 4 }}>
          {bots.map((bot) => (
            <div key={bot.id} className="bot-status-item">
              <div className={`bot-status-item__dot bot-status-item__dot--${bot.status}`} />
              <span className="bot-status-item__code">{bot.bot_code}</span>
              <span className="bot-status-item__status">{bot.status}</span>
            </div>
          ))}
          {bots.length === 0 && <div className="text-muted text-xs">No bots connected</div>}
        </div>
      </div>

      {/* Inventory Levels */}
      <div>
        <div className="section-header">Inventory</div>
        <div className="inventory-bar" style={{ marginTop: 4 }}>
          {inventory.map((item) => {
            const maxQty = item.available_quantity + item.reserved_quantity;
            const pct = maxQty > 0 ? (item.available_quantity / maxQty) * 100 : 0;
            const fillClass = pct <= 20 ? 'inventory-item__fill--critical' : pct <= 50 ? 'inventory-item__fill--low' : '';
            return (
              <div key={item.sku} className="inventory-item">
                <span className="inventory-item__name" title={item.product_name}>
                  {item.product_name}
                </span>
                <div className="inventory-item__bar">
                  <div className={`inventory-item__fill ${fillClass}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="inventory-item__qty">{item.available_quantity}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Feed */}
      <div>
        <div className="section-header">Live Events</div>
        <div className="event-feed" style={{ marginTop: 4 }}>
          {systemEvents.length === 0 && (
            <div className="text-muted text-xs" style={{ textAlign: 'center', padding: 12 }}>
              Waiting for events...
            </div>
          )}
          {systemEvents.map((event, idx) => (
            <div key={idx} className="event-item">
              <span className="event-item__time">{formatTime(event.timestamp)}</span>
              <span>{getEventIcon(event.eventName)}</span>
              <div>
                <div className="event-item__name">{event.eventName}</div>
                <div className="event-item__detail">
                  {event.data?.orderId && `Order ${event.data.orderId.slice(0, 8)}`}
                  {event.data?.botCode && ` • ${event.data.botCode}`}
                  {event.data?.trackingId && ` • ${event.data.trackingId}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
