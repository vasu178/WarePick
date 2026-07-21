const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function revertInventory() {
  console.log("Reverting inventory locations in cloud Supabase...");

  await supabase.from('inventory').update({ shelf_code: 'B1' }).eq('sku', 'SKU-1003');
  await supabase.from('inventory').update({ shelf_code: 'B2' }).eq('sku', 'SKU-1004');
  await supabase.from('inventory').update({ shelf_code: 'C1' }).eq('sku', 'SKU-1005');
  await supabase.from('inventory').update({ shelf_code: 'C2' }).eq('sku', 'SKU-1006');

  const { data: allInventory, error: errFetch } = await supabase.from('inventory').select('*');
  if (!errFetch) {
      console.table(allInventory.map(i => ({ sku: i.sku, name: i.product_name, shelf: i.shelf_code })));
  }

  console.log("Database revert complete!");
}

revertInventory();
