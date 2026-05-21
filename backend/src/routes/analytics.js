const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken, verifyRole } = require('../middleware/verifyToken');

// GET /api/analytics/kpis — Get analytics KPIs and chart data
router.get('/kpis', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    // 1. General counts
    const { count: activeChoferes } = await supabase
      .from('choferes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');

    const { count: totalClientes } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch last 30 days of services
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: serviciosData, error: srvError } = await supabase
      .from('servicios')
      .select('created_at, estado')
      .gte('created_at', thirtyDaysAgoStr);

    if (srvError) throw srvError;

    // 3. Fetch last 30 days of cobros
    const { data: cobrosData, error: cobError } = await supabase
      .from('cobros')
      .select('fecha_hora, monto')
      .gte('fecha_hora', thirtyDaysAgoStr);

    if (cobError) throw cobError;

    // 4. Fetch all active choferes to map leaderboard names
    const { data: choferesList, error: chfError } = await supabase
      .from('choferes')
      .select('id, nombre, numero_movil');

    if (chfError) throw chfError;

    // Map choferes by id for fast lookup
    const choferMap = {};
    (choferesList || []).forEach(c => {
      choferMap[c.id] = `${c.numero_movil} - ${c.nombre}`;
    });

    // 5. Process services chart data (grouped by date)
    const servicesByDate = {};
    const servicesByDriver = {};
    let totalServiciosCount = 0;
    let completedServiciosCount = 0;

    (serviciosData || []).forEach(s => {
      totalServiciosCount++;
      if (s.estado === 'completado') completedServiciosCount++;

      // Date grouping (YYYY-MM-DD)
      const dateKey = s.created_at.split('T')[0];
      servicesByDate[dateKey] = (servicesByDate[dateKey] || 0) + 1;

      // Driver grouping
      if (s.chofer_id) {
        servicesByDriver[s.chofer_id] = (servicesByDriver[s.chofer_id] || 0) + 1;
      }
    });

    // 6. Process cobros chart data (grouped by date)
    const earningsByDate = {};
    let totalEarnings = 0;

    (cobrosData || []).forEach(c => {
      const monto = Number(c.monto) || 0;
      totalEarnings += monto;

      const dateKey = c.fecha_hora.split('T')[0];
      earningsByDate[dateKey] = (earningsByDate[dateKey] || 0) + monto;
    });

    // 7. Process Driver Leaderboard (Top 5)
    // Query services grouped by chofer_id
    const { data: servicesByDriverDb, error: dbDriverError } = await supabase
      .from('servicios')
      .select('chofer_id');
      
    const driverServiceCounts = {};
    if (!dbDriverError && servicesByDriverDb) {
      servicesByDriverDb.forEach(s => {
        if (s.chofer_id) {
          driverServiceCounts[s.chofer_id] = (driverServiceCounts[s.chofer_id] || 0) + 1;
        }
      });
    }

    const leaderboard = Object.keys(driverServiceCounts)
      .map(id => ({
        driverName: choferMap[id] || `Chofer #${id}`,
        count: driverServiceCounts[id]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate full list of past 7 days (including zeros) for charts to look nice
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const servicesChart = last7Days.map(date => ({
      date,
      count: servicesByDate[date] || 0
    }));

    const earningsChart = last7Days.map(date => ({
      date,
      monto: earningsByDate[date] || 0
    }));

    res.json({
      kpis: {
        activeChoferes: activeChoferes || 0,
        totalClientes: totalClientes || 0,
        totalServicios30Days: totalServiciosCount,
        completedServicios30Days: completedServiciosCount,
        totalEarnings30Days: totalEarnings
      },
      charts: {
        servicesChart,
        earningsChart,
        leaderboard
      }
    });
  } catch (err) {
    console.error('Error in /analytics/kpis:', err.message);
    res.status(500).json({ error: 'Error al generar analíticas' });
  }
});

// GET /api/analytics/mapa — Get locations of services for heatmap/markers
router.get('/mapa', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_whatsapp')
      .select('id, cliente_nombre, mensaje, gps_latitud, gps_longitud, created_at')
      .not('gps_latitud', 'is', null)
      .not('gps_longitud', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100); // last 100 geolocated requests

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('Error in /analytics/mapa:', err.message);
    res.status(500).json({ error: 'Error al obtener datos geográficos' });
  }
});

module.exports = router;
