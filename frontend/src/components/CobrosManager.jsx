import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  HiOutlineCash, 
  HiOutlineCalendar, 
  HiOutlineFilter, 
  HiOutlineSearch,
  HiOutlineExclamationCircle 
} from 'react-icons/hi';
import './CobrosManager.css';

export default function CobrosManager() {
  const [cobros, setCobros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filterConcepto, setFilterConcepto] = useState('todos');
  const [filterPeriodo, setFilterPeriodo] = useState('todos');
  const [filterMovil, setFilterMovil] = useState('');
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: ''
  });

  // Consolidated statistics
  const [stats, setStats] = useState({
    total: 0,
    turnoLibre: 0,
    multas: 0,
    limpieza: 0,
    cantidad: 0
  });

  useEffect(() => {
    fetchCobros();
  }, [filterPeriodo, filterConcepto, customDates]);

  // Recalculate stats when cobros list updates
  useEffect(() => {
    let filtered = cobros;
    if (filterMovil.trim() !== '') {
      filtered = cobros.filter(c => 
        c.chofer?.numero_movil && 
        c.chofer.numero_movil.toLowerCase().includes(filterMovil.toLowerCase().trim())
      );
    }
    calculateStats(filtered);
  }, [cobros, filterMovil]);

  const fetchCobros = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // Calculate date filters
      let start = '';
      let end = '';
      const today = new Date();
      
      if (filterPeriodo === 'hoy') {
        start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        end = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      } else if (filterPeriodo === 'ayer') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        start = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
        end = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      } else if (filterPeriodo === 'semana') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        start = new Date(lastWeek.setHours(0, 0, 0, 0)).toISOString();
      } else if (filterPeriodo === 'personalizado' && customDates.startDate) {
        start = new Date(customDates.startDate + 'T00:00:00').toISOString();
        if (customDates.endDate) {
          end = new Date(customDates.endDate + 'T23:59:59').toISOString();
        }
      }

      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      if (filterConcepto !== 'todos') params.append('concepto', filterConcepto);

      const data = await api.get(`/api/cobros?${params.toString()}`);
      setCobros(data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener el historial de cobros.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (cobrosList) => {
    let tot = 0;
    let tl = 0;
    let mu = 0;
    let li = 0;

    cobrosList.forEach(c => {
      const montoVal = Number(c.monto) || 0;
      tot += montoVal;
      
      const conceptoLower = c.concepto.toLowerCase();
      if (conceptoLower.includes('turno') || conceptoLower.includes('libre')) {
        tl += montoVal;
      } else if (conceptoLower.includes('multa')) {
        mu += montoVal;
      } else if (conceptoLower.includes('limpieza') || conceptoLower.includes('aseo')) {
        li += montoVal;
      }
    });

    setStats({
      total: tot,
      turnoLibre: tl,
      multas: mu,
      limpieza: li,
      cantidad: cobrosList.length
    });
  };

  // Concept classes helper
  const getConceptBadgeClass = (concepto) => {
    const conceptLower = concepto.toLowerCase();
    if (conceptLower.includes('turno') || conceptLower.includes('libre')) return 'badge--green';
    if (conceptLower.includes('multa')) return 'badge--red';
    if (conceptLower.includes('limpieza') || conceptLower.includes('aseo')) return 'badge--cyan';
    return 'badge--purple';
  };

  // Filter local driver search
  const filteredCobros = cobros.filter(c => {
    if (filterMovil.trim() === '') return true;
    return (
      c.chofer?.numero_movil?.toLowerCase().includes(filterMovil.toLowerCase().trim()) ||
      c.chofer?.nombre?.toLowerCase().includes(filterMovil.toLowerCase().trim())
    );
  });

  return (
    <div className="cobros-manager animate-fade-in">
      {/* Title Header */}
      <div className="cobros-header">
        <div>
          <h2 className="cobros-title">Módulo de Contadora — Caja & Cobros</h2>
          <p className="cobros-subtitle">Visualización financiera, control de caja consolidado y auditoría de recaudación por turno</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="cobros-metrics">
        <div className="metric-card metric-card--green">
          <div className="metric-card__icon"><HiOutlineCash /></div>
          <div className="metric-card__value">Bs. {stats.total.toFixed(2)}</div>
          <div className="metric-card__label">Recaudación Total</div>
        </div>
        <div className="metric-card metric-card--cyan">
          <div className="metric-card__icon">🚗</div>
          <div className="metric-card__value">Bs. {stats.turnoLibre.toFixed(2)}</div>
          <div className="metric-card__label">Turno Libre</div>
        </div>
        <div className="metric-card metric-card--yellow">
          <div className="metric-card__icon">⚠️</div>
          <div className="metric-card__value">Bs. {stats.multas.toFixed(2)}</div>
          <div className="metric-card__label">Multas / Sanciones</div>
        </div>
        <div className="metric-card metric-card--purple">
          <div className="metric-card__icon">🧹</div>
          <div className="metric-card__value">Bs. {stats.limpieza.toFixed(2)}</div>
          <div className="metric-card__label">Limpieza de Autos</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="cobros-filters-container glass-card">
        <div className="cobros-filter-row">
          {/* Concept Filter */}
          <div className="filter-group">
            <label><HiOutlineFilter /> Concepto</label>
            <select value={filterConcepto} onChange={e => setFilterConcepto(e.target.value)}>
              <option value="todos">Todos los conceptos</option>
              <option value="Turno Libre">Turno Libre</option>
              <option value="Multa">Multas</option>
              <option value="Limpieza">Limpieza</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="filter-group">
            <label><HiOutlineCalendar /> Periodo</label>
            <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}>
              <option value="todos">Todo el historial</option>
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="semana">Últimos 7 días</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {/* Search Driver / Movil */}
          <div className="filter-group filter-group--search">
            <label><HiOutlineSearch /> Buscar</label>
            <input 
              type="text" 
              placeholder="Número de móvil o chofer..." 
              value={filterMovil}
              onChange={e => setFilterMovil(e.target.value)}
            />
          </div>
        </div>

        {/* Custom Date Filters */}
        {filterPeriodo === 'personalizado' && (
          <div className="cobros-filter-row cobros-filter-row--custom animate-fade-in">
            <div className="filter-group">
              <label>Fecha Inicio</label>
              <input 
                type="date" 
                value={customDates.startDate} 
                onChange={e => setCustomDates({...customDates, startDate: e.target.value})} 
              />
            </div>
            <div className="filter-group">
              <label>Fecha Fin</label>
              <input 
                type="date" 
                value={customDates.endDate} 
                onChange={e => setCustomDates({...customDates, endDate: e.target.value})} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="cobros-table-container glass-card">
        <h3 className="cobros-table-title">Registros de Cobro ({stats.cantidad})</h3>

        {error && (
          <div className="cobros-error-banner">
            <HiOutlineExclamationCircle style={{ fontSize: 20, marginRight: 8 }} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="cobros-table-loader">
            <div className="spinner" />
            <p>Cargando transacciones...</p>
          </div>
        ) : (
          <div className="cobros-table-wrapper">
            <table className="cobros-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Móvil</th>
                  <th>Conductor</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Registrado Por</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filteredCobros.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.fecha_hora).toLocaleString('es-BO')}</td>
                    <td className="cobros-table-movil">Móvil {c.chofer?.numero_movil || '—'}</td>
                    <td>{c.chofer?.nombre || 'Chofer'}</td>
                    <td>
                      <span className={`badge ${getConceptBadgeClass(c.concepto)}`}>
                        {c.concepto}
                      </span>
                    </td>
                    <td className="cobros-table-amount">Bs. {Number(c.monto).toFixed(2)}</td>
                    <td>{c.operadora?.nombre || 'Admin'}</td>
                    <td className="cobros-table-notes">{c.notas || '—'}</td>
                  </tr>
                ))}
                {filteredCobros.length === 0 && (
                  <tr>
                    <td colSpan="7" className="cobros-table-empty">
                      No se encontraron transacciones con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
