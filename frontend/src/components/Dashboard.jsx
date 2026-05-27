import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import DashboardLayout from './DashboardLayout';
import WhatsAppManager from './WhatsAppManager';
import TurnoActivo from './TurnoActivo';
import ChoferesManager from './ChoferesManager';
import PersonalManager from './PersonalManager';
import CobrosManager from './CobrosManager';
import ReportesManager from './ReportesManager';
import AnalyticsManager from './AnalyticsManager';
import MapaManager from './MapaManager';
import MovilesManager from './MovilesManager';
import './Dashboard.css';

const roleConfig = {
  operadora: {
    title: 'Panel de Operadora',
    subtitle: 'Gestión de turno, servicios y cobros',
    color: 'var(--accent-cyan)',
    emoji: '🎧',
    stats: [
      { icon: '📱', label: 'Solicitudes hoy', value: '—', color: 'cyan' },
      { icon: '🚗', label: 'Móviles en turno', value: '—', color: 'green' },
      { icon: '✅', label: 'Servicios completados', value: '—', color: 'purple' },
      { icon: '💰', label: 'Caja del turno', value: '—', color: 'yellow' },
    ],
    quickActions: [
      { icon: '▶️', label: 'Iniciar Turno', desc: 'Comenzar jornada de trabajo', targetTab: 'turno' },
      { icon: '📋', label: 'Registrar Cobro', desc: 'Cobro rápido a un móvil', targetTab: 'turno' },
      { icon: '📱', label: 'Ver WhatsApp', desc: 'Mensajes entrantes', targetTab: 'turno' },
      { icon: '📊', label: 'Resumen del Turno', desc: 'Estado actual', targetTab: 'turno' },
    ],
  },
  contadora: {
    title: 'Panel de Contadora',
    subtitle: 'Finanzas, cobros y reportes',
    color: 'var(--accent-green)',
    emoji: '📊',
    stats: [
      { icon: '💰', label: 'Ingresos hoy', value: '—', color: 'green' },
      { icon: '📋', label: 'Cobros registrados', value: '—', color: 'cyan' },
      { icon: '📄', label: 'Reportes generados', value: '—', color: 'purple' },
      { icon: '📈', label: 'Ingresos del mes', value: '—', color: 'yellow' },
    ],
    quickActions: [
      { icon: '📄', label: 'Reporte Diario', desc: 'Generar PDF del día', targetTab: 'reportes' },
      { icon: '📊', label: 'Cobros por Período', desc: 'Filtrar por fecha', targetTab: 'cobros' },
      { icon: '📥', label: 'Exportar Excel', desc: 'Descargar datos', targetTab: 'reportes' },
      { icon: '🔍', label: 'Buscar Cobros', desc: 'Por móvil o concepto', targetTab: 'cobros' },
    ],
  },
  admin: {
    title: 'Panel de Administrador',
    subtitle: 'Vista global del sistema',
    color: 'var(--accent-orange)',
    emoji: '🔐',
    stats: [
      { icon: '🚗', label: 'Choferes activos', value: '—', color: 'orange' },
      { icon: '🎧', label: 'Operadoras', value: '—', color: 'cyan' },
      { icon: '📱', label: 'Servicios hoy', value: '—', color: 'green' },
      { icon: '💰', label: 'Caja hoy', value: '—', color: 'yellow' },
    ],
    quickActions: [
      { icon: '👥', label: 'Gestionar Personal', desc: 'Usuarios y roles', targetTab: 'personal' },
      { icon: '📊', label: 'Dashboard Analítico', desc: 'KPIs y métricas', targetTab: 'analytics' },
      { icon: '🗺️', label: 'Mapa de Servicios', desc: 'Zonas de demanda', targetTab: 'mapa' },
      { icon: '⚙️', label: 'Configuración', desc: 'Ajustes del sistema', targetTab: 'config' },
    ],
  },
};

