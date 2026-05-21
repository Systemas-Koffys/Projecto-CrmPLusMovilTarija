require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  try {
    const { data: usersRoles, error: err1 } = await supabase.from('users_roles').select('*').limit(1);
    console.log('users_roles:', { data: usersRoles, error: err1 });

    const { data: rolesDeUsuarios, error: err2 } = await supabase.from('roles_de_usuarios').select('*').limit(1);
    console.log('roles_de_usuarios:', { data: rolesDeUsuarios, error: err2 });
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
