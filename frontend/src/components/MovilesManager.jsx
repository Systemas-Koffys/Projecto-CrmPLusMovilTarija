import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { 
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlinePencilAlt
} from 'react-icons/hi';
import './MovilesManager.css';

export default function MovilesManager() {
  const { role } = useAuth();
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewType, setViewType] = useState('cards'); // 'cards' or 'list'
  
  // Photo Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Quick Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMobile, setEditingMobile] = useState(null);
  const [editForm, setEditForm] = useState({
    numero_movil: '',
    es_socio: false,
    estado: 'activo',
    foto_auto_url: '',
    foto_placa_url: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const canEdit = role === 'admin' || role === 'personal';

  useEffect(() => {
    fetchMobiles();
  }, []);

  const fetchMobiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/choferes');
      const list = data.filter(item => item.numero_movil && item.numero_movil.trim() !== '');
      setMobiles(list);
    } catch (err) {
      console.error('Error fetching mobiles:', err);
      setError('No se pudo cargar la flota de móviles. Por favor, reintente.');
    } finally {
      setLoading(false);
    }
  };

  // Inline status changer handler
  const handleStatusChange = async (mobileId, newStatus) => {
    try {
      await api.put(`/api/choferes/${mobileId}`, { estado: newStatus });
      setMobiles(mobiles.map(m => m.id === mobileId ? { ...m, estado: newStatus } : m));
    } catch (err) {
      alert(`Error al actualizar el estado: ${err.message}`);
    }
  };

  // Open edit modal
  const handleOpenEditModal = (mobile) => {
    setEditingMobile(mobile);
    setEditForm({
      numero_movil: mobile.numero_movil || '',
      es_socio: !!mobile.es_socio,
      estado: mobile.estado || 'activo',
      foto_auto_url: mobile.foto_auto_url || '',
      foto_placa_url: mobile.foto_placa_url || ''
    });
    setShowEditModal(true);
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.numero_movil.trim()) {
      alert('El número de móvil es requerido.');
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await api.put(`/api/choferes/${editingMobile.id}`, editForm);
      setMobiles(mobiles.map(m => m.id === editingMobile.id ? { ...m, ...updated } : m));
      setShowEditModal(false);
      setEditingMobile(null);
    } catch (err) {
      alert(`Error al actualizar los datos del móvil: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter mobiles based on search query and status filter
  const filteredMobiles = mobiles.filter(mobile => {
    const matchesSearch = 
      mobile.numero_movil.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mobile.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mobile.ci && mobile.ci.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === 'all' || mobile.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count stats
  const stats = {
    total: mobiles.length,
    activos: mobiles.filter(m => m.estado === 'activo').length,
    inactivos: mobiles.filter(m => m.estado === 'inactivo').length,
    suspendidos: mobiles.filter(m => m.estado === 'suspendido').length
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'activo': return 'mobile-status-badge--active';
      case 'inactivo': return 'mobile-status-badge--inactive';
      case 'suspendido': return 'mobile-status-badge--suspended';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'suspendido': return 'Suspendido';
      default: return status;
    }
  };

  return (
    <div className="moviles-manager animate-fade-in">
      {/* Header Area */}
      <div className="moviles-header">
        <div>
          <h2 className="moviles-title">Flota de Móviles</h2>
          <p className="moviles-subtitle">Monitoreo compacto y gestión de vehículos autorizados de Plus Móvil</p>
        </div>
        <div className="header-actions">
          {/* View Switcher Toggles */}
          <div className="view-switcher glass-card">
            <button 
              className={`switch-btn ${viewType === 'cards' ? 'switch-btn--active' : ''}`}
              onClick={() => setViewType('cards')}
              title="Vista de Tarjetas"
            >
              <HiOutlineViewGrid />
            </button>
            <button 
              className={`switch-btn ${viewType === 'list' ? 'switch-btn--active' : ''}`}
              onClick={() => setViewType('list')}
              title="Vista de Tabla"
            >
              <HiOutlineViewList />
            </button>
          </div>
          
          <button className="btn-refresh glass-card" onClick={fetchMobiles} title="Actualizar datos">
            <HiOutlineRefresh className="refresh-icon" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="moviles-stats-bar glass-card">
        <div className="bar-stat">
          <span className="bar-stat-val text-cyan">{stats.total}</span>
          <span className="bar-stat-lbl">Registrados</span>
        </div>
        <div className="bar-stat-divider"></div>
        <div className="bar-stat">
          <span className="bar-stat-val text-green">{stats.activos}</span>
          <span className="bar-stat-lbl">Activos</span>
        </div>
        <div className="bar-stat-divider"></div>
        <div className="bar-stat">
          <span className="bar-stat-val text-gray">{stats.inactivos}</span>
          <span className="bar-stat-lbl">Fuera de Turno</span>
        </div>
        <div className="bar-stat-divider"></div>
        <div className="bar-stat">
          <span className="bar-stat-val text-red">{stats.suspendidos}</span>
          <span className="bar-stat-lbl">Suspendidos</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="moviles-toolbar glass-card">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nro. de móvil, conductor o CI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <HiOutlineFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="moviles-error glass-card">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loader */}
      {loading ? (
        <div className="moviles-loader">
          <div className="spinner"></div>
          <p>Cargando información de la flota...</p>
        </div>
      ) : (
        <>
          {filteredMobiles.length === 0 ? (
            <div className="moviles-empty glass-card">
              <HiOutlineTruck className="empty-icon" />
              <h3>No se encontraron unidades</h3>
              <p>Intente modificando los parámetros de búsqueda o filtros.</p>
            </div>
          ) : (
            <>
              {/* Conditional Rendering based on viewType */}
              {viewType === 'cards' ? (
                /* Cards View (Redesigned & Compact) */
                <div className="moviles-grid moviles-grid--compact">
                  {filteredMobiles.map((mobile) => (
                    <div key={mobile.id} className="mobile-card mobile-card--compact glass-card">
                      
                      {/* Top banner: unit number, edit button and status select */}
                      <div className="mobile-card-top">
                        <div className="unit-badge">
                          <span className="unit-label">Móvil</span>
                          <span className="unit-num">{mobile.numero_movil}</span>
                        </div>
                        
                        <div className="top-right-actions">
                          {canEdit && (
                            <button 
                              className="btn-card-edit" 
                              onClick={() => handleOpenEditModal(mobile)}
                              title="Editar móvil"
                            >
                              <HiOutlinePencilAlt />
                            </button>
                          )}
                          
                          {canEdit ? (
                            <select
                              value={mobile.estado}
                              onChange={(e) => handleStatusChange(mobile.id, e.target.value)}
                              className={`status-select ${getStatusBadgeClass(mobile.estado)}`}
                            >
                              <option value="activo">🟢 Activo</option>
                              <option value="inactivo">⚪ Inactivo</option>
                              <option value="suspendido">🔴 Suspendido</option>
                            </select>
                          ) : (
                            <span className={`mobile-status-badge ${getStatusBadgeClass(mobile.estado)}`}>
                              <span className="status-dot"></span>
                              {getStatusLabel(mobile.estado)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Small Vehicle Preview thumbnails */}
                      <div className="mobile-card-previews">
                        <div className="preview-box">
                          {mobile.foto_auto_url ? (
                            <img 
                              src={mobile.foto_auto_url} 
                              alt="Auto" 
                              onClick={() => setSelectedPhoto({ url: mobile.foto_auto_url, title: `Vehículo del Móvil ${mobile.numero_movil}` })}
                            />
                          ) : (
                            <div className="preview-empty" title="Sin foto del auto">🚕</div>
                          )}
                          <span className="preview-label">Auto</span>
                        </div>
                        <div className="preview-box">
                          {mobile.foto_placa_url ? (
                            <img 
                              src={mobile.foto_placa_url} 
                              alt="Placa" 
                              onClick={() => setSelectedPhoto({ url: mobile.foto_placa_url, title: `Placa del Móvil ${mobile.numero_movil}` })}
                            />
                          ) : (
                            <div className="preview-empty" title="Sin foto de placa">📋</div>
                          )}
                          <span className="preview-label">Placa</span>
                        </div>
                      </div>

                      {/* Compact Driver Info */}
                      <div className="mobile-card-details">
                        <div className="detail-line font-bold">
                          <HiOutlineUser className="detail-icon icon-cyan" />
                          <span className="truncate" title={mobile.nombre}>{mobile.nombre}</span>
                        </div>
                        <div className="detail-line">
                          <HiOutlinePhone className="detail-icon" />
                          <span>{mobile.telefono || 'Sin número'}</span>
                        </div>
                        <div className="detail-line-footer">
                          <span className="ci-badge">CI: {mobile.ci || 'N/D'}</span>
                          <span className={`socio-badge ${mobile.es_socio ? 'socio-badge--true' : 'socio-badge--false'}`}>
                            {mobile.es_socio ? 'Socio' : 'Auxiliar'}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                /* List/Table View (New, High-density) */
                <div className="moviles-table-wrapper glass-card">
                  <table className="moviles-table">
                    <thead>
                      <tr>
                        <th>Móvil</th>
                        <th>Estado</th>
                        <th>Conductor</th>
                        <th>Teléfono</th>
                        <th>Cédula (CI)</th>
                        <th>Tipo</th>
                        <th>Fotos</th>
                        {canEdit && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMobiles.map((mobile) => (
                        <tr key={mobile.id}>
                          <td className="cell-movil">
                            <span className="taxi-emoji">🚕</span>
                            <strong>Móvil {mobile.numero_movil}</strong>
                          </td>
                          <td className="cell-status">
                            {canEdit ? (
                              <select
                                value={mobile.estado}
                                onChange={(e) => handleStatusChange(mobile.id, e.target.value)}
                                className={`table-status-select ${getStatusBadgeClass(mobile.estado)}`}
                              >
                                <option value="activo">🟢 Activo</option>
                                <option value="inactivo">⚪ Inactivo</option>
                                <option value="suspendido">🔴 Suspendido</option>
                              </select>
                            ) : (
                              <span className={`mobile-status-badge ${getStatusBadgeClass(mobile.estado)}`}>
                                <span className="status-dot"></span>
                                {getStatusLabel(mobile.estado)}
                              </span>
                            )}
                          </td>
                          <td className="cell-driver font-medium">{mobile.nombre}</td>
                          <td>{mobile.telefono || '—'}</td>
                          <td>{mobile.ci || '—'}</td>
                          <td>
                            <span className={`socio-badge ${mobile.es_socio ? 'socio-badge--true' : 'socio-badge--false'}`}>
                              {mobile.es_socio ? 'Socio' : 'Auxiliar'}
                            </span>
                          </td>
                          <td className="cell-photos">
                            <div className="table-photos">
                              {mobile.foto_auto_url ? (
                                <button 
                                  className="table-photo-btn"
                                  onClick={() => setSelectedPhoto({ url: mobile.foto_auto_url, title: `Auto del Móvil ${mobile.numero_movil}` })}
                                  title="Ver foto de auto"
                                >
                                  🚗
                                </button>
                              ) : <span className="photo-none">🚗</span>}
                              {mobile.foto_placa_url ? (
                                <button 
                                  className="table-photo-btn"
                                  onClick={() => setSelectedPhoto({ url: mobile.foto_placa_url, title: `Placa del Móvil ${mobile.numero_movil}` })}
                                  title="Ver placa"
                                >
                                  📋
                                </button>
                              ) : <span className="photo-none">📋</span>}
                            </div>
                          </td>
                          {canEdit && (
                            <td>
                              <button 
                                className="btn-table-edit"
                                onClick={() => handleOpenEditModal(mobile)}
                                title="Editar unidad"
                              >
                                <HiOutlinePencilAlt />
                                <span>Editar</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Image Lightbox Modal */}
      {selectedPhoto && (
        <div className="lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content glass-card animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <h3>{selectedPhoto.title}</h3>
              <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className="lightbox-body">
              <img src={selectedPhoto.url} alt={selectedPhoto.title} />
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {showEditModal && editingMobile && (
        <div className="lightbox-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content glass-card animate-fade-up" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Datos del Móvil {editingMobile.numero_movil}</h3>
              <button className="lightbox-close" onClick={() => setShowEditModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="edit-mobile-form">
              <div className="form-group">
                <label>Número de Móvil / Unidad</label>
                <input
                  type="text"
                  required
                  value={editForm.numero_movil}
                  onChange={(e) => setEditForm({ ...editForm, numero_movil: e.target.value })}
                />
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="es_socio"
                  checked={editForm.es_socio}
                  onChange={(e) => setEditForm({ ...editForm, es_socio: e.target.checked })}
                />
                <label htmlFor="es_socio">¿El conductor es Socio Propietario?</label>
              </div>

              <div className="form-group">
                <label>Estado del Móvil</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              <div className="form-group">
                <label>URL Foto de Vehículo</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/auto.jpg"
                  value={editForm.foto_auto_url}
                  onChange={(e) => setEditForm({ ...editForm, foto_auto_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>URL Foto de Placa</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/placa.jpg"
                  value={editForm.foto_placa_url}
                  onChange={(e) => setEditForm({ ...editForm, foto_placa_url: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowEditModal(false)}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
