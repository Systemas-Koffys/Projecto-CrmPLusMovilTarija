import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  HiOutlineDocumentReport, 
  HiOutlineCalendar, 
  HiOutlineUser, 
  HiOutlineClock, 
  HiOutlineCash,
  HiOutlinePrinter,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineClipboardList
} from 'react-icons/hi';
import './ReportesManager.css';

export default function ReportesManager() {
  const [turnos, setTurnos] = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab selection in detail view
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    fetchClosedShifts();
  }, []);

  const fetchClosedShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/reportes/turnos');
      setTurnos(data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener el historial de turnos.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (turno) => {
    setSelectedTurno(turno);
    setDetailLoading(true);
    setActiveTab('resumen');
    try {
      const data = await api.get(`/api/reportes/turnos/${turno.id}`);
      setDetailedData(data);
    } catch (err) {
      console.error(err);
      alert('Error al obtener el detalle del turno.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedTurno(null);
    setDetailedData(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reportes-manager animate-fade-in">
      {/* Title Header */}
      <div className="reportes-header">
        <div>
          <h2 className="reportes-title">Historial & Reportes de Turno</h2>
          <p className="reportes-subtitle">Consulta de cierres de caja pasados, descarga de reportes oficiales de cabina e historial de servicios</p>
        </div>
      </div>

      {error && (
        <div className="reportes-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="reportes-loader">
          <div className="spinner" />
          <p>Cargando historial de turnos...</p>
        </div>
      ) : (
        <div className="reportes-table-container glass-card">
          <h3 className="reportes-table-title">Turnos Finalizados</h3>
          
          <div className="reportes-table-wrapper">
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Operadora</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Servicios</th>
                  <th>Recaudado</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => {
                  const res = t.resumen || {};
                  return (
                    <tr key={t.id}>
                      <td className="reportes-date"><HiOutlineCalendar style={{ marginRight: 6 }} /> {t.fecha}</td>
                      <td>{t.operadora?.nombre || 'Administrador'}</td>
                      <td>{t.hora_inicio || '—'}</td>
                      <td>{t.hora_fin || '—'}</td>
                      <td>{res.servicios_completados || 0} Completados / {res.servicios_cancelados || 0} Cancelados</td>
                      <td className="reportes-amount">Bs. {(res.total_caja || 0).toFixed(2)}</td>
                      <td className="reportes-notes">{t.notas || '—'}</td>
                      <td>
                        <button className="btn btn--secondary btn--sm btn--icon" onClick={() => handleViewDetails(t)}>
                          Ver Detalle
                          <HiOutlineChevronRight style={{ marginLeft: 4 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan="8" className="reportes-empty">
                      No hay turnos cerrados registrados en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shift Detail Modal */}
      {selectedTurno && (
        <div className="modal-overlay">
          <div className="modal-content glass-card reportes-modal">
            <div className="modal-header reportes-modal__header">
              <div>
                <h3>Detalle de Cierre de Turno</h3>
                <span className="reportes-modal__subtitle">ID Turno: {selectedTurno.id}</span>
              </div>
              <div className="reportes-modal__header-actions">
                <button className="btn btn--secondary btn--icon" onClick={handlePrint} disabled={detailLoading}>
                  <HiOutlinePrinter style={{ marginRight: 6 }} />
                  Imprimir Reporte
                </button>
                <button className="modal-close" onClick={handleCloseDetails}>
                  <HiOutlineX />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="reportes-modal__loader">
                <div className="spinner" />
                <p>Recuperando logs del turno...</p>
              </div>
            ) : detailedData ? (
              <div className="reportes-modal__body">
                {/* Print-Only Header */}
                <div className="print-header">
                  <div className="print-logo">📡 Plus Móvil Tarija</div>
                  <div className="print-title">Reporte de Cierre de Cabina</div>
                  <div className="print-meta">
                    <div><strong>Fecha:</strong> {selectedTurno.fecha}</div>
                    <div><strong>Operadora:</strong> {selectedTurno.operadora?.nombre || 'Administrador'}</div>
                    <div><strong>Horario:</strong> {selectedTurno.hora_inicio} - {selectedTurno.hora_fin}</div>
                  </div>
                </div>

                {/* Info summary row */}
                <div className="reportes-summary-cards">
                  <div className="rep-card">
                    <span className="rep-card__label">Recaudación en Caja</span>
                    <span className="rep-card__value">Bs. {(detailedData.turno.resumen?.total_caja || 0).toFixed(2)}</span>
                  </div>
                  <div className="rep-card">
                    <span className="rep-card__label">Servicios Completados</span>
                    <span className="rep-card__value">{detailedData.turno.resumen?.servicios_completados || 0}</span>
                  </div>
                  <div className="rep-card">
                    <span className="rep-card__label">Asistencias de Móviles</span>
                    <span className="rep-card__value">{detailedData.asistencias?.length || 0}</span>
                  </div>
                </div>

                {/* Tabs bar */}
                <div className="reportes-tabs no-print">
                  <button 
                    className={`reportes-tab ${activeTab === 'resumen' ? 'reportes-tab--active' : ''}`}
                    onClick={() => setActiveTab('resumen')}
                  >
                    Resumen General
                  </button>
                  <button 
                    className={`reportes-tab ${activeTab === 'asistencias' ? 'reportes-tab--active' : ''}`}
                    onClick={() => setActiveTab('asistencias')}
                  >
                    Asistencias ({detailedData.asistencias?.length || 0})
                  </button>
                  <button 
                    className={`reportes-tab ${activeTab === 'cobros' ? 'reportes-tab--active' : ''}`}
                    onClick={() => setActiveTab('cobros')}
                  >
                    Cobros Caja ({detailedData.cobros?.length || 0})
                  </button>
                  <button 
                    className={`reportes-tab ${activeTab === 'servicios' ? 'reportes-tab--active' : ''}`}
                    onClick={() => setActiveTab('servicios')}
                  >
                    Servicios ({detailedData.servicios?.length || 0})
                  </button>
                </div>

                {/* Tab contents */}
                <div className="reportes-tab-content">
                  
                  {/* Resumen General Tab */}
                  {(activeTab === 'resumen' || window.matchMedia('print').matches) && (
                    <div className="reportes-section">
                      <h4>Datos Generales del Turno</h4>
                      <div className="reportes-details-grid">
                        <div className="rep-detail-field">
                          <HiOutlineCalendar />
                          <div>
                            <span>Fecha de Turno</span>
                            <strong>{detailedData.turno.fecha}</strong>
                          </div>
                        </div>
                        <div className="rep-detail-field">
                          <HiOutlineUser />
                          <div>
                            <span>Operadora</span>
                            <strong>{detailedData.turno.operadora?.nombre || 'Administrador'}</strong>
                          </div>
                        </div>
                        <div className="rep-detail-field">
                          <HiOutlineClock />
                          <div>
                            <span>Apertura de Cabina</span>
                            <strong>{detailedData.turno.hora_inicio || '—'}</strong>
                          </div>
                        </div>
                        <div className="rep-detail-field">
                          <HiOutlineClock />
                          <div>
                            <span>Cierre de Cabina</span>
                            <strong>{detailedData.turno.hora_fin || '—'}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="reportes-notes-block">
                        <strong>Notas de cierre:</strong>
                        <p>{detailedData.turno.notas || 'Sin observaciones registradas.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Asistencias Tab */}
                  {(activeTab === 'asistencias' || window.matchMedia('print').matches) && (
                    <div className="reportes-section">
                      <h4>Registro de Asistencia de Móviles</h4>
                      <table className="rep-details-table">
                        <thead>
                          <tr>
                            <th>Móvil</th>
                            <th>Conductor</th>
                            <th>Hora Ingreso</th>
                            <th>Limpieza de Auto</th>
                            <th>Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedData.asistencias.map((a) => (
                            <tr key={a.id}>
                              <td className="m-num">Móvil {a.chofer?.numero_movil}</td>
                              <td>{a.chofer?.nombre}</td>
                              <td>{new Date(a.hora_entrada).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td>
                              <td>{a.limpieza ? '✅ Limpio' : '❌ Pendiente'}</td>
                              <td>{a.notas || '—'}</td>
                            </tr>
                          ))}
                          {detailedData.asistencias.length === 0 && (
                            <tr>
                              <td colSpan="5" className="empty-row">No se registraron ingresos en este turno.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cobros Tab */}
                  {(activeTab === 'cobros' || window.matchMedia('print').matches) && (
                    <div className="reportes-section">
                      <h4>Caja del Turno (Cobros Registrados)</h4>
                      <table className="rep-details-table">
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Móvil</th>
                            <th>Concepto</th>
                            <th>Monto</th>
                            <th>Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedData.cobros.map((c) => (
                            <tr key={c.id}>
                              <td>{new Date(c.fecha_hora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="m-num">Móvil {c.chofer?.numero_movil}</td>
                              <td>{c.concepto}</td>
                              <td className="amt">Bs. {Number(c.monto).toFixed(2)}</td>
                              <td>{c.notas || '—'}</td>
                            </tr>
                          ))}
                          {detailedData.cobros.length === 0 && (
                            <tr>
                              <td colSpan="5" className="empty-row">No se registraron cobros en este turno.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Servicios Tab */}
                  {(activeTab === 'servicios' || window.matchMedia('print').matches) && (
                    <div className="reportes-section">
                      <h4>Historial de Servicios de Radio</h4>
                      <table className="rep-details-table">
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Cliente</th>
                            <th>Móvil</th>
                            <th>Zona</th>
                            <th>Destino</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedData.servicios.map((s) => (
                            <tr key={s.id}>
                              <td>{new Date(s.fecha_hora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td>
                              <td>{s.cliente?.nombre || 'WhatsApp'} ({s.cliente?.numero_whatsapp})</td>
                              <td className="m-num">{s.chofer?.numero_movil ? `Móvil ${s.chofer.numero_movil}` : 'No asignado'}</td>
                              <td>{s.zona || '—'}</td>
                              <td>{s.destino || '—'}</td>
                              <td>
                                <span className={`badge ${s.estado === 'completado' ? 'badge--green' : 'badge--red'}`}>
                                  {s.estado.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {detailedData.servicios.length === 0 && (
                            <tr>
                              <td colSpan="6" className="empty-row">No se despacharon servicios en este turno.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