export default function Dashboard() {
  const { user, role } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [dashboardStats, setDashboardStats] = useState(null);
  const config = roleConfig[role] || roleConfig.admin;

  useEffect(() => {
    if (activeSection === 'home') {
      api.get('/api/analytics/kpis')
        .then(res => setDashboardStats(res.kpis))
        .catch(err => console.error("Error loading dashboard stats:", err));
    }
  }, [activeSection]);

  const getStatValue = (label) => {
    if (!dashboardStats) return '—';
    const lower = label.toLowerCase();
    if (lower.includes('choferes') || lower.includes('móviles')) return dashboardStats.activeChoferes || '0';
    if (lower.includes('servicios') || lower.includes('solicitudes')) return dashboardStats.totalServicios30Days || '0';
    if (lower.includes('caja') || lower.includes('ingresos')) return `Bs. ${dashboardStats.totalEarnings30Days?.toFixed(2) || '0.00'}`;
    if (lower.includes('operadoras') || lower.includes('clientes')) return dashboardStats.totalClientes || '0';
    return '—';
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Buenos días' :
    now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
  const dateStr = now.toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleActionClick = (targetTab) => {
    const activeTabs = ['whatsapp', 'turno', 'turnos', 'choferes', 'personal', 'cobros', 'finanzas', 'reportes', 'analytics', 'mapa', 'moviles'];
    if (activeTabs.includes(targetTab)) {
      setActiveSection(targetTab);
    } else {
      alert(`El módulo "${targetTab}" está planificado para la Fase 3/4.`);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'whatsapp':
        return <WhatsAppManager />;
      case 'turno':
      case 'turnos':
        return <TurnoActivo />;
      case 'choferes':
        return <ChoferesManager viewMode={activeSection} />;
      case 'personal':
        return <PersonalManager />;
      case 'cobros':
      case 'finanzas':
        return <CobrosManager />;
      case 'reportes':
        return <ReportesManager />;
      case 'analytics':
        return <AnalyticsManager />;
      case 'mapa':
        return <MapaManager />;
      case 'moviles':
        return <MovilesManager />;
      case 'home':
      default:
        return (
          <div className="dashboard-home">
            {/* Welcome Header */}
            <div className="dashboard-welcome animate-fade-up">
              <div className="dashboard-welcome__left">
                <div className="dashboard-welcome__greeting">
                  {greeting}, <span style={{ color: config.color }}>
                    {user?.nombre || user?.email?.split('@')[0]}
                  </span>
                </div>
                <p className="dashboard-welcome__date">{dateStr}</p>
              </div>
              <div className="dashboard-welcome__right">
                <span className="badge badge--cyan">{config.emoji} {config.title}</span>
              </div>
            </div>

            {/* Status Banner */}
            <div className="dashboard-status animate-fade-up delay-1">
              <div className="dashboard-status__dot" />
              <span className="dashboard-status__text">
                Sistema operativo · Fase 4 — Inteligencia y Dashboards 🚀
              </span>
              <span className="dashboard-status__version">v1.1.0</span>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-stats animate-fade-up delay-2">
              {config.stats.map((stat, i) => (
                <div key={i} className={`stat-card stat-card--${stat.color}`}>
                  <div className="stat-card__icon">{stat.icon}</div>
                  <div className="stat-card__value">{getStatValue(stat.label)}</div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section animate-fade-up delay-3">
              <h3 className="dashboard-section__title">Acciones rápidas</h3>
              <div className="dashboard-actions">
                {config.quickActions.map((action, i) => {
                  const isActionEnabled = ['whatsapp', 'turno', 'turnos', 'choferes', 'personal', 'cobros', 'finanzas', 'reportes', 'analytics', 'mapa', 'moviles'].includes(action.targetTab);
                  return (
                    <button
                      key={i}
                      className={`dashboard-action ${!isActionEnabled ? 'dashboard-action--disabled' : ''}`}
                      onClick={() => handleActionClick(action.targetTab)}
                    >
                      <div className="dashboard-action__icon">{action.icon}</div>
                      <div className="dashboard-action__content">
                        <div className="dashboard-action__label">{action.label}</div>
                        <div className="dashboard-action__desc">{action.desc}</div>
                      </div>
                      {!isActionEnabled && (
                        <span className="badge badge--purple" style={{ fontSize: 9 }}>Fase 3/4</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Development Roadmap */}
            <div className="dashboard-section animate-fade-up delay-4">
              <h3 className="dashboard-section__title">Roadmap de desarrollo</h3>
              <div className="dashboard-roadmap">
                <div className="roadmap-phase roadmap-phase--completed">
                  <div className="roadmap-phase__num">01</div>
                  <div className="roadmap-phase__content">
                    <div className="roadmap-phase__title">Base y Autenticación</div>
                    <div className="roadmap-phase__desc">Login, roles, estructura</div>
                  </div>
                  <span className="badge badge--green">Completado ✅</span>
                </div>
                <div className="roadmap-phase roadmap-phase--completed">
                  <div className="roadmap-phase__num">02</div>
                  <div className="roadmap-phase__content">
                    <div className="roadmap-phase__title">WhatsApp + Turno</div>
                    <div className="roadmap-phase__desc">Gateway, panel operadora, gestión de turnos</div>
                  </div>
                  <span className="badge badge--green">Completado ✅</span>
                </div>
                <div className="roadmap-phase roadmap-phase--completed">
                  <div className="roadmap-phase__num">03</div>
                  <div className="roadmap-phase__content">
                    <div className="roadmap-phase__title">Fichas y Reportes</div>
                    <div className="roadmap-phase__desc">Choferes, documentos, contadora</div>
                  </div>
                  <span className="badge badge--green">Completado ✅</span>
                </div>
                <div className="roadmap-phase roadmap-phase--active">
                  <div className="roadmap-phase__num">04</div>
                  <div className="roadmap-phase__content">
                    <div className="roadmap-phase__title">Dashboard y Deploy</div>
                    <div className="roadmap-phase__desc">Analítica, mapas, producción</div>
                  </div>
                  <span className="badge badge--yellow">Activo 🚀</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSectionContent()}
    </DashboardLayout>
  );
}
