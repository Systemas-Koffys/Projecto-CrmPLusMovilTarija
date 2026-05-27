import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FaWhatsapp, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import './WhatsAppManager.css';

export default function WhatsAppManager() {
  const [lines, setLines] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(true);

  const fetchStatus = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await api.get('/api/whatsapp/status');
      setLines(data);
      setError('');
    } catch (err) {
      setError('No se pudo conectar con el servidor de WhatsApp');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchChatbotStatus = async () => {
    try {
      const data = await api.get('/api/whatsapp/chatbot/status');
      setChatbotEnabled(data.enabled);
    } catch (err) {
      console.error('Error fetching chatbot status:', err);
    }
  };

  const handleChatbotToggle = async () => {
    try {
      const data = await api.post('/api/whatsapp/chatbot/toggle', { enabled: !chatbotEnabled });
      setChatbotEnabled(data.enabled);
    } catch (err) {
      console.error('Error toggling chatbot status:', err);
      alert('No se pudo cambiar el estado del chatbot. Intente de nuevo.');
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchChatbotStatus();
    // Auto refresh status every 5 seconds to show QR scanning in real-time
    const interval = setInterval(() => fetchStatus(false), 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="whatsapp-manager-loading glass-card">
        <div className="spinner" />
        <p>Cargando estado de las líneas de WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="whatsapp-manager glass-card animate-fade-in">
      <div className="whatsapp-header">
        <div className="whatsapp-header__title">
          <FaWhatsapp className="whatsapp-header__icon" style={{ fontSize: '32px', color: '#25D366' }} />
          <div>
            <h3>Conexión de WhatsApp</h3>
            <p className="subtitle">Gateway de comunicación activa (2 líneas)</p>
          </div>
        </div>

        <div className="whatsapp-header__actions">
          {/* Dynamic Chatbot Toggle Switch */}
          <div className="chatbot-toggle-wrapper glass-card">
            <span className="chatbot-toggle-label">Chatbot:</span>
            <button 
              className={`chatbot-toggle-btn ${chatbotEnabled ? 'chatbot-toggle-btn--active' : 'chatbot-toggle-btn--inactive'}`}
              onClick={handleChatbotToggle}
              title={chatbotEnabled ? 'Desactivar respuestas automáticas' : 'Activar respuestas automáticas'}
            >
              <span className="toggle-indicator-dot"></span>
              <span>{chatbotEnabled ? 'ACTIVO' : 'APAGADO'}</span>
            </button>
          </div>

          <button 
            className={`btn btn--secondary ${isRefreshing ? 'refreshing' : ''}`} 
            onClick={() => fetchStatus(true)}
            disabled={isRefreshing}
            title="Actualizar estado"
          >
            <FiRefreshCw style={{ marginRight: '8px' }} />
            Sincronizar
          </button>
        </div>
      </div>

      {error && (
        <div className="whatsapp-error-banner">
          <FaExclamationTriangle style={{ marginRight: '8px', color: '#ffcc00' }} /> {error}
        </div>
      )}

      <div className="whatsapp-lines-grid">
        {lines && Object.keys(lines).map((key) => {
          const line = lines[key];
          const isConnected = line.status === 'connected';
          const isPendingQr = line.status === 'qr_ready';
          const isConnecting = line.status === 'connecting';

          return (
            <div key={key} className={`whatsapp-line-card ${line.status}`}>
              <div className="whatsapp-line-info">
                <div className="whatsapp-line-status-badge">
                  <span className={`status-dot ${line.status}`} />
                  <span className="status-text">
                    {isConnected && 'CONECTADO'}
                    {isPendingQr && 'ESCANEAR QR'}
                    {isConnecting && 'INICIALIZANDO'}
                    {line.status === 'disconnected' && 'DESCONECTADO'}
                  </span>
                </div>
                <h4 className="whatsapp-line-name">{line.name}</h4>
                <p className="whatsapp-line-key">{key.toUpperCase()}</p>
              </div>

              <div className="whatsapp-line-action">
                {isConnected && (
                  <div className="whatsapp-connected-success">
                    <FaCheckCircle className="success-icon" style={{ color: '#25D366', fontSize: '24px' }} />
                    <p>Listo para enviar y recibir mensajes</p>
                  </div>
                )}

                {isConnecting && (
                  <div className="whatsapp-connecting-loader">
                    <div className="spinner spinner--sm" />
                    <p>Iniciando navegador invisible en el servidor...</p>
                  </div>
                )}

                {isPendingQr && line.qr && (
                  <div className="whatsapp-qr-container">
                    <p className="qr-instruction">Escanea este código con tu teléfono celular:</p>
                    <div className="qr-wrapper glass-card">
                      <img src={line.qr} alt={`Código QR WhatsApp ${line.name}`} className="qr-image" />
                    </div>
                    <span className="qr-tip">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</span>
                  </div>
                )}

                {line.status === 'disconnected' && (
                  <div className="whatsapp-disconnected-message">
                    <p>El servicio de WhatsApp está apagado. Intentando conectar automáticamente...</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
