import { useState, useEffect } from 'react';
import api from '../utils/api';
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
  HiOutlineTruck
} from 'react-icons/hi';
import './MovilesManager.css';

export default function MovilesManager() {
  const [mobiles, setMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null); // lightbox state

  useEffect(() => {
    fetchMobiles();
  }, []);

  const fetchMobiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/choferes');
      // Filter only drivers that have a mobile number assigned
      const list = data.filter(item => item.numero_movil && item.numero_movil.trim() !== '');
      setMobiles(list);
    } catch (err) {
      console.error('Error fetching mobiles:', err);
      setError('No se pudo cargar la flota de móviles. Por favor, reintente.');
    } finally {
      setLoading(false);
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
          <h2 className="moviles-title">Control de Móviles</h2>
          <p className="moviles-subtitle">Gestión y estado en tiempo real de las unidades de transporte de Plus Móvil</p>
        </div>
        <button className="btn-refresh glass-card" onClick={fetchMobiles} title="Actualizar datos">
          <HiOutlineRefresh className="refresh-icon" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="moviles-stats-grid">
        <div className="moviles-stat-card glass-card stat-total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Unidades</div>
        </div>
        <div className="moviles-stat-card glass-card stat-active">
          <div className="stat-value">{stats.activos}</div>
          <div className="stat-label">Activos 🟢</div>
        </div>
        <div className="moviles-stat-card glass-card stat-inactive">
          <div className="stat-value">{stats.inactivos}</div>
          <div className="stat-label">Fuera de Turno ⚪</div>
        </div>
        <div className="moviles-stat-card glass-card stat-suspended">
          <div className="stat-value">{stats.suspendidos}</div>
          <div className="stat-label">Suspendidos 🔴</div>
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
            <option value="inactivo">Inactivos / Fuera de turno</option>
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
          <p>Obteniendo información de la flota...</p>
        </div>
      ) : (
        <>
          {/* Card Grid */}
          {filteredMobiles.length === 0 ? (
            <div className="moviles-empty glass-card">
              <HiOutlineTruck className="empty-icon" />
              <h3>No se encontraron unidades</h3>
              <p>Prueba ajustando la búsqueda o el filtro de estados.</p>
            </div>
          ) : (
            <div className="moviles-grid">
              {filteredMobiles.map((mobile) => (
                <div key={mobile.id} className="mobile-card glass-card">
                  {/* Card Header */}
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">
                      <span className="mobile-icon">🚕</span>
                      <span className="mobile-number">Móvil {mobile.numero_movil}</span>
                    </div>
                    <span className={`mobile-status-badge ${getStatusBadgeClass(mobile.estado)}`}>
                      <span className="status-dot"></span>
                      {getStatusLabel(mobile.estado)}
                    </span>
                  </div>

                  {/* Vehicle Image Container */}
                  <div className="vehicle-image-container">
                    {mobile.foto_auto_url ? (
                      <img 
                        src={mobile.foto_auto_url} 
                        alt={`Vehículo del Móvil ${mobile.numero_movil}`} 
                        className="vehicle-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = ''; // Clear source to trigger fallback block
                        }}
                      />
                    ) : (
                      <div className="vehicle-image-placeholder">
                        <div className="vehicle-placeholder-art">
                          <span className="placeholder-car-emoji">🚗</span>
                          <div className="placeholder-car-glow"></div>
                        </div>
                        <span className="placeholder-text">Sin foto de vehículo</span>
                      </div>
                    )}
                    {mobile.foto_auto_url && (
                      <button 
                        className="btn-lightbox"
                        onClick={() => setSelectedPhoto({ url: mobile.foto_auto_url, title: `Vehículo del Móvil ${mobile.numero_movil}` })}
                        title="Ampliar foto"
                      >
                        <HiOutlineEye />
                      </button>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  <div className="mobile-card-body">
                    <div className="info-section">
                      <h4 className="info-title">Conductor Asignado</h4>
                      <div className="info-row">
                        <HiOutlineUser className="info-icon" />
                        <span className="driver-name" title={mobile.nombre}>{mobile.nombre}</span>
                      </div>
                      <div className="info-row">
                        <HiOutlinePhone className="info-icon" />
                        <span>{mobile.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div className="info-row">
                        <HiOutlineIdentification className="info-icon" />
                        <span>CI: {mobile.ci || 'Sin CI'}</span>
                      </div>
                    </div>

                    <div className="info-divider"></div>

                    {/* Metadata & Actions */}
                    <div className="card-footer-meta">
                      <div className="meta-item">
                        <HiOutlineCalendar className="meta-icon" />
                        <span>Ingreso: {mobile.fecha_ingreso ? new Date(mobile.fecha_ingreso).toLocaleDateString('es-BO') : 'N/D'}</span>
                      </div>
                      <div className="meta-item">
                        <HiOutlineTag className="meta-icon" />
                        <span className={`badge-type ${mobile.es_socio ? 'badge-type--socio' : 'badge-type--chofer'}`}>
                          {mobile.es_socio ? 'Socio Owner' : 'Auxiliar'}
                        </span>
                      </div>
                    </div>

                    {/* Plate actions if exists */}
                    {mobile.foto_placa_url && (
                      <button 
                        className="btn-plate glass-card"
                        onClick={() => setSelectedPhoto({ url: mobile.foto_placa_url, title: `Placa del Móvil ${mobile.numero_movil}` })}
                      >
                        <HiOutlineEye className="meta-icon" />
                        <span>Ver foto de placa</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
