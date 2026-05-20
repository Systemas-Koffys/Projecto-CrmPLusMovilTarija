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

module.exports = router;
