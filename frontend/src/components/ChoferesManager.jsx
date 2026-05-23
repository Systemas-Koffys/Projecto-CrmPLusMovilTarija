import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  HiOutlineUserAdd, 
  HiOutlinePhone, 
  HiOutlineIdentification, 
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineX
} from 'react-icons/hi';
import './ChoferesManager.css';

export default function ChoferesManager({ viewMode }) {
  const [choferes, setChoferes] = useState([]);
  const [selectedChofer, setSelectedChofer] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New incidentes and tab states
  const [activeTab, setActiveTab] = useState('docs');
  const [incidentes, setIncidentes] = useState([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    tipo: 'falta_uniforme',
    descripcion: '',
    gravedad: 'leve',
    fecha: new Date().toISOString().split('T')[0],
    aplica_multa: false,
    monto_multa: ''
  });

  // Modals state
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [isEditingDriver, setIsEditingDriver] = useState(false);

  // Driver form state
  const [driverForm, setDriverForm] = useState({
    nombre: '',
    ci: '',
    telefono: '',
    telefono_emergencia: '',
    tipo_sangre: '',
    numero_movil: '',
    es_socio: false,
    estado: 'activo',
    notas: ''
  });

  // Document form state
  const [docForm, setDocForm] = useState({
    tipo: 'soat',
    fecha_emision: '',
    fecha_vencimiento: '',
    archivo_url: '',
    notas: ''
  });

  useEffect(() => {
    fetchChoferes();
  }, []);

  useEffect(() => {
    if (selectedChofer) {
      fetchDocumentos(selectedChofer.id);
      fetchIncidentes(selectedChofer.id);
    } else {
      setDocumentos([]);
      setIncidentes([]);
    }
  }, [selectedChofer]);

  const fetchChoferes = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/choferes');
      setChoferes(data);
      setError(null);
    } catch (err) {
      setError('Error al obtener la lista de choferes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentos = async (choferId) => {
    try {
      const data = await api.get(`/api/choferes/${choferId}/documentos`);
      setDocumentos(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const fetchIncidentes = async (choferId) => {
    try {
      const data = await api.get(`/api/choferes/${choferId}/incidentes`);
      setIncidentes(data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  const handleAddIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.descripcion.trim()) {
      alert('Por favor ingresa una descripción para el incidente.');
      return;
    }
    setIsSavingIncident(true);
    try {
      const created = await api.post(`/api/choferes/${selectedChofer.id}/incidentes`, incidentForm);
      setIncidentes([created, ...incidentes]);
      setShowIncidentModal(false);
      setIncidentForm({
        tipo: 'falta_uniforme',
        descripcion: '',
        gravedad: 'leve',
        fecha: new Date().toISOString().split('T')[0],
        aplica_multa: false,
        monto_multa: ''
      });
    } catch (err) {
      alert(`Error al registrar incidente: ${err.message}`);
    } finally {
      setIsSavingIncident(false);
    }
  };

  const handlePayFine = async (incidenteId) => {
    if (!window.confirm('¿Confirmar el cobro de esta multa y registrar el ingreso en caja?')) return;
    try {
      const result = await api.post(`/api/choferes/${selectedChofer.id}/incidentes/${incidenteId}/pagar`);
      alert(result.message || 'Multa pagada con éxito.');
      setIncidentes(incidentes.map(inc => inc.id === incidenteId ? { ...inc, estado_multa: 'pagado' } : inc));
    } catch (err) {
      alert(`Error al pagar la multa: ${err.message}`);
    }
  };

  const handleDeleteIncident = async (incidenteId) => {
    if (!window.confirm('¿Está seguro de eliminar este incidente del historial del chofer?')) return;
    try {
      await api.delete(`/api/choferes/${selectedChofer.id}/incidentes/${incidenteId}`);
      setIncidentes(incidentes.filter(inc => inc.id !== incidenteId));
    } catch (err) {
      alert(`Error al eliminar incidente: ${err.message}`);
    }
  };

  const getIncidentLabel = (tipo) => {
    const labels = {
      accidente: 'Accidente de Tránsito',
      falta_uniforme: 'Falta de Uniforme',
      retraso_turno: 'Retraso de Turno',
      queja_cliente: 'Queja de Cliente',
      mal_comportamiento: 'Mal Comportamiento',
      limpieza_vehiculo: 'Limpieza de Vehículo',
      otro: 'Otro Incidente'
    };
    return labels[tipo] || tipo.toUpperCase();
  };

  const getGravedadBadgeClass = (gravedad) => {
    switch (gravedad) {
      case 'grave': return 'badge--red';
      case 'moderada': return 'badge--yellow';
      default: return 'badge--green';
    }
  };

  const getIncidentIcon = (tipo, severity) => {
    switch (tipo) {
      case 'accidente': return '💥';
      case 'falta_uniforme': return '👔';
      case 'retraso_turno': return '⏱️';
      case 'queja_cliente': return '🗣️';
      case 'mal_comportamiento': return '😠';
      case 'limpieza_vehiculo': return '🧹';
      default: return '⚠️';
    }
  };

  const handleOpenNewDriver = () => {
    setIsEditingDriver(false);
    setDriverForm({
      nombre: '',
      ci: '',
      telefono: '',
      telefono_emergencia: '',
      tipo_sangre: '',
      numero_movil: '',
      es_socio: false,
      estado: 'activo',
      notas: ''
    });
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (chofer) => {
    setIsEditingDriver(true);
    setDriverForm({
      nombre: chofer.nombre || '',
      ci: chofer.ci || '',
      telefono: chofer.telefono || '',
      telefono_emergencia: chofer.telefono_emergencia || '',
      tipo_sangre: chofer.tipo_sangre || '',
      numero_movil: chofer.numero_movil || '',
      es_socio: !!chofer.es_socio,
      estado: chofer.estado || 'activo',
      notas: chofer.notas || ''
    });
    setShowDriverModal(true);
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingDriver) {
        const updated = await api.put(`/api/choferes/${selectedChofer.id}`, driverForm);
        setChoferes(choferes.map(c => c.id === selectedChofer.id ? updated : c));
        setSelectedChofer(updated);
      } else {
        const created = await api.post('/api/choferes', driverForm);
        setChoferes([...choferes, created]);
      }
      setShowDriverModal(false);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddDoc = async (e) => {
    e.preventDefault();
    try {
      const created = await api.post(`/api/choferes/${selectedChofer.id}/documentos`, docForm);
      setDocumentos([created, ...documentos]);
      setShowDocModal(false);
      setDocForm({
        tipo: 'soat',
        fecha_emision: '',
        fecha_vencimiento: '',
        archivo_url: '',
        notas: ''
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('¿Está seguro de eliminar este documento?')) return;
    try {
      await api.delete(`/api/choferes/${selectedChofer.id}/documentos/${docId}`);
      setDocumentos(documentos.filter(d => d.id !== docId));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getDocBadgeClass = (estado) => {
    switch (estado) {
      case 'vencido': return 'badge--red';
      case 'por_vencer': return 'badge--yellow';
      default: return 'badge--green';
    }
  };

  const getDocLabel = (tipo) => {
    const labels = {
      soat: 'SOAT',
      revision_tecnica: 'Rev. Técnica',
      licencia: 'Licencia',
      poliza: 'Póliza',
      otro: 'Otro'
    };
    return labels[tipo] || tipo.toUpperCase();
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'suspendido': return 'badge--yellow';
      case 'inactivo': return 'badge--red';
      default: return 'badge--green';
    }
  };

  return (
    <div className="choferes-manager animate-fade-in">
      {/* Title Header */}
      <div className="choferes-header">
        <div>
          <h2 className="choferes-title">
            {viewMode === 'personal' ? 'Control de Personal' : 'Fichas de Choferes'}
          </h2>
          <p className="choferes-subtitle">
            {viewMode === 'personal' ? 'Configuración de perfiles y roles del sistema' : 'Directorio de conductores, móviles asociados y vencimiento de SOAT/licencias'}
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenNewDriver}>
          <HiOutlineUserAdd style={{ marginRight: 8, fontSize: 18 }} />
          Registrar Chofer
        </button>
      </div>

      {error && (
        <div className="choferes-error">
          <HiOutlineExclamationCircle style={{ fontSize: 20, marginRight: 8 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="choferes-loader">
          <div className="spinner" />
          <p>Cargando información...</p>
        </div>
      ) : (
        <div className="choferes-grid">
          {/* Left Column: List */}
          <div className="choferes-list-container glass-card">
            <h3 className="choferes-panel-title">Lista de Conductores ({choferes.length})</h3>
            <div className="choferes-list">
              {choferes.map((chofer) => (
                <div 
                  key={chofer.id} 
                  className={`chofer-item ${selectedChofer?.id === chofer.id ? 'chofer-item--selected' : ''}`}
                  onClick={() => setSelectedChofer(chofer)}
                >
                  <div className="chofer-item__avatar">
                    {chofer.foto_url ? (
                      <img src={chofer.foto_url} alt={chofer.nombre} />
                    ) : (
                      <span>🚗</span>
                    )}
                  </div>
                  <div className="chofer-item__content">
                    <div className="chofer-item__title">
                      <span className="chofer-item__name">{chofer.nombre}</span>
                      <span className={`badge ${getEstadoBadgeClass(chofer.estado)}`}>
                        {chofer.estado}
                      </span>
                    </div>
                    <div className="chofer-item__details">
                      <span>Móvil: <strong>{chofer.numero_movil || '—'}</strong></span>
                      <span>CI: {chofer.ci || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {choferes.length === 0 && (
                <div className="choferes-empty">
                  No hay choferes registrados en el sistema.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Driver Details */}
          <div className="choferes-detail-container glass-card">
            {selectedChofer ? (
              <div className="chofer-detail animate-fade-in">
                {/* Detail Header */}
                <div className="chofer-detail__header">
                  <div className="chofer-detail__avatar-large">
                    {selectedChofer.foto_url ? (
                      <img src={selectedChofer.foto_url} alt={selectedChofer.nombre} />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div className="chofer-detail__main-info">
                    <h3 className="chofer-detail__name">{selectedChofer.nombre}</h3>
                    <div className="chofer-detail__badges">
                      <span className={`badge ${selectedChofer.es_socio ? 'badge--cyan' : 'badge--purple'}`}>
                        {selectedChofer.es_socio ? 'Socio' : 'Asalariado'}
                      </span>
                      <span className={`badge ${getEstadoBadgeClass(selectedChofer.estado)}`}>
                        {selectedChofer.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn btn--secondary btn--icon-only" 
                    onClick={() => handleOpenEditDriver(selectedChofer)}
                    title="Editar Chofer"
                  >
                    <HiOutlinePencilAlt />
                  </button>
                </div>

                {/* Personal Info Grid */}
                <div className="chofer-detail__section">
                  <h4>Información Personal</h4>
                  <div className="chofer-info-grid">
                    <div className="chofer-info-field">
                      <HiOutlineIdentification className="chofer-info-icon" />
                      <div>
                        <span className="chofer-info-label">Cédula de Identidad (CI)</span>
                        <span className="chofer-info-value">{selectedChofer.ci || '—'}</span>
                      </div>
                    </div>
                    <div className="chofer-info-field">
                      <HiOutlinePhone className="chofer-info-icon" />
                      <div>
                        <span className="chofer-info-label">Teléfono</span>
                        <span className="chofer-info-value">{selectedChofer.telefono || '—'}</span>
                      </div>
                    </div>
                    <div className="chofer-info-field">
                      <HiOutlinePhone className="chofer-info-icon" />
                      <div>
                        <span className="chofer-info-label">Contacto Emergencia</span>
                        <span className="chofer-info-value">{selectedChofer.telefono_emergencia || '—'}</span>
                      </div>
                    </div>
                    <div className="chofer-info-field">
                      <HiOutlineUserAdd className="chofer-info-icon" />
                      <div>
                        <span className="chofer-info-label">Tipo de Sangre</span>
                        <span className="chofer-info-value">{selectedChofer.tipo_sangre || '—'}</span>
                      </div>
                    </div>
                  </div>
                  {selectedChofer.notas && (
                    <div className="chofer-notes">
                      <strong>Notas adicionales:</strong>
                      <p>{selectedChofer.notas}</p>
                    </div>
                  )}
                </div>

                {/* Tab Navigation */}
                <div className="chofer-detail__tabs">
                  <button 
                    className={`chofer-detail__tab ${activeTab === 'docs' ? 'chofer-detail__tab--active' : ''}`}
                    onClick={() => setActiveTab('docs')}
                  >
                    Documentos
                  </button>
                  <button 
                    className={`chofer-detail__tab ${activeTab === 'incidents' ? 'chofer-detail__tab--active' : ''}`}
                    onClick={() => setActiveTab('incidents')}
                  >
                    Incidentes y Multas
                  </button>
                </div>

                {/* Tab Content: Documents */}
                {activeTab === 'docs' && (
                  <div className="chofer-detail__section animate-fade-in">
                    <div className="chofer-section-header">
                      <h4>Vencimiento de Documentación</h4>
                      <button className="btn btn--secondary btn--sm" onClick={() => setShowDocModal(true)}>
                        <HiOutlinePlus style={{ marginRight: 4 }} />
                        Agregar Doc
                      </button>
                    </div>
                    
                    <div className="documentos-list">
                      {documentos.map((doc) => (
                        <div key={doc.id} className="doc-item glass-card">
                          <div className="doc-item__icon">
                            <HiOutlineDocumentText />
                          </div>
                          <div className="doc-item__content">
                            <div className="doc-item__header">
                              <span className="doc-item__title">{getDocLabel(doc.tipo)}</span>
                              <span className={`badge ${getDocBadgeClass(doc.estado)}`}>
                                {doc.estado.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="doc-item__dates">
                              <span>Vence: <strong>{doc.fecha_vencimiento || 'Sin límite'}</strong></span>
                            </div>
                          </div>
                          <button className="doc-item__delete" onClick={() => handleDeleteDoc(doc.id)}>
                            <HiOutlineTrash />
                          </button>
                        </div>
                      ))}
                      {documentos.length === 0 && (
                        <div className="documentos-empty">
                          No hay documentos registrados para este chofer.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Incidents */}
                {activeTab === 'incidents' && (
                  <div className="chofer-detail__section animate-fade-in">
                    <div className="chofer-section-header">
                      <h4>Historial de Incidentes y Multas</h4>
                      <button className="btn btn--secondary btn--sm" onClick={() => setShowIncidentModal(true)}>
                        <HiOutlinePlus style={{ marginRight: 4 }} />
                        Registrar Incidente
                      </button>
                    </div>

                    <div className="incidentes-list">
                      {incidentes.map((inc) => (
                        <div key={inc.id} className="incident-item glass-card">
                          <div className="incident-item__main">
                            <div className={`incident-item__icon incident-item__icon--${inc.gravedad}`}>
                              {getIncidentIcon(inc.tipo, inc.gravedad)}
                            </div>
                            <div className="incident-item__content">
                              <div className="incident-item__header">
                                <div className="incident-item__title-group">
                                  <span className="incident-item__title">{getIncidentLabel(inc.tipo)}</span>
                                  <span className={`badge ${getGravedadBadgeClass(inc.gravedad)}`}>
                                    {inc.gravedad.toUpperCase()}
                                  </span>
                                </div>
                                <span className="incident-item__date">{inc.fecha}</span>
                              </div>
                              <p className="incident-item__desc">{inc.descripcion}</p>

                              {inc.estado_multa && inc.estado_multa !== 'no_aplica' && (
                                <div className="incident-item__fine">
                                  <div className="incident-item__fine-info">
                                    <span className="incident-item__fine-label">Multa:</span>
                                    <span className="incident-item__fine-amount">{parseFloat(inc.monto_multa).toFixed(2)} BOB</span>
                                    <span className={`incident-item__fine-status incident-item__fine-status--${inc.estado_multa}`}>
                                      {inc.estado_multa.toUpperCase()}
                                    </span>
                                  </div>
                                  {inc.estado_multa === 'pendiente' && (
                                    <div className="incident-item__actions">
                                      <button 
                                        className="btn btn--primary btn--sm"
                                        onClick={() => handlePayFine(inc.id)}
                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                      >
                                        Cobrar Multa
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button className="incident-item__delete" onClick={() => handleDeleteIncident(inc.id)}>
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                      {incidentes.length === 0 && (
                        <div className="incidentes-empty">
                          No hay incidentes registrados para este chofer.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="choferes-empty-selection">
                <div className="choferes-empty-selection__icon">🚗</div>
                <h3>Selecciona un conductor</h3>
                <p>Selecciona un chofer de la lista de la izquierda para ver su ficha completa, fotos de vehículos y vigencia de sus documentos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Driver Add/Edit Modal */}
      {showDriverModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>{isEditingDriver ? 'Editar Chofer' : 'Registrar Nuevo Chofer'}</h3>
              <button className="modal-close" onClick={() => setShowDriverModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleDriverSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input 
                    type="text" 
                    value={driverForm.nombre} 
                    onChange={e => setDriverForm({...driverForm, nombre: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Cédula de Identidad (CI)</label>
                  <input 
                    type="text" 
                    value={driverForm.ci} 
                    onChange={e => setDriverForm({...driverForm, ci: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Número de Móvil</label>
                  <input 
                    type="text" 
                    value={driverForm.numero_movil} 
                    onChange={e => setDriverForm({...driverForm, numero_movil: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input 
                    type="text" 
                    value={driverForm.telefono} 
                    onChange={e => setDriverForm({...driverForm, telefono: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Contacto de Emergencia</label>
                  <input 
                    type="text" 
                    value={driverForm.telefono_emergencia} 
                    onChange={e => setDriverForm({...driverForm, telefono_emergencia: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Sangre</label>
                  <input 
                    type="text" 
                    value={driverForm.tipo_sangre} 
                    onChange={e => setDriverForm({...driverForm, tipo_sangre: e.target.value})} 
                    placeholder="Ej. ORH+"
                  />
                </div>
                
                {/* Image Upload Placeholders */}
                <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '8px' }}>
                  <label style={{ color: 'var(--accent-cyan)' }}>📸 Fotografías (Módulo deshabilitado temporalmente)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11px' }}>Foto de Perfil del Conductor</label>
                      <input type="file" className="input" disabled title="Esta función se habilitará tras configurar el Storage" accept="image/*" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px' }}>Foto del Vehículo (Frontal)</label>
                      <input type="file" className="input" disabled title="Esta función se habilitará tras configurar el Storage" accept="image/*" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px' }}>Foto del Vehículo (Lateral/Placa)</label>
                      <input type="file" className="input" disabled title="Esta función se habilitará tras configurar el Storage" accept="image/*" />
                    </div>
                  </div>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={driverForm.es_socio} 
                      onChange={e => setDriverForm({...driverForm, es_socio: e.target.checked})} 
                    />
                    Es Socio Propietario
                  </label>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select 
                    value={driverForm.estado} 
                    onChange={e => setDriverForm({...driverForm, estado: e.target.value})}
                  >
                    <option value="activo">Activo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notas / Observaciones</label>
                <textarea 
                  value={driverForm.notes} 
                  onChange={e => setDriverForm({...driverForm, notas: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowDriverModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  {isEditingDriver ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>Agregar Documento</h3>
              <button className="modal-close" onClick={() => setShowDocModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleAddDoc} className="modal-form">
              <div className="form-group">
                <label>Tipo de Documento</label>
                <select 
                  value={docForm.tipo} 
                  onChange={e => setDocForm({...docForm, tipo: e.target.value})}
                >
                  <option value="soat">SOAT</option>
                  <option value="revision_tecnica">Revisión Técnica</option>
                  <option value="licencia">Licencia de Conducir</option>
                  <option value="poliza">Póliza de Seguro</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de Emisión</label>
                <input 
                  type="date" 
                  value={docForm.fecha_emision} 
                  onChange={e => setDocForm({...docForm, fecha_emision: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Fecha de Vencimiento</label>
                <input 
                  type="date" 
                  value={docForm.fecha_vencimiento} 
                  onChange={e => setDocForm({...docForm, fecha_vencimiento: e.target.value})} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Notas adicionales</label>
                <textarea 
                  value={docForm.notes} 
                  onChange={e => setDocForm({...docForm, notas: e.target.value})} 
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowDocModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Incident Modal */}
      {showIncidentModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Registrar Incidente</h3>
              <button className="modal-close" onClick={() => setShowIncidentModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleAddIncident} className="modal-form">
              <div className="form-group">
                <label>Tipo de Incidente</label>
                <select 
                  value={incidentForm.tipo} 
                  onChange={e => setIncidentForm({...incidentForm, tipo: e.target.value})}
                >
                  <option value="falta_uniforme">Falta de Uniforme</option>
                  <option value="retraso_turno">Retraso de Turno</option>
                  <option value="limpieza_vehiculo">Limpieza de Vehículo</option>
                  <option value="queja_cliente">Queja de Cliente</option>
                  <option value="mal_comportamiento">Mal Comportamiento</option>
                  <option value="accidente">Accidente de Tránsito</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-grid" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label>Gravedad</label>
                  <select 
                    value={incidentForm.gravedad} 
                    onChange={e => setIncidentForm({...incidentForm, gravedad: e.target.value})}
                  >
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="grave">Grave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    value={incidentForm.fecha} 
                    onChange={e => setIncidentForm({...incidentForm, fecha: e.target.value})} 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Detalle / Descripción</label>
                <textarea 
                  value={incidentForm.descripcion} 
                  onChange={e => setIncidentForm({...incidentForm, descripcion: e.target.value})} 
                  placeholder="Detalla lo sucedido..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group checkbox-group" style={{ margin: '8px 0' }}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={incidentForm.aplica_multa} 
                    onChange={e => setIncidentForm({...incidentForm, aplica_multa: e.target.checked})} 
                  />
                  Aplica Multa Económica
                </label>
              </div>

              {incidentForm.aplica_multa && (
                <div className="form-group animate-fade-in">
                  <label>Monto de la Multa (BOB)</label>
                  <input 
                    type="number" 
                    min="1"
                    step="1"
                    placeholder="Monto en Bolivianos (ej. 30)"
                    value={incidentForm.monto_multa} 
                    onChange={e => setIncidentForm({...incidentForm, monto_multa: e.target.value})} 
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowIncidentModal(false)} disabled={isSavingIncident}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={isSavingIncident}>
                  {isSavingIncident ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
