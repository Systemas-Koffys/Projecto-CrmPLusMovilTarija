const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/verifyToken');

/**
 * GET /api/turno/estado
 * Get active shift, its driver attendances, payments and active services.
 */
router.get('/estado', verifyToken, async (req, res) => {
  try {
    // 1. Get active shift (simple query)
    const { data: turno, error: turnoErr } = await supabase
      .from('turnos')
      .select('*')
      .eq('estado', 'activo')
      .maybeSingle();

    if (turnoErr) {
      console.error('Error fetching turno from DB:', turnoErr.message);
      return res.status(500).json({ error: turnoErr.message });
    }

    if (!turno) {
      return res.json({ activo: false, turno: null });
    }

    // Fetch operadora name separately if exists
    let operadoraNombre = 'Administrador';
    if (turno.operadora_id) {
      const { data: opData } = await supabase
        .from('operadoras')
        .select('nombre')
        .eq('id', turno.operadora_id)
        .maybeSingle();
      if (opData) {
        operadoraNombre = opData.nombre;
      }
    }
    
    // Attach operadora name
    turno.operadora = { nombre: operadoraNombre };

    // 2. Get attendances for active shift
    const { data: asistencias, error: astErr } = await supabase
      .from('asistencias')
      .select('*')
      .eq('turno_id', turno.id);

    if (astErr) console.warn('Warning fetching asistencias:', astErr.message);

    // Fetch driver details for attendances manually to bypass join issues
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
          chofer: driver 
            ? { id: driver.id, nombre: driver.nombre, numero_movil: driver.numero_movil } 
            : { id: null, nombre: 'Chofer desconocido', numero_movil: '—' }
        };
      });
    }

    // 3. Get recent services of this shift
    const { data: servicios, error: srvErr } = await supabase
      .from('servicios')
      .select('*')
      .eq('turno_id', turno.id)
      .order('created_at', { ascending: false });

    if (srvErr) console.warn('Warning fetching servicios:', srvErr.message);

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
          chofer: driver ? { nombre: driver.nombre, numero_movil: driver.numero_movil } : null,
          cliente: client ? { nombre: client.nombre, numero_whatsapp: client.numero_whatsapp } : null
        };
      });
    }

    // 4. Get payments registered in this shift
    const { data: cobros, error: cobrosErr } = await supabase
      .from('cobros')
      .select('*')
      .eq('turno_id', turno.id)
      .order('created_at', { ascending: false });

    if (cobrosErr) console.warn('Warning fetching cobros:', cobrosErr.message);

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
          chofer: driver ? { nombre: driver.nombre, numero_movil: driver.numero_movil } : { nombre: 'Chofer', numero_movil: '—' }
        };
      });
    }

    res.json({
      activo: true,
      turno,
      asistencias: asistenciasConChofer,
      servicios: serviciosConDetalles,
      cobros: cobrosConChofer
    });
  } catch (err) {
    console.error('Error fetching shift status:', err.message);
    res.status(500).json({ error: 'Error obteniendo estado del turno' });
  }
});

/**
 * POST /api/turno/iniciar
 * Start a new shift for the day
 */
