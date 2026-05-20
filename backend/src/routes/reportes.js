const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken, verifyRole } = require('../middleware/verifyToken');

/**
 * GET /api/reportes/turnos
 * List closed shifts
 */
router.get('/turnos', verifyToken, verifyRole('admin', 'contadora'), async (req, res) => {
  try {
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('estado', 'cerrado')
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false });

    if (error) throw error;

    if (!turnos || turnos.length === 0) {
      return res.json([]);
    }

    // Fetch operadora profiles to get names
    const operadoraIds = [...new Set(turnos.map(t => t.operadora_id).filter(Boolean))];
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

    const result = turnos.map(t => {
      const operadora = operadorasMap[t.operadora_id] || { nombre: 'Administrador' };
      return {
        ...t,
        operadora
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching closed shifts:', err.message);
    res.status(500).json({ error: 'Error al obtener el historial de turnos' });
  }
});

/**
 * GET /api/reportes/turnos/:id
 * Get complete details of a specific closed shift for detailed reporting
 */
router.get('/turnos/:id', verifyToken, verifyRole('admin', 'contadora'), async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch shift info
    const { data: turno, error: turnoErr } = await supabase
      .from('turnos')
      .select('*')
      .eq('id', id)
      .single();

    if (turnoErr || !turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    // Fetch operadora name
    let operadoraNombre = 'Administrador';
    if (turno.operadora_id) {
      const { data: opData } = await supabase
        .from('operadoras')
        .select('nombre')
        .eq('id', turno.operadora_id)
        .maybeSingle();
      if (opData) operadoraNombre = opData.nombre;
    }
    turno.operadora = { nombre: operadoraNombre };

    // 2. Fetch asistencias
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('*')
      .eq('turno_id', id);

    let asistenciasConChofer = [];
    if (asistencias && asistencias.length > 0) {
      const driverIds = asistencias.map(a => a.chofer_id).filter(Boolean);
      const { data: drivers } = await supabase
        .from('choferes')
        .select('id, nombre, numero_movil')
        .in('id', driverIds);

      asistenciasConChofer = asistencias.map(a => {
        const driver = drivers ? drivers.find(d => d.id === a.chofer_id) : null;
        return {
          ...a,
          chofer: driver || { nombre: 'Chofer desconocido', numero_movil: '—' }
        };
      });
    }

    // 3. Fetch cobros
    const { data: cobros } = await supabase
      .from('cobros')
      .select('*')
      .eq('turno_id', id)
      .order('fecha_hora', { ascending: true });

    let cobrosConChofer = [];
    if (cobros && cobros.length > 0) {
      const driverIds = cobros.map(c => c.chofer_id).filter(Boolean);
      const { data: drivers } = await supabase
        .from('choferes')
        .select('id, nombre, numero_movil')
        .in('id', driverIds);

      cobrosConChofer = cobros.map(c => {
        const driver = drivers ? drivers.find(d => d.id === c.chofer_id) : null;
        return {
          ...c,
          chofer: driver || { nombre: 'Chofer', numero_movil: '—' }
        };
      });
    }

    // 4. Fetch servicios
    const { data: servicios } = await supabase
      .from('servicios')
      .select('*')
      .eq('turno_id', id)
      .order('fecha_hora', { ascending: true });

    let serviciosConDetalles = [];
    if (servicios && servicios.length > 0) {
      const driverIds = servicios.map(s => s.chofer_id).filter(Boolean);
      const clientIds = servicios.map(s => s.cliente_id).filter(Boolean);

      const { data: drivers } = await supabase
        .from('choferes')
        .select('id, nombre, numero_movil')
        .in('id', driverIds);

      const { data: clients } = await supabase
        .from('clientes')
        .select('id, nombre, numero_whatsapp')
        .in('id', clientIds);

      serviciosConDetalles = servicios.map(s => {
        const driver = drivers ? drivers.find(d => d.id === s.chofer_id) : null;
        const client = clients ? clients.find(c => c.id === s.cliente_id) : null;
        return {
          ...s,
          chofer: driver || { nombre: 'Móvil', numero_movil: '—' },
          cliente: client || { nombre: 'Cliente', numero_whatsapp: '—' }
        };
      });
    }

    res.json({
      turno,
      asistencias: asistenciasConChofer,
      cobros: cobrosConChofer,
      servicios: serviciosConDetalles
    });
  } catch (err) {
    console.error(`Error fetching detailed report for shift ${id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener el reporte detallado del turno' });
  }
});

module.exports = router;
