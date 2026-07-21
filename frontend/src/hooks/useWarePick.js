import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, API_BASE } from '../lib/supabase';

/**
 * Subscribe to Supabase Realtime changes on a table.
 * Returns current data and updates automatically on INSERT/UPDATE/DELETE.
 */
export function useRealtimeTable(tableName, options = {}) {
  const { select = '*', orderBy = 'created_at', ascending = false, limit = 100, filter, pk = 'id' } = options;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from(tableName).select(select).order(orderBy, { ascending }).limit(limit);
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    query.then(({ data: initial, error }) => {
      if (!error && initial) setData(initial);
      setLoading(false);
    });

    const channel = supabase
      .channel(`rt-${tableName}-${JSON.stringify(filter || {})}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        setData((prev) => {
          if (payload.eventType === 'INSERT') {
            if (select !== '*') {
              setTimeout(() => {
                supabase.from(tableName).select(select).eq(pk, payload.new[pk]).single().then(({ data }) => {
                  if (data) {
                    setData((current) => current.map((r) => (r[pk] === data[pk] ? data : r)));
                  }
                });
              }, 500);
            }
            return [payload.new, ...prev].slice(0, limit);
          }
          if (payload.eventType === 'UPDATE') {
            return prev.map((row) => (row[pk] === payload.new[pk] ? { ...row, ...payload.new } : row));
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((row) => row[pk] !== payload.old[pk]);
          }
          return prev;
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tableName, select, orderBy, ascending, limit, JSON.stringify(filter)]);

  return { data, loading };
}

/**
 * Subscribe to Supabase Broadcast channel for ephemeral bot position updates.
 */
export function useBroadcast(channelName, eventName) {
  const [lastMessage, setLastMessage] = useState(null);
  const stateRef = useRef({});

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: eventName }, ({ payload }) => {
        setLastMessage(payload);
        if (payload.botId) {
          stateRef.current = { ...stateRef.current, [payload.botId]: payload };
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [channelName, eventName]);

  return { lastMessage, stateMap: stateRef.current };
}

/**
 * System-level broadcast events (from analytics service).
 */
export function useSystemEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel('system')
      .on('broadcast', { event: 'system.event' }, ({ payload }) => {
        setEvents((prev) => [payload, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return events;
}

/**
 * Fetch analytics summary from the analytics service.
 */
export function useAnalytics(refreshInterval = 5000) {
  const [summary, setSummary] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const analyticsBase = import.meta.env.VITE_ANALYTICS_BASE_URL || 'http://localhost:3007';
      const res = await fetch(`${analyticsBase}/analytics/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      // silently ignore — service may not be up
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchSummary, refreshInterval]);

  return summary;
}

/**
 * API helper for order operations.
 */
export function useOrderAPI() {
  const [loading, setLoading] = useState(false);

  const createDemoOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/demo`, { method: 'POST' });
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const createBatchOrders = async (count = 10) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/demo/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/reset`, { method: 'POST' });
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  return { createDemoOrder, createBatchOrders, createOrder, resetSystem, loading };
}
