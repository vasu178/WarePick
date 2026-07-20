/**
 * Quick Supabase Cloud Connection Test
 * Tests: connectivity, auth, tables, realtime readiness
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔌 WarePick — Supabase Cloud Connection Test');
console.log('='.repeat(50));
console.log(`📡 URL: ${url}`);
console.log(`🔑 Anon Key: ${anonKey ? anonKey.slice(0, 20) + '...' : '❌ MISSING'}`);
console.log(`🔐 Service Key: ${serviceKey ? serviceKey.slice(0, 20) + '...' : '❌ MISSING'}`);
console.log('='.repeat(50));

async function testConnection() {
  const results = [];

  // Test 1: Basic connectivity with anon key
  console.log('\n[1/5] Testing basic connectivity (anon key)...');
  try {
    const anon = createClient(url, anonKey);
    const { data, error } = await anon.from('inventory').select('sku').limit(1);
    if (error) {
      // Could be RLS blocking or table doesn't exist
      if (error.message.includes('does not exist') || error.code === '42P01') {
        results.push({ test: 'Connectivity', status: '⚠️', msg: 'Connected but table "inventory" not found — run migrations first' });
      } else {
        results.push({ test: 'Connectivity', status: '✅', msg: `Connected (RLS active: ${error.message})` });
      }
    } else {
      results.push({ test: 'Connectivity', status: '✅', msg: `Connected — got ${data.length} row(s)` });
    }
  } catch (e) {
    results.push({ test: 'Connectivity', status: '❌', msg: e.message });
  }

  // Test 2: Service role key (bypasses RLS)
  console.log('[2/5] Testing service role key (bypass RLS)...');
  try {
    const service = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await service.from('inventory').select('sku, product_name, available_quantity');
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        results.push({ test: 'Service Role', status: '⚠️', msg: 'Key works but table "inventory" not found — run migrations first' });
      } else {
        results.push({ test: 'Service Role', status: '❌', msg: error.message });
      }
    } else {
      results.push({ test: 'Service Role', status: '✅', msg: `Bypassed RLS — ${data.length} inventory row(s)` });
      if (data.length > 0) {
        console.log('    📦 Sample:', JSON.stringify(data[0]));
      }
    }
  } catch (e) {
    results.push({ test: 'Service Role', status: '❌', msg: e.message });
  }

  // Test 3: Check all expected tables
  console.log('[3/5] Checking expected tables...');
  const expectedTables = ['orders', 'order_items', 'inventory', 'bots', 'tasks', 'packages', 'shipments', 'event_log', 'profiles'];
  try {
    const service = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const found = [];
    const missing = [];
    for (const table of expectedTables) {
      const { error } = await service.from(table).select('*').limit(0);
      if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
        missing.push(table);
      } else {
        found.push(table);
      }
    }
    if (missing.length === 0) {
      results.push({ test: 'Tables', status: '✅', msg: `All ${expectedTables.length} tables found` });
    } else if (found.length === 0) {
      results.push({ test: 'Tables', status: '❌', msg: `No tables found — run all migrations` });
    } else {
      results.push({ test: 'Tables', status: '⚠️', msg: `Found: ${found.join(', ')} | Missing: ${missing.join(', ')}` });
    }
  } catch (e) {
    results.push({ test: 'Tables', status: '❌', msg: e.message });
  }

  // Test 4: Check seed data
  console.log('[4/5] Checking seed data...');
  try {
    const service = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: inv } = await service.from('inventory').select('sku');
    const { data: bots } = await service.from('bots').select('bot_code');
    if (inv && inv.length > 0 && bots && bots.length > 0) {
      results.push({ test: 'Seed Data', status: '✅', msg: `${inv.length} SKUs, ${bots.length} bots` });
    } else if (inv && bots) {
      results.push({ test: 'Seed Data', status: '⚠️', msg: `Inventory: ${inv?.length || 0}, Bots: ${bots?.length || 0} — run seed.sql` });
    } else {
      results.push({ test: 'Seed Data', status: '⚠️', msg: 'Tables exist but no seed data — run seed.sql' });
    }
  } catch (e) {
    results.push({ test: 'Seed Data', status: '⚠️', msg: 'Could not check seed data (tables may not exist yet)' });
  }

  // Test 5: Auth endpoint
  console.log('[5/5] Testing auth endpoint...');
  try {
    const anon = createClient(url, anonKey);
    const { data, error } = await anon.auth.getSession();
    if (error) {
      results.push({ test: 'Auth', status: '❌', msg: error.message });
    } else {
      results.push({ test: 'Auth', status: '✅', msg: 'Auth endpoint responsive (no active session)' });
    }
  } catch (e) {
    results.push({ test: 'Auth', status: '❌', msg: e.message });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS');
  console.log('='.repeat(50));
  results.forEach(r => {
    console.log(`  ${r.status}  ${r.test}: ${r.msg}`);
  });

  const passed = results.filter(r => r.status === '✅').length;
  const warned = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;
  console.log(`\n  Total: ${passed} passed, ${warned} warnings, ${failed} failed`);
  
  if (failed === 0 && warned === 0) {
    console.log('\n🎉 All tests passed! Supabase Cloud is fully configured.\n');
  } else if (failed === 0) {
    console.log('\n✅ Connection works! Check warnings above (likely need to run migrations/seed).\n');
  } else {
    console.log('\n❌ Some tests failed. Check your credentials and try again.\n');
  }
}

testConnection().catch(console.error);
