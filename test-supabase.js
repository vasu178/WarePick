import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, 'frontend/.env.local') });
dotenv.config({ path: path.resolve(__dirname, 'frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aknrtommtjrwyskwxepg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.log('Missing VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Orders Table Read...');
  const { data, error } = await supabase.from('orders').select('*').limit(5);
  
  if (error) {
    console.error('Error fetching orders:', error.message, error.details, error.hint);
  } else {
    console.log('Successfully fetched orders:', data.length);
    console.log(data);
  }
}

test();
