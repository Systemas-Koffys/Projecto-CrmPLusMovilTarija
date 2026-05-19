import { useState, useEffect } from 'react';
import api from '../utils/api';
import './TurnoActivo.css';

export default function TurnoActivo() {
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [choferesList, setChoferesList] = useState([]);
  const [whatsappRequests, setWhatsappRequests] = useState([]);
  const [error, setError] = useState('');

  // Form states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Form values
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dispatchMovilId, setDispatchMovilId] = useState('');
  const [dispatchZona, setDispatchZona] = useState('');
  const [dispatchDestino, setDispatchDestino] = useState('');
  const [dispatchNotas, setDispatchNotas] = useState('');

  const [attendanceMovilId, setAttendanceMovilId] = useState('');
  const [attendanceLimpieza, setAttendanceLimpieza] = useState(true);
  const [attendanceNotas, setAttendanceNotas] = useState('');

  const [paymentMovilId, setPaymentMovilId] = useState('');
  const [paymentConcept, setPaymentConcept] = useState('Turno Libre');
  const [paymentAmount, setPaymentAmount] = useState('10');
  const [paymentNotas, setPaymentNotas] = useState('');

  const fetchShiftStatus = async () => {
    try {
      const data = await api.get('/api/turno/estado');
      setShiftData(data);
      if (data.activo) {
        // Fetch pending WhatsApp messages
        const reqs = await api.get('/api/turno/whatsapp-solicitudes');
        setWhatsappRequests(reqs);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos del turno.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChoferes = async () => {
    try {
      const list = await api.get('/api/turno/choferes');
      setChoferesList(list);
    } catch (err) {
      console.error('Error fetching drivers list:', err);
    }
  };

  useEffect(() => {
    fetchShiftStatus();
    fetchChoferes();

    // Auto-update incoming WhatsApp requests every 4 seconds
    const interval = setInterval(() => {
      fetchShiftStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStartShift = async () => {
    try {
      setLoading(true);
      await api.post('/api/turno/iniciar', { notas: 'Turno iniciado en cabina' });
      await fetchShiftStatus();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al iniciar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!window.confirm('¿Está seguro de cerrar el turno activo? No debe haber servicios pendientes.')) return;
    try {
      setLoading(true);
      const res = await api.post('/api/turno/cerrar', { notes: 'Turno cerrado desde panel' });
      alert(`Turno cerrado con éxito.\nTotal recaudado en caja: Bs. ${res.summary.total_caja}`);
      await fetchShiftStatus();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cerrar el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceMovilId) return;
    try {
      await api.post('/api/turno/asistencia', {
        turno_id: shiftData.turno.id,
        chofer_id: attendanceMovilId,
        limpieza: attendanceLimpieza,
        falta: false,
        notas: attendanceNotas
      });
      setShowAttendanceModal(false);
      setAttendanceMovilId('');
      setAttendanceNotas('');
      fetchShiftStatus();
    } catch (err) {
      alert('Error registrando asistencia: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!paymentMovilId || !paymentAmount) return;
    try {
      await api.post('/api/turno/cobro', {
        turno_id: shiftData.turno.id,
        chofer_id: paymentMovilId,
        concepto: paymentConcept,
        monto: paymentAmount,
        notas: paymentNotas
      });
      setShowPaymentModal(false);
      setPaymentMovilId('');
      setPaymentNotas('');
      fetchShiftStatus();
    } catch (err) {
      alert('Error registrando cobro: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDispatchService = async (e) => {
    e.preventDefault();
    if (!dispatchMovilId) return;
    try {
      await api.post('/api/turno/servicio/crear', {
        solicitud_id: selectedRequest.id,
        chofer_id: dispatchMovilId,
        cliente_telefono: selectedRequest.cliente_telefono,
        cliente_nombre: selectedRequest.cliente_nombre,
        zona: dispatchZona,
        destino: dispatchDestino,
        notas: dispatchNotas
      });

      // Send confirmation to client via WhatsApp
      try {
        const movilSelected = choferesList.find(c => c.id === dispatchMovilId);
        const movilNum = movilSelected ? movilSelected.numero_movil : 'asignado';
        await api.post('/api/whatsapp/send', {
          linea: selectedRequest.linea,
          to: selectedRequest.cliente_telefono,
          mensaje: `Plus Móvil: Su móvil #${movilNum} está en camino. Tiempo estimado: 5 a 10 min. ¡Gracias por su preferencia!`
        });
      } catch (waErr) {
        console.warn('WhatsApp confirmation not sent:', waErr.message);
      }

      setShowDispatchModal(false);
      setDispatchMovilId('');
      setDispatchZona('');
      setDispatchDestino('');
      setDispatchNotas('');
      fetchShiftStatus();
    } catch (err) {
      alert('Error asignando servicio: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDiscardRequest = async (id) => {
    if (!window.confirm('¿Descartar este mensaje?')) return;
    try {
      await api.post('/api/turno/solicitud/descartar', { solicitud_id: id });
      fetchShiftStatus();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="turno-loading glass-card">
        <div className="spinner" />
        <p>Cargando información del turno...</p>
      </div>
    );
  }

  // View: No active shift
  if (!shiftData || !shiftData.activo) {
    return (
      <div className="turno-inactive glass-card animate-fade-in">
        <div className="inactive-wrapper">
          <div className="inactive-icon">📡</div>
          <h2>No hay turno activo en curso</h2>
          <p>
            Para poder recibir solicitudes de WhatsApp, asignar servicios a los móviles y registrar cobros en caja, es necesario iniciar el turno de la cabina.
          </p>
          <button className="btn btn--primary btn--large" onClick={handleStartShift}>
            ▶️ Iniciar Turno de Trabajo
          </button>
        </div>
      </div>
    );
  }

  // View: Active shift Dashboard
  return (
    <div className="turno-active animate-fade-in">
      {/* Header bar */}
      <div className="turno-header glass-card">
        <div className="turno-header__left">
          <span className="live-dot" />
          <div>
            <h3>Turno de Cabina Activo</h3>
            <p className="subtitle">
              Operadora: <strong>{shiftData.turno.operadora?.nombre || 'Administrador'}</strong> · Fecha: {new Date(shiftData.turno.fecha).toLocaleDateString()} · Inicio: {shiftData.turno.hora_inicio}
            </p>
          </div>
        </div>
        <div className="turno-header__right">
          <div className="turno-stats-quick">
            <div className="quick-stat-badge">
              <span>🚗</span> {shiftData.asistencias.length} Móviles
            </div>
            <div className="quick-stat-badge">
              <span>💰</span> Bs. {shiftData.cobros.reduce((sum, c) => sum + Number(c.monto), 0)} Caja
            </div>
          </div>
          <button className="btn btn--danger" onClick={handleCloseShift}>
            🛑 Cerrar Turno
          </button>
        </div>
      </div>

      <div className="turno-grid">
        {/* COLUMN 1: WHATSAPP REQUESTS */}
        <div className="turno-column glass-card">
          <div className="column-header">
            <h4>💬 Chats Entrantes (WhatsApp)</h4>
            <span className="counter-badge">{whatsappRequests.length}</span>
          </div>
          <div className="column-content">
            {whatsappRequests.length === 0 ? (
              <div className="empty-state">
                <span>📭</span>
                <p>No hay mensajes de WhatsApp pendientes</p>
              </div>
            ) : (
              whatsappRequests.map((req) => (
                <div key={req.id} className={`whatsapp-request-card ${req.gps_latitud ? 'has-gps' : ''}`}>
                  <div className="request-meta">
                    <span className="request-sender">{req.cliente_nombre || req.cliente_telefono}</span>
                    <span className="request-time">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="request-body">
                    {req.mensaje}
                  </div>
                  {req.gps_latitud && (
                    <div className="request-gps-indicator">
                      📍 GPS Recibido: {req.gps_latitud}, {req.gps_longitud}
                    </div>
                  )}
                  <div className="request-actions">
                    <button 
                      className="btn btn--success btn--xs"
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowDispatchModal(true);
                      }}
                    >
                      🚕 Asignar Móvil
                    </button>
                    <button 
                      className="btn btn--secondary btn--xs"
                      onClick={() => handleDiscardRequest(req.id)}
                    >
                      ❌ Descartar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: DRIVERS / ATTENDANCES & SERVICES */}
        <div className="turno-column glass-card">
          {/* Top part: Active Mobiles */}
          <div className="column-sub-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '50%', marginBottom: '16px' }}>
            <div className="column-header">
              <h4>🚗 Móviles en el Turno</h4>
              <button className="btn btn--xs btn--primary" onClick={() => setShowAttendanceModal(true)}>
                ➕ Registrar Entrada
              </button>
            </div>
            <div className="column-content" style={{ maxHeight: '200px' }}>
              {shiftData.asistencias.length === 0 ? (
                <div className="empty-state">
                  <span>🚗</span>
                  <p>Ningún móvil ha ingresado</p>
                </div>
              ) : (
                <div className="asistencias-list">
                  {shiftData.asistencias.map((ast) => (
                    <div key={ast.id} className="asistencia-row">
                      <div className="movil-badge">
                        Móvil {ast.chofer?.numero_movil || '—'}
                      </div>
                      <div className="movil-details">
                        <p className="driver-name">{ast.chofer?.nombre}</p>
                        <p className="arrival-time">
                          Ingreso: {new Date(ast.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="movil-status-indicator">
                        <span className="dot-green" /> Disp.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom part: Dispatched Services */}
          <div className="column-sub-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '45%', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div className="column-header">
              <h4>🚕 Servicios Despachados</h4>
              <span className="counter-badge" style={{ backgroundColor: 'var(--accent-green)' }}>
                {shiftData.servicios.length}
              </span>
            </div>
            <div className="column-content">
              {shiftData.servicios.length === 0 ? (
                <div className="empty-state">
                  <span>🚕</span>
                  <p>No se han despachado servicios aún</p>
                </div>
              ) : (
                <div className="servicios-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shiftData.servicios.map((srv) => (
                    <div key={srv.id} className="servicio-row-card">
                      <div className="servicio-row-header">
                        <span className="servicio-movil-tag">Móvil {srv.chofer?.numero_movil || '—'}</span>
                        <span className="servicio-time">
                          {new Date(srv.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="servicio-row-body">
                        <p className="servicio-client"><strong>Cliente:</strong> {srv.cliente?.nombre || 'WhatsApp'}</p>
                        <p className="servicio-route"><strong>Zona:</strong> {srv.zona || 'N/D'} → {srv.destino}</p>
                        {srv.notas && <p className="servicio-notes">⚠️ {srv.notas}</p>}
                      </div>
                      <div className="servicio-row-status">
                        <span className="badge badge--green" style={{ fontSize: '10px', padding: '2px 6px' }}>Completado</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: CASH / RECENT PAYMENTS */}
        <div className="turno-column glass-card">
          <div className="column-header">
            <h4>💰 Caja y Cobros Rápidos</h4>
            <button className="btn btn--xs btn--primary" onClick={() => setShowPaymentModal(true)}>
              💵 Cobro Rápido
            </button>
          </div>
          <div className="column-content">
            {shiftData.cobros.length === 0 ? (
              <div className="empty-state">
                <span>💵</span>
                <p>No se han registrado cobros en este turno</p>
              </div>
            ) : (
              <div className="cobros-list">
                {shiftData.cobros.map((cob) => (
                  <div key={cob.id} className="cobro-row">
                    <div className="cobro-row__left">
                      <span className="cobro-concept">{cob.concepto}</span>
                      <span className="cobro-driver">Móvil {cob.chofer?.numero_movil}</span>
                    </div>
                    <div className="cobro-row__right">
                      <span className="cobro-amount">Bs. {cob.monto}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: REGISTRAR ENTRADA (ASISTENCIA) */}
      {showAttendanceModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-up">
            <h3>Registrar Entrada de Móvil</h3>
            <form onSubmit={handleRegisterAttendance}>
              <div className="form-group">
                <label>Seleccionar Chofer/Móvil</label>
                <select 
                  value={attendanceMovilId} 
                  onChange={(e) => setAttendanceMovilId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Móvil --</option>
                  {choferesList.map(c => (
                    <option key={c.id} value={c.id}>
                      Móvil {c.numero_movil} - {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group-checkbox">
                <input 
                  type="checkbox" 
                  id="limpieza" 
                  checked={attendanceLimpieza} 
                  onChange={(e) => setAttendanceLimpieza(e.target.checked)}
                />
                <label htmlFor="limpieza">Vehículo Limpio (Inspección visual)</label>
              </div>
              <div className="form-group">
                <label>Notas / Observaciones</label>
                <input 
                  type="text" 
                  value={attendanceNotas} 
                  onChange={(e) => setAttendanceNotas(e.target.value)}
                  placeholder="Ej. Ingreso tarde, parabrisas trizado"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowAttendanceModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn--success">Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COBRO RÁPIDO */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-up">
            <h3>Registrar Cobro Rápido</h3>
            <form onSubmit={handleRegisterPayment}>
              <div className="form-group">
                <label>Móvil</label>
                <select 
                  value={paymentMovilId} 
                  onChange={(e) => setPaymentMovilId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Móvil --</option>
                  {choferesList.map(c => (
                    <option key={c.id} value={c.id}>
                      Móvil {c.numero_movil} - {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Concepto de Pago</label>
                <select 
                  value={paymentConcept} 
                  onChange={(e) => {
                    setPaymentConcept(e.target.value);
                    if (e.target.value === 'Turno Libre') setPaymentAmount('10');
                    if (e.target.value === 'Limpieza') setPaymentAmount('5');
                    if (e.target.value === 'Multa') setPaymentAmount('20');
                  }}
                  required
                >
                  <option value="Turno Libre">Turno Libre (Bs. 10)</option>
                  <option value="Limpieza">Servicio Limpieza (Bs. 5)</option>
                  <option value="Multa">Multa por Retraso (Bs. 20)</option>
                  <option value="Abono">Abono Diario (Bs. 15)</option>
                  <option value="Otro">Otro concepto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto (Bs.)</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input 
                  type="text" 
                  value={paymentNotas} 
                  onChange={(e) => setPaymentNotas(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowPaymentModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn--success">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASIGNAR MÓVIL (DESPACHO SERVICIO) */}
      {showDispatchModal && selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-up">
            <h3>🚕 Despachar Servicio Móvil</h3>
            <div className="request-preview glass-card">
              <p><strong>Cliente:</strong> {selectedRequest.cliente_nombre} ({selectedRequest.cliente_telefono})</p>
              <p><strong>Mensaje:</strong> "{selectedRequest.mensaje}"</p>
            </div>
            <form onSubmit={handleDispatchService}>
              <div className="form-group">
                <label>Móvil Asignado</label>
                <select 
                  value={dispatchMovilId} 
                  onChange={(e) => setDispatchMovilId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Móvil en Turno --</option>
                  {/* List only drivers registered in this shift */}
                  {shiftData.asistencias.map(ast => (
                    <option key={ast.chofer_id} value={ast.chofer_id}>
                      Móvil {ast.chofer?.numero_movil} - {ast.chofer?.nombre}
                    </option>
                  ))}
                </select>
                {shiftData.asistencias.length === 0 && (
                  <p className="error-text">⚠️ No hay móviles en turno. Primero registre la asistencia de un móvil.</p>
                )}
              </div>
              <div className="form-group">
                <label>Zona / Punto de Recojo</label>
                <input 
                  type="text" 
                  value={dispatchZona} 
                  onChange={(e) => setDispatchZona(e.target.value)}
                  placeholder="Ej. Barrio Las Panosas, Calle Colón"
                  required
                />
              </div>
              <div className="form-group">
                <label>Destino (Opcional)</label>
                <input 
                  type="text" 
                  value={dispatchDestino} 
                  onChange={(e) => setDispatchDestino(e.target.value)}
                  placeholder="Ej. Mercado Central"
                />
              </div>
              <div className="form-group">
                <label>Notas para el Chofer</label>
                <input 
                  type="text" 
                  value={dispatchNotas} 
                  onChange={(e) => setDispatchNotas(e.target.value)}
                  placeholder="Ej. Casa reja verde, tocar bocina"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowDispatchModal(false)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn--success" 
                  disabled={shiftData.asistencias.length === 0}
                >
                  🚀 Confirmar y Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
