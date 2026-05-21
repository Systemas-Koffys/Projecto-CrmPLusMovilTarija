require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  try {
    // Query list of tables using RPC or raw SQL if possible, or just try to get a list
    const { data, error } = await supabase.rpc('get_tables'); // might not exist
    console.log('RPC get_tables:', { data, error });

    // Or select from pg_catalog
    const { data: sqlData, error: sqlError } = await supabase.from('pg_tables').select('*'); // postgrest doesn't expose pg_tables directly unless configured
    console.log('pg_tables:', { data: sqlData, error: sqlError });

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
