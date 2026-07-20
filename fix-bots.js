import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, 'frontend/.env.local') });
dotenv.config({ path: path.resolve(__dirname, 'frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fix() {
  const updates = [
    { bot_code: 'BOT-01', x_position: 2, y_position: 1 },
    { bot_code: 'BOT-02', x_position: 6, y_position: 1 },
    { bot_code: 'BOT-03', x_position: 10, y_position: 1 },
    { bot_code: 'BOT-04', x_position: 14, y_position: 1 },
    { bot_code: 'BOT-05', x_position: 18, y_position: 1 },
  ];

  for (const bot of updates) {
    const { error } = await supabase
      .from('bots')
      .update({ x_position: bot.x_position, y_position: bot.y_position })
      .eq('bot_code', bot.bot_code);
    
    if (error) {
      console.error('Error updating', bot.bot_code, error.message);
    } else {
      console.log('Updated', bot.bot_code);
    }
  }
}

fix();
