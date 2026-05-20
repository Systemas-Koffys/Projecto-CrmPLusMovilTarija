const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/verifyToken');

// Middleware to check if current user is admin
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
};

// Protect all personal routes
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/personal — Get all system users/roles
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users_roles')
      .select('id, email, role, nombre, activo, created_at')
      .order('nombre', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching personal:', err.message);
    res.status(500).json({ error: 'Error al obtener personal' });
  }
});

// POST /api/personal — Register a new system user
router.post('/', async (req, res) => {
  try {
    const { email, role, nombre, activo } = req.body;
    if (!email || !role || !nombre) {
      return res.status(400).json({ error: 'Email, nombre y rol son requeridos' });
    }

    const { data, error } = await supabase
      .from('users_roles')
      .insert([{ email, role, nombre, activo: activo !== false }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique violation
        return res.status(400).json({ error: 'Ya existe un usuario con este correo electrónico.' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating personal:', err.message);
    res.status(500).json({ error: 'Error al registrar personal' });
  }
});

// PUT /api/personal/:id — Update system user details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, nombre, activo } = req.body;

    const { data, error } = await supabase
      .from('users_roles')
      .update({ email, role, nombre, activo })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating personal:', err.message);
    res.status(500).json({ error: 'Error al actualizar personal' });
  }
});

// DELETE /api/personal/:id — Remove system user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users_roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Usuario eliminado con éxito' });
  } catch (err) {
    console.error('Error deleting personal:', err.message);
    res.status(500).json({ error: 'Error al eliminar personal' });
  }
});

module.exports = router;
