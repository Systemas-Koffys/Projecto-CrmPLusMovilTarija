import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaCar, FaUserTie, FaMoneyBillWave, FaChartLine, 
  FaWhatsapp, FaRobot, FaMapMarkedAlt, FaChevronRight, 
  FaTimes, FaBars, FaTrophy, FaExclamationTriangle, 
  FaClock, FaCheckCircle, FaClipboardList, FaShieldAlt, 
  FaExternalLinkAlt, FaBookOpen, FaStar, FaAddressCard, 
  FaCalendarAlt 
} from 'react-icons/fa';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeComparisonTab, setActiveComparisonTab] = useState('after');
  const [chatStep, setChatStep] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Auto transition for chat simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setChatStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleDemoRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container">
      {/* Background Orbs */}
      <div className="bg-glow-orb orb-1"></div>
      <div className="bg-glow-orb orb-2"></div>
      <div className="bg-glow-orb orb-3"></div>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/59169309970" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-floating-btn"
        title="Contactar al Desarrollador por WhatsApp"
      >
        <FaWhatsapp />
      </a>

      {/* Navbar */}
      <nav className="landing-navbar">
        <a href="#" className="navbar-brand">
          <FaCar className="brand-icon" />
          <div className="brand-text">CRM <span>Plus Móvil</span></div>
        </a>

        <button className="nav-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`navbar-links ${mobileMenu ? 'active' : ''}`}>
          <li><a href="#problemas" onClick={() => setMobileMenu(false)}>Orígenes</a></li>
          <li><a href="#caracteristicas" onClick={() => setMobileMenu(false)}>Características</a></li>
          <li><a href="#automatizacion" onClick={() => setMobileMenu(false)}>IA & WhatsApp</a></li>
          <li><a href="#perfiles" onClick={() => setMobileMenu(false)}>Socios y Dev</a></li>
          <li>
            <Link to="/login" className="btn-nav-demo" onClick={() => setMobileMenu(false)}>
              Ingresar a la Demo
            </Link>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Revolución Tecnológica en Tarija
          </div>
          <h1 className="hero-title">
            El Control Inteligente de <br />
            <span className="gradient-text">Radio Móvil Plus Tarija</span>
          </h1>
          <p className="hero-description">
            Diseñado para erradicar las ineficiencias de oficina, evitar la pérdida de información en papel, 
            agilizar los despachos y llevar el control absoluto de turnos, asistencias y finanzas en un solo lugar.
          </p>

          <div className="hero-ctas">
            <div className="cta-button-group">
              <button onClick={handleDemoRedirect} className="btn-primary-glow">
                Acceder a la Demo <FaChevronRight />
              </button>
              <a href="#caracteristicas" className="btn-secondary-outline">
                Ver Características <FaBookOpen />
              </a>
            </div>

            <div className="demo-credentials-box">
              <div className="credentials-title">
                <FaShieldAlt /> Acceso de Exploración Protegido (Solo Lectura)
              </div>
              <div className="credentials-details">
                <div>Usuario: <strong>prueba@gmail.com</strong></div>
                <div>Contraseña: <strong>prueba123</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockup-title">Dashboard Operador Activo</div>
            </div>

            <div className="mockup-stats-grid">
              <div className="mockup-stat-card">
                <span className="mockup-stat-label">Móviles Activos</span>
                <span className="mockup-stat-value">13 / 15</span>
                <span className="mockup-stat-trend">⚡ 86% Eficacia</span>
              </div>
              <div className="mockup-stat-card">
                <span className="mockup-stat-label">Caja del Día</span>
                <span className="mockup-stat-value">Bs. 480.00</span>
                <span className="mockup-stat-trend">📈 +12% vs ayer</span>
              </div>
            </div>

            <div className="mockup-graph">
              <div className="mockup-bar"></div>
              <div className="mockup-bar"></div>
              <div className="mockup-bar"></div>
              <div className="mockup-bar"></div>
            </div>

            <div className="mockup-map-indicator">
              <FaMapMarkedAlt style={{ color: '#00ff87' }} />
              <span>Mapa de calor activo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Why CRM Section (Origins & Inefficiencies) */}
      <section id="problemas" className="why-section">
        <div className="why-grid">
          <div className="why-left-content">
            <span className="why-tag">El Origen del Proyecto</span>
            <h2 className="why-heading">Superando los Desafíos y Falencias del Trabajo Tradicional</h2>
            <p className="why-text">
              La administración manual en papel generaba desorganización y lentitud. 
              Este CRM nace para digitalizar obligatoriamente cada proceso de la oficina de Radio Móvil Plus Tarija, 
              garantizando rapidez y seguridad.
            </p>

            <div className="why-pain-points">
              <div className="pain-point">
                <div className="pain-icon-container">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h4 className="pain-title">Pérdida de Información Física</h4>
                  <p className="pain-desc">Hojas de turnos rotas, deudas de choferes extraviadas y planillas traspapeladas.</p>
                </div>
              </div>

              <div className="pain-point">
                <div className="pain-icon-container">
                  <FaClock />
                </div>
                <div>
                  <h4 className="pain-title">Tardanza en Respuestas y Despachos</h4>
                  <p className="pain-desc">Llamadas telefónicas cruzadas, demoras en coordinar con el chofer y malestar del cliente.</p>
                </div>
              </div>

              <div className="pain-point">
                <div className="pain-icon-container">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h4 className="pain-title">Cero Seguimiento de Clientes</h4>
                  <p className="pain-desc">Imposibilidad de registrar las frecuencias de viaje de clientes o detectar si están en lista negra.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="why-right-visual">
            <div className="comparison-card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}>¿Cómo cambia la operatividad?</h3>
              <div className="comparison-toggle">
                <button 
                  className={`toggle-btn ${activeComparisonTab === 'before' ? 'active-before' : 'inactive'}`}
                  onClick={() => setActiveComparisonTab('before')}
                >
                  Antes (Papel)
                </button>
                <button 
                  className={`toggle-btn ${activeComparisonTab === 'after' ? 'active-after' : 'inactive'}`}
                  onClick={() => setActiveComparisonTab('after')}
                >
                  Ahora (CRM Digital)
                </button>
              </div>

              <div className="comparison-content-box">
                {activeComparisonTab === 'before' ? (
                  <div className="comparison-list">
                    <div className="comparison-item before">
                      <span className="comp-icon red">❌</span>
                      <span className="comp-text">Registros de cobros en cuadernos físicos difíciles de totalizar.</span>
                    </div>
                    <div className="comparison-item before">
                      <span className="comp-icon red">❌</span>
                      <span className="comp-text">Operadoras anotando pedidos a mano alzada sin control de tiempos.</span>
                    </div>
                    <div className="comparison-item before">
                      <span className="comp-icon red">❌</span>
                      <span className="comp-text">Sin control de uniformes, faltas ni ranking de mejores choferes.</span>
                    </div>
                  </div>
                ) : (
                  <div className="comparison-list">
                    <div className="comparison-item after">
                      <span className="comp-icon green">✔</span>
                      <span className="comp-text">Cobros digitalizados en tiempo real por turnos con cierre de caja automatizado.</span>
                    </div>
                    <div className="comparison-item after">
                      <span className="comp-icon green">✔</span>
                      <span className="comp-text">API de WhatsApp que procesa el viaje y despacha a la unidad más cercana.</span>
                    </div>
                    <div className="comparison-item after">
                      <span className="comp-icon green">✔</span>
                      <span className="comp-text">Historial de asistencia, estado del uniforme, notas y ranking de rendimiento.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="caracteristicas" className="features-section">
        <div className="section-title-wrapper">
          <span className="section-subtitle">Capacidades del Sistema</span>
          <h2 className="section-title">El Ecosistema Completo de Control</h2>
          <p className="section-description">
            Un diseño integral que asiste tanto al control vehicular, al personal administrativo de cobros, como a la dirección estratégica.
          </p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <FaCar />
            </div>
            <h3 className="feature-card-title">Control Vehicular y Choferes</h3>
            <p className="feature-card-desc">
              Base de datos centralizada de conductores. Monitorea uniformes, faltas de asistencia, advertencias y datos clave del vehículo.
            </p>
            <ul className="feature-card-bullets">
              <li><FaCheckCircle className="feature-bullet-icon" /> Alertas SOAT y Vencimiento Licencia</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Ranking de los Mejores Choferes</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Control de Estado de Uniformes</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <FaMoneyBillWave />
            </div>
            <h3 className="feature-card-title">Gestión Financiera de Cobros</h3>
            <p className="feature-card-desc">
              Control transparente de las finanzas diarias y semanales. Permite registrar cobros de tarjetas, aportes y multas aplicadas de forma instantánea.
            </p>
            <ul className="feature-card-bullets">
              <li><FaCheckCircle className="feature-bullet-icon" /> Registro de multas y aportes especiales</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Historial actualizado de deudas de choferes</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Cierres de turno automáticos y auditoría</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <FaChartLine />
            </div>
            <h3 className="feature-card-title">Análisis y Dashboard General</h3>
            <p className="feature-card-desc">
              Visualiza en tiempo real los principales indicadores del negocio: servicios atendidos, cancelados, ingresos de caja y actividad de operadoras.
            </p>
            <ul className="feature-card-bullets">
              <li><FaCheckCircle className="feature-bullet-icon" /> Reportes descargables y filtrados</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Historial de Turnos y operadoras activas</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Gráficos de tendencias semanales</li>
            </ul>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <FaMapMarkedAlt />
            </div>
            <h3 className="feature-card-title">Mapa de Calor y Demanda</h3>
            <p className="feature-card-desc">
              Visualiza geográficamente dónde se solicita el servicio con mayor frecuencia en Tarija para reubicar móviles estratégicamente y optimizar ganancias.
            </p>
            <ul className="feature-card-bullets">
              <li><FaCheckCircle className="feature-bullet-icon" /> Geolocalización de pedidos en tiempo real</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Concentración de demanda por zonas</li>
              <li><FaCheckCircle className="feature-bullet-icon" /> Reducción del tiempo de viaje muerto</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WhatsApp and AI Integration Section */}
      <section id="automatizacion" className="automation-section">
        <div className="automation-grid">
          <div className="chat-simulator-container">
            <div className="chat-simulator">
              <div className="chat-header">
                <div className="chat-avatar">AI</div>
                <div className="chat-user-info">
                  <span className="chat-user-name">Asistente Virtual Plus Móvil</span>
                  <span className="chat-user-status"><span className="hero-badge-dot"></span> En línea (Automático)</span>
                </div>
              </div>

              <div className="chat-body">
                {chatStep >= 0 && (
                  <div className="chat-bubble client">
                    Hola, por favor necesito un móvil en El Molino, calle Sucre esquina Bolívar.
                    <span className="chat-time">02:30 PM</span>
                  </div>
                )}

                {chatStep >= 1 && (
                  <div className="chat-bubble bot">
                    👋 ¡Hola! Con gusto te programamos una unidad en la zona <strong>El Molino</strong>. 
                    Buscando móviles disponibles más cercanos... 🔍
                    <span className="chat-time">02:31 PM</span>
                  </div>
                )}

                {chatStep >= 2 && (
                  <div className="chat-bubble bot">
                    ✅ ¡Móvil asignado! La unidad **Móvil 206** va en camino a tu ubicación. 
                    Tiempo estimado de llegada: 4 minutos. 🚗
                    <span className="chat-time">02:31 PM</span>
                  </div>
                )}
              </div>

              <div className="chat-input-bar">
                <span className="chat-input-placeholder">Escribe un mensaje...</span>
                <FaWhatsapp className="chat-send-btn" />
              </div>
            </div>

            <div className="auto-step-indicator">
              <span className={`step-dot ${chatStep === 0 ? 'active' : ''}`} onClick={() => setChatStep(0)}></span>
              <span className={`step-dot ${chatStep === 1 ? 'active' : ''}`} onClick={() => setChatStep(1)}></span>
              <span className={`step-dot ${chatStep === 2 ? 'active' : ''}`} onClick={() => setChatStep(2)}></span>
            </div>
          </div>

          <div className="auto-text-content">
            <span className="why-tag auto-badge">Automatización con API</span>
            <h2 className="why-heading" style={{ marginTop: '0.8rem' }}>Integración de WhatsApp y Respuestas Inteligentes</h2>
            <p className="why-text">
              Diseñado para admitir la automatización de despachos conectando una API de WhatsApp (n8n u otra pasarela). 
              La inteligencia del sistema permite responder a las solicitudes de los clientes simulando a una persona real, 
              capturar su ubicación y coordinar al instante.
            </p>

            <div className="why-pain-points" style={{ marginTop: '1.5rem' }}>
              <div className="pain-point">
                <div className="pain-icon-container" style={{ color: 'var(--neon-green)' }}>
                  <FaRobot />
                </div>
                <div>
                  <h4 className="pain-title">Conversaciones Fluidas</h4>
                  <p className="pain-desc">El bot lee el mensaje y coordina de manera natural con el cliente.</p>
                </div>
              </div>

              <div className="pain-point">
                <div className="pain-icon-container" style={{ color: 'var(--neon-green)' }}>
                  <FaMapMarkedAlt />
                </div>
                <div>
                  <h4 className="pain-title">Envío de Ubicaciones por GPS</h4>
                  <p className="pain-desc">El cliente envía su ubicación y el CRM calcula cuál conductor activo está más próximo.</p>
                </div>
              </div>

              <div className="pain-point">
                <div className="pain-icon-container" style={{ color: 'var(--neon-green)' }}>
                  <FaCheckCircle />
                </div>
                <div>
                  <h4 className="pain-title">Coordinación 3 Vías</h4>
                  <p className="pain-desc">Actualizaciones simultáneas e instantáneas al cliente, operadora de despacho y chofer asignado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profiles Section (Client & Developer) */}
      <section id="perfiles" className="profiles-section">
        <div className="section-title-wrapper">
          <span className="section-subtitle">Quiénes Hacen esto Posible</span>
          <h2 className="section-title">El Cliente y el Desarrollador</h2>
          <p className="section-description">
            La unión de una empresa líder en transporte ejecutivo con el desarrollo tecnológico de vanguardia en Tarija.
          </p>
        </div>

        <div className="profiles-grid">
          {/* Client Card */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar-box avatar-client">
                <FaCar />
              </div>
              <div className="profile-name-title">
                <h3 className="profile-name">Plus Móvil Tarija</h3>
                <span className="profile-subtitle green-sub">Líder en Transporte Ejecutivo</span>
              </div>
            </div>
            <p className="profile-body-text">
              Con más de 9 años liderando el transporte en Tarija, Plus Móvil ofrece servicios ejecutivos, 
              courier y encomiendas con más de 80 unidades activas. Destacados por su seguridad, puntualidad 
              y servicio ininterrumpido las 24 horas del día.
            </p>
            <div className="profile-tags">
              <span className="profile-tag"><FaStar style={{ color: 'var(--neon-green)', marginRight: '4px' }} /> 9+ Años</span>
              <span className="profile-tag">Tarija, Bolivia</span>
              <span className="profile-tag">Servicio 24/7</span>
              <span className="profile-tag">80+ Unidades de Transporte</span>
            </div>
          </div>

          {/* Developer Card */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar-box">
                <FaUserTie />
              </div>
              <div className="profile-name-title">
                <h3 className="profile-name">Sistemas Koffy's</h3>
                <span className="profile-subtitle">Kevin Flores — Creador de Software</span>
              </div>
            </div>
            <p className="profile-body-text">
              Especialista en desarrollo web premium, integraciones API y automatizaciones de flujo de trabajo (n8n). 
              Creador de soluciones enfocadas en resolver ineficiencias de negocio y brindar experiencias interactivas y 
              fluidas de alta calidad tecnológica.
            </p>
            <div className="profile-tags">
              <span className="profile-tag">Kevin Flores</span>
              <span className="profile-tag">Desarrollo Premium</span>
              <span className="profile-tag">Automatizaciones Inteligentes</span>
              <span className="profile-tag">Tarija, BO</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Banner */}
      <section className="cta-banner-section">
        <div className="cta-banner">
          <h2>¿Listo para ver el CRM en acción?</h2>
          <p>
            Explora las diferentes pantallas, las métricas reales simuladas con datos de prueba, la lista de choferes activos 
            y los reportes financieros detallados sin comprometer datos reales de producción.
          </p>
          <button onClick={handleDemoRedirect} className="btn-primary-glow">
            Iniciar Sesión Demo <FaChevronRight />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-logo">
            <div className="footer-logo-title">CRM <span>Plus Móvil</span></div>
            <div className="footer-logo-subtitle">Gestión Tecnológica de Radio Móviles</div>
          </div>

          <div className="footer-socials">
            <a 
              href="https://wa.me/59169309970" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon-link"
              title="Chat de WhatsApp con Sistemas Koffy's"
            >
              <FaWhatsapp />
            </a>
            <a 
              href="https://systemas-koffys.github.io/Portafolio-Koffy-s/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon-link"
              title="Portafolio Web de Kevin Flores"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">&copy; {new Date().getFullYear()} CRM Plus Móvil Tarija. Todos los derechos reservados.</p>
          <p className="footer-credits">
            Desarrollado con ❤️ por{' '}
            <a 
              href="https://systemas-koffys.github.io/Portafolio-Koffy-s/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Sistemas Koffy's — Kevin Flores
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
