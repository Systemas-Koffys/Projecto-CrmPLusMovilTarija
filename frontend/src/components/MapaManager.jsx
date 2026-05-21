import { useState, useEffect } from 'react';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HiOutlineRefresh, HiOutlineMap, HiOutlineLocationMarker } from 'react-icons/hi';
import './MapaManager.css';

// Fix Leaflet default icon issues in React/Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to auto-pan the map when markers load or map updates
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      // Find bounding box or just center
      const bounds = L.latLngBounds(coords.map(c => [c.gps_latitud, c.gps_longitud]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

export default function MapaManager() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tarija center coordinates
  const defaultCenter = [-21.535, -64.73];
  const defaultZoom = 13;

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/analytics/mapa');
      setLocations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('No se pudieron cargar los datos de geolocalización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-manager-container animate-fade-in">
      {/* Header */}
      <div className="map-header">
        <div>
          <h2 className="map-title">Mapa de Servicios (Demanda GPS)</h2>
          <p className="map-subtitle">Zonas con mayor cantidad de solicitudes enviadas con ubicación satelital</p>
        </div>
        <button className="btn btn--secondary" onClick={fetchLocations}>
          <HiOutlineRefresh style={{ marginRight: 8 }} />
          Actualizar Mapa
        </button>
      </div>

      {/* Main Map Box */}
      <div className="map-wrapper-box glass-card">
        {loading ? (
          <div className="map-loader">
            <div className="spinner" />
            <p>Cargando mapa satelital y ubicaciones GPS...</p>
          </div>
        ) : error ? (
          <div className="map-error-panel">
            <p>{error}</p>
            <button className="btn btn--primary" onClick={fetchLocations}>
              Reintentar
            </button>
          </div>
        ) : (
          <div className="map-inner">
            <MapContainer 
              center={defaultCenter} 
              zoom={defaultZoom} 
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              
              {locations.map((loc) => {
                const date = new Date(loc.created_at).toLocaleTimeString('es-BO', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <Marker 
                    key={loc.id} 
                    position={[loc.gps_latitud, loc.gps_longitud]}
                  >
                    <Popup className="map-popup-custom">
                      <div className="popup-content">
                        <h4>📍 {loc.cliente_nombre || 'Cliente WhatsApp'}</h4>
                        <p className="popup-address"><strong>Ref:</strong> {loc.mensaje}</p>
                        <span className="popup-time">Solicitado a las {date}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {locations.length > 0 && <ChangeMapView coords={locations} />}
            </MapContainer>
            
            {/* Map Floating Legend */}
            <div className="map-legend glass-card">
              <h4><HiOutlineMap style={{ marginRight: 6 }} /> Referencias</h4>
              <div className="legend-item">
                <span className="legend-marker" />
                <span>Solicitud de Taxi (Últimos viajes)</span>
              </div>
              <div className="legend-footer">
                Total geolocalizados: <strong>{locations.length}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
