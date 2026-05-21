import React, { useState, useEffect, useRef } from 'react';
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

const chatSteps = [
  {
    sender: 'client',
    text: 'Hola',
    time: '02:30 PM'
  },
  {
    sender: 'bot',
    text: '👋 ¡Hola! Bienvenido al asistente de Plus Móvil Tarija. ¿Qué servicio deseas?\n\n1️⃣ **Móvil (Radio Taxi)**\n2️⃣ **Encomienda / Mensajería**\n3️⃣ **Transporte de Carga**\n4️⃣ **Otros Servicios**',
    time: '02:30 PM'
  },
  {
    sender: 'client',
    text: 'Móvil',
    time: '02:31 PM'
  },
  {
    sender: 'bot',
    text: 'Taxímetro y tarifa fija a tu disposición. 🚕 Por favor, envíanos tu **ubicación GPS actual** y el **apellido de tu familia** para registrar el servicio de despacho.',
    time: '02:31 PM'
  },
  {
    sender: 'client',
    text: '📍 Ubicación GPS enviada\nFamilia Flores',
    time: '02:32 PM'
  },
  {
    sender: 'radio',
    header: '📻 Frecuencia Central — Despacho',
    text: '«Central a móviles en El Molino (Sucre y Bolívar). Servicio solicitado para Familia Flores. ¿Unidad disponible QAP?»',
    time: '02:32 PM'
  },
  {
    sender: 'radio',
    header: '📻 Móvil 25 — Respuesta',
    text: '«Móvil 25 QAP. Central, me encuentro en calle Ingavi, a 3 cuadras. Copio el servicio y voy al QTH.»',
    time: '02:32 PM'
  },
  {
    sender: 'bot',
    text: '✅ **¡Móvil asignado!** La unidad **Móvil 25** va en camino. Tiempo estimado de llegada: **5 minutos**. 🚗',
    time: '02:33 PM'
  },
  {
    sender: 'radio',
    header: '📻 Frecuencia Central — Llegada',
    text: '«Móvil 25 en el QTH de la Familia Flores. Iniciando espera.»',
    time: '02:35 PM'
  },
  {
    sender: 'bot',
    text: '🔔 **¡Tu móvil ha llegado!** El **Móvil 25** está en tu ubicación. Por favor, puedes salir a abordar. ¡Gracias por confiar en Plus Móvil! 👍',
    time: '02:35 PM'
  }
];

// Helper to parse bold text in JSX
const parseBoldText = (text) => {
  const parts = text.split('**');
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeComparisonTab, setActiveComparisonTab] = useState('after');
  const [chatStep, setChatStep] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const chatBodyRef = useRef(null);
  const timerRef = useRef(null);

  const startChatInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setChatStep((prev) => (prev + 1) % 10);
    }, 4500);
  };

  useEffect(() => {
    startChatInterval();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Scroll to bottom on chat step change
  useEffect(() => {
    if (chatBodyRef.current) {
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTo({
            top: chatBodyRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [chatStep]);

  const handleDotClick = (index) => {
    setChatStep(index);
    startChatInterval();
  };

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

              <div className="chat-body" ref={chatBodyRef}>
                {chatSteps.slice(0, chatStep + 1).map((step, index) => {
                  if (step.sender === 'radio') {
                    return (
                      <div className="chat-bubble radio" key={index}>
                        <div className="radio-header">
                          <FaRobot style={{ fontSize: '0.9rem' }} /> {step.header}
                        </div>
                        <div className="radio-text">{step.text}</div>
                        <span className="chat-time">{step.time}</span>
                      </div>
                    );
                  }
                  return (
                    <div className={`chat-bubble ${step.sender}`} key={index}>
                      {step.text.split('\n').map((line, lIdx) => (
                        <div key={lIdx}>
                          {line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣') || line.startsWith('4️⃣') || line.startsWith('📍') || line.startsWith('✅') || line.startsWith('🔔') || line.startsWith('🚕') ? (
                            <span>{line}</span>
                          ) : (
                            parseBoldText(line)
                          )}
                        </div>
                      ))}
                      <span className="chat-time">{step.time}</span>
                    </div>
                  );
                })}
              </div>

              <div className="chat-input-bar">
                <span className="chat-input-placeholder">Escribe un mensaje...</span>
                <FaWhatsapp className="chat-send-btn" />
              </div>
            </div>

            <div className="auto-step-indicator">
              {chatSteps.map((_, index) => (
                <span 
                  key={index}
                  className={`step-dot ${chatStep === index ? 'active' : ''}`} 
                  onClick={() => handleDotClick(index)}
                  title={`Paso ${index + 1}`}
                ></span>
              ))}
            </div>
          </div>

          <div className="auto-text-content">
            <span className="why-tag auto-badge">Conexión Multilínea WhatsApp</span>
            <h2 className="why-heading" style={{ marginTop: '0.8rem' }}>Integración Inteligente con 3 Líneas de WhatsApp</h2>
            <p className="why-text">
              El sistema CRM está diseñado para operar con hasta **3 líneas de WhatsApp simultáneas**, gestionando de forma 
              automática las solicitudes de los clientes. El asistente virtual interactúa fluidamente, procesa ubicaciones y 
              despacha pedidos a la flota.
            </p>

            <div className="why-pain-points" style={{ marginTop: '1.5rem' }}>
              <div className="pain-point">
                <div className="pain-icon-container" style={{ color: 'var(--neon-green)' }}>
                  <FaRobot />
                </div>
                <div>
                  <h4 className="pain-title">Atención Conversacional y Filtros</h4>
                  <p className="pain-desc">El bot interactúa con naturalidad, detecta reincidentes y consulta qué servicio requiere el cliente antes de despachar.</p>
                </div>
              </div>

              <div className="pain-point">
                <div className="pain-icon-container" style={{ color: 'var(--neon-green)' }}>
                  <FaMapMarkedAlt />
                </div>
                <div>
                  <h4 className="pain-title">GPS y Mapa de Calor de Demanda</h4>
                  <p className="pain-desc">Las ubicaciones GPS enviadas por los clientes se procesan en tiempo real para alimentar un mapa de calor y estadísticas de tráfico.</p>
                </div>
              </div>

              <div className="pain-point">
                <div className="pain-icon-container" style={{ color: 'var(--neon-green)' }}>
                  <FaCheckCircle />
                </div>
                <div>
                  <h4 className="pain-title">Coordinación y Registro de Multas</h4>
                  <p className="pain-desc">Comunica a clientes, operadoras y conductores. Si se detecta un incidente en la entrega, la operadora puede sancionar o registrar multas al instante.</p>
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