router.post('/iniciar', verifyToken, async (req, res) => {
  const { notas } = req.body;
  try {
    // Check if there is an active shift
    const { data: existingTurno, error: checkErr } = await supabase
      .from('turnos')
      .select('id')
      .eq('estado', 'activo')
      .maybeSingle();

    if (checkErr) {
      console.error('Error checking existing shift:', checkErr.message);
      return res.status(500).json({ error: checkErr.message });
    }

    if (existingTurno) {
      return res.status(400).json({ error: 'Ya existe un turno activo en curso' });
    }

    // Get operadora profile matching the current user
    let operadoraId = null;
    if (req.user && req.user.userId) {
      const { data: operadora } = await supabase
        .from('operadoras')
        .select('id')
        .eq('user_id', req.user.userId)
        .maybeSingle();

      if (operadora) {
        operadoraId = operadora.id;
      }
    }

    // If no matching operadora profile, try fallback to any operadora record
    if (!operadoraId) {
      const { data: fallbackOperadora } = await supabase
        .from('operadoras')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (fallbackOperadora) {
        operadoraId = fallbackOperadora.id;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toTimeString().split(' ')[0];

    const { data: newTurno, error: insertErr } = await supabase
      .from('turnos')
      .insert({
        operadora_id: operadoraId,
        fecha: today,
        hora_inicio: timeNow,
        estado: 'activo',
        notas: notas || 'Turno iniciado'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Insert shift error:', insertErr.message);
      return res.status(500).json({ error: insertErr.message });
    }

    res.json({ success: true, turno: newTurno });
  } catch (err) {
    console.error('Error starting shift:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/turno/cerrar
 * Close the current active shift
 */
router.post('/cerrar', verifyToken, async (req, res) => {
  const { notes } = req.body;
  try {
    const { data: turno } = await supabase
      .from('turnos')
      .select('id')
      .eq('estado', 'activo')
      .maybeSingle();

    if (!turno) {
      return res.status(400).json({ error: 'No hay ningún turno activo para cerrar' });
    }

    // Check if there are pending services in this shift
    const { count: pendingCount } = await supabase
      .from('servicios')
      .select('id', { count: 'exact', head: true })
      .eq('turno_id', turno.id)
      .in('estado', ['pendiente', 'asignado', 'en_curso']);

    if (pendingCount > 0) {
      return res.status(400).json({ 
        error: `No se puede cerrar el turno. Hay ${pendingCount} servicios activos o pendientes sin finalizar.` 
      });
    }

    // Collect summary statistics
    const { data: services } = await supabase
      .from('servicios')
      .select('estado, monto')
      .eq('turno_id', turno.id);

    const { data: payments } = await supabase
      .from('cobros')
      .select('monto')
      .eq('turno_id', turno.id);

    const totalCaja = payments ? payments.reduce((sum, p) => sum + Number(p.monto), 0) : 0;
    
    const resumen = {
      servicios_completados: services ? services.filter(s => s.estado === 'completado').length : 0,
      servicios_cancelados: services ? services.filter(s => s.estado === 'cancelado').length : 0,
      cobros_registrados: payments ? payments.length : 0,
      total_caja: totalCaja
    };

    const timeNow = new Date().toTimeString().split(' ')[0];

    const { data: updatedTurno, error: updateErr } = await supabase
      .from('turnos')
      .update({
        hora_fin: timeNow,
        estado: 'cerrado',
        resumen,
        notas: notes || 'Turno cerrado con éxito'
      })
      .eq('id', turno.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ success: true, summary: resumen, turno: updatedTurno });
  } catch (err) {
    console.error('Error closing shift:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/turno/choferes
 */
router.get('/choferes', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('choferes')
      .select('id, nombre, numero_movil')
      .eq('estado', 'activo')
      .order('numero_movil', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/turno/asistencia
 */
router.post('/asistencia', verifyToken, async (req, res) => {
  const { turno_id, chofer_id, limpieza, falta, notas } = req.body;
  try {
    const { data, error } = await supabase
      .from('asistencias')
      .insert({
        turno_id,
        chofer_id,
        hora_entrada: new Date().toISOString(),
        limpieza: !!limpieza,
        falta: !!falta,
        notas: notas || '' // wait, column is notes or notas? Let's check init.sql: it says notas TEXT
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, asistencia: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/turno/cobro
 */
router.post('/cobro', verifyToken, async (req, res) => {
  const { turno_id, chofer_id, concepto, monto, notas } = req.body;
  try {
    let operadoraId = null;
    if (req.user && req.user.userId) {
      const { data: operadora } = await supabase
        .from('operadoras')
        .select('id')
        .eq('user_id', req.user.userId)
        .maybeSingle();

      if (operadora) operadoraId = operadora.id;
    }

    const { data, error } = await supabase
      .from('cobros')
      .insert({
        turno_id,
        chofer_id,
        operadora_id: operadoraId,
        concepto,
        monto: Number(monto),
        notas: notas || ''
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, cobro: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/turno/whatsapp-solicitudes
 */
router.get('/whatsapp-solicitudes', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_whatsapp')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/turno/servicio/crear
 */
router.post('/servicio/crear', verifyToken, async (req, res) => {
  const { solicitud_id, chofer_id, cliente_telefono, cliente_nombre, zona, destino, notas } = req.body;
  try {
    const { data: turno } = await supabase
      .from('turnos')
      .select('id, operadora_id')
      .eq('estado', 'activo')
      .maybeSingle();

    if (!turno) {
      return res.status(400).json({ error: 'No hay un turno activo en curso' });
    }

    let clienteId = null;
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('numero_whatsapp', cliente_telefono)
      .maybeSingle();

    if (!cliente) {
      const { data: newCli, error: cliErr } = await supabase
        .from('clientes')
        .insert({
          numero_whatsapp: cliente_telefono,
          nombre: cliente_nombre || 'Cliente WhatsApp',
          zona: zona || ''
        })
        .select('id')
        .single();
      
      if (cliErr) throw cliErr;
      clienteId = newCli.id;
    } else {
      clienteId = cliente.id;
      if (zona) {
        await supabase.from('clientes').update({ zona }).eq('id', clienteId);
      }
    }

    const { data: servicio, error: srvErr } = await supabase
      .from('servicios')
      .insert({
        cliente_id: clienteId,
        chofer_id: chofer_id,
        operadora_id: turno.operadora_id,
        turno_id: turno.id,
        zona: zona || '',
        destino: destino || 'Sin especificar',
        estado: 'completado',
        monto: 0.00,
        notas: notas || ''
      })
      .select()
      .single();

    if (srvErr) throw srvErr;

    if (solicitud_id) {
      await supabase
        .from('solicitudes_whatsapp')
        .update({
          estado: 'atendido',
          servicio_id: servicio.id
        })
        .eq('id', solicitud_id);
    }

    res.json({ success: true, servicio });
  } catch (err) {
    console.error('Error creating service from request:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/turno/solicitud/descartar
 */
router.post('/solicitud/descartar', verifyToken, async (req, res) => {
  const { solicitud_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('solicitudes_whatsapp')
      .update({ estado: 'descartado' })
      .eq('id', solicitud_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, solicitud: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
