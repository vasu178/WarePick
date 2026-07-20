import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealtime() {
  console.log('Fetching orders with Service Role Key...');
  const { data: orders, error: oError } = await supabase.from('orders').select('id, status').limit(5);
  
  if (oError) {
    console.error('Error:', oError);
  } else {
    console.log(`Found ${orders.length} orders using Service Key.`);
  }

  console.log('\nChecking if realtime is enabled on orders table...');
  const { data: publications, error: pError } = await supabase.rpc('get_realtime_tables').catch(() => ({ error: 'rpc not found' }));
  if (pError) {
    // try direct query
    const { data: pgPub, error: qError } = await supabase.from('pg_publication_tables').select('*');
    if (qError) {
       console.log('Could not query pg_publication_tables (needs superuser or specific permissions, expected).');
    } else {
       console.log('Publications:', pgPub);
    }
  }
}

checkRealtime();
