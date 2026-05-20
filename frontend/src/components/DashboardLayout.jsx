import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineCash,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineMap,
  HiOutlineDocumentReport,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineUserCircle,
  HiOutlineTruck,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import './DashboardLayout.css';

const menuConfig = {
  operadora: [
    { icon: HiOutlineHome, label: 'Inicio', id: 'home' },
    { icon: HiOutlineChatAlt2, label: 'WhatsApp Gateway', id: 'whatsapp' }, // No badge, now active in Phase 2
    { icon: HiOutlineClipboardList, label: 'Turno Activo', id: 'turno' }, // Active in Phase 2
    { icon: HiOutlineTruck, label: 'Móviles', id: 'moviles', badge: 'Próximo' },
    { icon: HiOutlineCash, label: 'Cobros', id: 'cobros' },
  ],
  contadora: [
    { icon: HiOutlineHome, label: 'Inicio', id: 'home' },
    { icon: HiOutlineCash, label: 'Cobros', id: 'cobros' },
    { icon: HiOutlineDocumentReport, label: 'Reportes', id: 'reportes' },
    { icon: HiOutlineChartBar, label: 'Finanzas', id: 'finanzas' },
  ],
  admin: [
    { icon: HiOutlineHome, label: 'Inicio', id: 'home' },
    { icon: HiOutlineChatAlt2, label: 'WhatsApp Gateway', id: 'whatsapp' }, // Active in Phase 2
    { icon: HiOutlineClipboardList, label: 'Turnos', id: 'turnos' }, // Active in Phase 2
    { icon: HiOutlineTruck, label: 'Móviles', id: 'moviles', badge: 'Próximo' },
    { icon: HiOutlineCash, label: 'Cobros', id: 'cobros' },
    { icon: HiOutlineUsers, label: 'Choferes', id: 'choferes' },
    { icon: HiOutlineUserCircle, label: 'Personal', id: 'personal' },
    { icon: HiOutlineChartBar, label: 'Dashboard', id: 'analytics', badge: 'Próximo' },
    { icon: HiOutlineMap, label: 'Mapa', id: 'mapa', badge: 'Próximo' },
    { icon: HiOutlineDocumentReport, label: 'Reportes', id: 'reportes' },
    { icon: HiOutlineCog, label: 'Configuración', id: 'config', badge: 'Próximo' },
  ],
};

const roleNames = {
  operadora: 'Operadora',
  contadora: 'Contadora',
  admin: 'Administrador',
};

const roleColors = {
  operadora: 'var(--accent-cyan)',
  contadora: 'var(--accent-green)',
  admin: 'var(--accent-orange)',
};

export default function DashboardLayout({ children, activeSection = 'home', onSectionChange }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const menu = menuConfig[role] || menuConfig.admin;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSectionClick = (id) => {
    if (onSectionChange) {
      onSectionChange(id);
    }
    setIsMobileOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button 
          className="mobile-header__hamburger" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Menú"
        >
          {isMobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
        <div className="mobile-header__logo">
          <span className="mobile-header__logo-icon">📡</span>
          <span className="mobile-header__logo-title">Plus Móvil</span>
        </div>
      </header>

      {/* Drawer Overlay backdrop */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">📡</div>
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-title">Plus Móvil</span>
              <span className="sidebar__logo-sub">CRM Radio Móviles</span>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section-label">Menú Principal</div>
          {menu.map((item) => (
            <button
              key={item.id}
              className={`sidebar__item ${activeSection === item.id ? 'sidebar__item--active' : ''}`}
              onClick={() => handleSectionClick(item.id)}
              title={item.label}
            >
              <item.icon className="sidebar__item-icon" />
              <span className="sidebar__item-label">{item.label}</span>
              {item.badge && (
                <span className="sidebar__item-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div
              className="sidebar__user-avatar"
              style={{ borderColor: roleColors[role] }}
            >
              {user?.nombre?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">
                {user?.nombre || user?.email?.split('@')[0]}
              </div>
              <div
                className="sidebar__user-role"
                style={{ color: roleColors[role] }}
              >
                {roleNames[role] || role}
              </div>
            </div>
            <button
              className="sidebar__logout"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <HiOutlineLogout />
            </button>
          </div>

          <div className="sidebar__brand">
            Made in <span>Sistemas Koffys</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-main__content">
          {children}
        </div>
      </main>
    </div>
  );
}
