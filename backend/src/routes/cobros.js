const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken, verifyRole } = require('../middleware/verifyToken');

/**
 * GET /api/cobros
 * List and filter payments for Accountant (contadora) or Admin
 */
router.get('/', verifyToken, verifyRole('admin', 'contadora'), async (req, res) => {
  const { startDate, endDate, concepto, numeroMovil } = req.query;

  try {
    let query = supabase
      .from('cobros')
      .select('*')
      .order('fecha_hora', { ascending: false });

    // Date filters
    if (startDate) {
      query = query.gte('fecha_hora', startDate);
    }
    if (endDate) {
      query = query.lte('fecha_hora', endDate);
    }

    // Concept filter
    if (concepto && concepto !== 'todos') {
      query = query.eq('concepto', concepto);
    }

    const { data: cobros, error: cobrosErr } = await query;
    if (cobrosErr) throw cobrosErr;

    if (!cobros || cobros.length === 0) {
      return res.json([]);
    }

    // Fetch related drivers (choferes)
    const driverIds = [...new Set(cobros.map(c => c.chofer_id).filter(Boolean))];
    let driversMap = {};
    if (driverIds.length > 0) {
      const { data: drivers } = await supabase
        .from('choferes')
        .select('id, nombre, numero_movil')
        .in('id', driverIds);

      if (drivers) {
        drivers.forEach(d => {
          driversMap[d.id] = d;
        });
      }
    }

    // Fetch related operadoras
    const operadoraIds = [...new Set(cobros.map(c => c.operadora_id).filter(Boolean))];
    let operadorasMap = {};
    if (operadoraIds.length > 0) {
      const { data: operadoras } = await supabase
        .from('operadoras')
        .select('id, nombre')
        .in('id', operadoraIds);

      if (operadoras) {
        operadoras.forEach(op => {
          operadorasMap[op.id] = op;
        });
      }
    }

    // Map details
    let result = cobros.map(c => {
      const chofer = driversMap[c.chofer_id] || { nombre: 'Chofer desconocido', numero_movil: '—' };
      const operadora = operadorasMap[c.operadora_id] || { nombre: 'Sistema/Admin' };
      return {
        ...c,
        chofer,
        operadora
      };
    });

    // Client-side filtering for numeroMovil since it's inside the driver relation
    if (numeroMovil && numeroMovil.trim() !== '') {
      result = result.filter(c => 
        c.chofer.numero_movil && 
        c.chofer.numero_movil.toLowerCase().includes(numeroMovil.toLowerCase().trim())
      );
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching payments:', err.message);
    res.status(500).json({ error: 'Error al obtener la lista de cobros' });
  }
});

module.exports = router;
