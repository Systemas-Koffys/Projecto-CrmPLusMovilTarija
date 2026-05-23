const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken, verifyRole } = require('../middleware/verifyToken');

/**
 * GET /api/choferes
 * List all drivers
 */
router.get('/', verifyToken, verifyRole('admin', 'personal', 'operadora', 'contadora'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('choferes')
      .select('*')
      .order('numero_movil', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching drivers:', err.message);
    res.status(500).json({ error: 'Error al obtener la lista de choferes' });
  }
});

/**
 * POST /api/choferes
 * Create a new driver
 */
router.post('/', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const {
    nombre,
    ci,
    telefono,
    telefono_emergencia,
    tipo_sangre,
    fecha_ingreso,
    es_socio,
    numero_movil,
    foto_url,
    foto_auto_url,
    foto_placa_url,
    estado,
    notas
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('choferes')
      .insert({
        nombre,
        ci,
        telefono,
        telefono_emergencia,
        tipo_sangre,
        fecha_ingreso: fecha_ingreso || new Date().toISOString(),
        es_socio: !!es_socio,
        numero_movil,
        foto_url: foto_url || '',
        foto_auto_url: foto_auto_url || '',
        foto_placa_url: foto_placa_url || '',
        estado: estado || 'activo',
        notas: notas || ''
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating driver:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/choferes/:id
 * Update an existing driver
 */
router.put('/:id', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('choferes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`Error updating driver ${id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/choferes/:id
 * Soft delete or suspend a driver
 */
router.delete('/:id', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const { id } = req.params;
  try {
    // We soft-delete by setting status to 'inactivo'
    const { data, error } = await supabase
      .from('choferes')
      .update({
        estado: 'inactivo',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Chofer desactivado con éxito', chofer: data });
  } catch (err) {
    console.error(`Error deleting driver ${id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/choferes/:id/documentos
 * List all documents for a driver
 */
router.get('/:id/documentos', verifyToken, verifyRole('admin', 'personal', 'operadora'), async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('chofer_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Auto-update status based on current date before returning
    const today = new Date();
    const updatedDocs = await Promise.all(data.map(async (doc) => {
      if (!doc.fecha_vencimiento) return doc;
      
      const vencimiento = new Date(doc.fecha_vencimiento);
      const diffTime = vencimiento - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let nuevoEstado = 'valido';
      if (diffDays <= 0) {
        nuevoEstado = 'vencido';
      } else if (diffDays <= 30) {
        nuevoEstado = 'por_vencer';
      }

      if (doc.estado !== nuevoEstado) {
        const { data: updatedDoc } = await supabase
          .from('documentos')
          .update({ estado: nuevoEstado })
          .eq('id', doc.id)
          .select()
          .single();
        return updatedDoc || doc;
      }
      return doc;
    }));

    res.json(updatedDocs);
  } catch (err) {
    console.error(`Error fetching docs for driver ${id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener documentos del chofer' });
  }
});

/**
 * POST /api/choferes/:id/documentos
 * Add a document to a driver
 */
router.post('/:id/documentos', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const { id } = req.params;
  const { tipo, fecha_emision, fecha_vencimiento, archivo_url, notas } = req.body;

  try {
    // Calculate initial status
    let estado = 'valido';
    if (fecha_vencimiento) {
      const today = new Date();
      const vencimiento = new Date(fecha_vencimiento);
      const diffDays = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        estado = 'vencido';
      } else if (diffDays <= 30) {
        estado = 'por_vencer';
      }
    }

    const { data, error } = await supabase
      .from('documentos')
      .insert({
        chofer_id: id,
        tipo,
        fecha_emision,
        fecha_vencimiento,
        archivo_url: archivo_url || '',
        estado,
        notas: notas || ''
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(`Error adding doc for driver ${id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/choferes/:id/documentos/:docId
 * Update document details or status
 */
router.put('/:id/documentos/:docId', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const { docId } = req.params;
  const updates = req.body;

  try {
    if (updates.fecha_vencimiento) {
      const today = new Date();
      const vencimiento = new Date(updates.fecha_vencimiento);
      const diffDays = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        updates.estado = 'vencido';
      } else if (diffDays <= 30) {
        updates.estado = 'por_vencer';
      } else {
        updates.estado = 'valido';
      }
    }

    const { data, error } = await supabase
      .from('documentos')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`Error updating document ${docId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/choferes/:id/documentos/:docId
 * Delete a driver's document
 */
router.delete('/:id/documentos/:docId', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const { docId } = req.params;
  try {
    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', docId);

    if (error) throw error;
    res.json({ success: true, message: 'Documento eliminado con éxito' });
  } catch (err) {
    console.error(`Error deleting document ${docId}:`, err.message);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

/**
 * GET /api/choferes/:id/incidentes
 * Fetch all incidents for a driver
 */
router.get('/:id/incidentes', verifyToken, verifyRole('admin', 'personal', 'operadora', 'contadora'), async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('incidentes')
      .select('*')
      .eq('chofer_id', id)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(`Error fetching incidents for driver ${id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener incidentes del chofer' });
  }
});

/**
 * POST /api/choferes/:id/incidentes
 * Add a new incident for a driver
 */
router.post('/:id/incidentes', verifyToken, verifyRole('admin', 'personal', 'operadora'), async (req, res) => {
  const { id } = req.params;
  const { tipo, descripcion, gravedad, fecha, monto_multa, aplica_multa } = req.body;

  try {
    const estado_multa = aplica_multa && parseFloat(monto_multa) > 0 ? 'pendiente' : 'no_aplica';
    
    const { data, error } = await supabase
      .from('incidentes')
      .insert({
        chofer_id: id,
        tipo,
        descripcion,
        gravedad,
        fecha: fecha || new Date().toISOString().split('T')[0],
        monto_multa: aplica_multa ? parseFloat(monto_multa) : 0.00,
        estado_multa
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(`Error adding incident for driver ${id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/choferes/:id/incidentes/:incidenteId
 * Delete a driver's incident
 */
router.delete('/:id/incidentes/:incidenteId', verifyToken, verifyRole('admin', 'personal'), async (req, res) => {
  const { incidenteId } = req.params;
  try {
    const { error } = await supabase
      .from('incidentes')
      .delete()
      .eq('id', incidenteId);

    if (error) throw error;
    res.json({ success: true, message: 'Incidente eliminado con éxito' });
  } catch (err) {
    console.error(`Error deleting incident ${incidenteId}:`, err.message);
    res.status(500).json({ error: 'Error al eliminar el incidente' });
  }
});

/**
 * POST /api/choferes/:id/incidentes/:incidenteId/pagar
 * Pay a driver's fine. Updates state to 'pagado' and registers a record in cobros.
 */
router.post('/:id/incidentes/:incidenteId/pagar', verifyToken, verifyRole('admin', 'contadora', 'operadora'), async (req, res) => {
  const { id, incidenteId } = req.params;
  
  try {
    // 1. Get the incident details
    const { data: incidente, error: incErr } = await supabase
      .from('incidentes')
      .select('*')
      .eq('id', incidenteId)
      .single();
      
    if (incErr) throw incErr;
    if (!incidente) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }
    
    if (incidente.estado_multa !== 'pendiente') {
      return res.status(400).json({ error: 'El incidente no tiene una multa pendiente de pago' });
    }
    
    // 2. Get active shift (turno) to associate with this cobro
    const { data: activeTurno } = await supabase
      .from('turnos')
      .select('id, operadora_id')
      .eq('estado', 'activo')
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle();

    let operadoraId = activeTurno?.operadora_id || null;
    let turnoId = activeTurno?.id || null;

    if (!operadoraId) {
      const { data: firstOp } = await supabase
        .from('operadoras')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (firstOp) {
        operadoraId = firstOp.id;
      }
    }

    if (!turnoId) {
      const { data: lastShift } = await supabase
        .from('turnos')
        .select('id')
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastShift) {
        turnoId = lastShift.id;
      }
    }

    // 3. Update the incident status to 'pagado'
    const { data: updatedInc, error: updateErr } = await supabase
      .from('incidentes')
      .update({
        estado_multa: 'pagado',
        updated_at: new Date().toISOString()
      })
      .eq('id', incidenteId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Create the corresponding cobro record
    const { error: cobroErr } = await supabase
      .from('cobros')
      .insert({
        chofer_id: id,
        operadora_id: operadoraId,
        turno_id: turnoId,
        concepto: 'Multa',
        monto: incidente.monto_multa,
        fecha_hora: new Date().toISOString(),
        notas: `Pago de multa por incidente (${incidente.tipo}): ${incidente.descripcion}`
      });

    if (cobroErr) {
      await supabase
        .from('incidentes')
        .update({ estado_multa: 'pendiente' })
        .eq('id', incidenteId);
      throw cobroErr;
    }

    res.json({
      success: true,
      message: 'Multa pagada y registrada en caja con éxito',
      incidente: updatedInc
    });
  } catch (err) {
    console.error(`Error paying fine for incident ${incidenteId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
