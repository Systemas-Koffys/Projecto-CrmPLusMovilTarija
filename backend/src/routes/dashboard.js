const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken, verifyRole } = require('../middleware/verifyToken');

// GET /api/dashboard/stats — Get general stats (admin)
router.get('/stats', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    // Count choferes
    const { count: totalChoferes } = await supabase
      .from('choferes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');

    // Count operadoras
    const { count: totalOperadoras } = await supabase
      .from('users_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'operadora')
      .eq('activo', true);

    // Count servicios today
    const today = new Date().toISOString().split('T')[0];
    const { count: serviciosHoy } = await supabase
      .from('servicios')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Sum cobros today
    const { data: cobrosData } = await supabase
      .from('cobros')
      .select('monto')
      .gte('fecha_hora', today);

    const cajaHoy = cobrosData
      ? cobrosData.reduce((sum, c) => sum + Number(c.monto), 0)
      : 0;

    res.json({
      totalChoferes: totalChoferes || 0,
      totalOperadoras: totalOperadoras || 0,
      serviciosHoy: serviciosHoy || 0,
      cajaHoy,
    });
  } catch (err) {
    console.error('Error en /dashboard/stats:', err.message);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// GET /api/dashboard/operadora — Get operadora-specific stats
router.get('/operadora', verifyToken, verifyRole('operadora'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get active turno
    const { data: turno } = await supabase
      .from('turnos')
      .select('*')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      turnoActivo: turno || null,
      mensaje: turno ? 'Turno activo encontrado' : 'No hay turno activo',
    });
  } catch (err) {
    console.error('Error en /dashboard/operadora:', err.message);
    res.status(500).json({ error: 'Error obteniendo datos de operadora' });
  }
});

module.exports = router;
