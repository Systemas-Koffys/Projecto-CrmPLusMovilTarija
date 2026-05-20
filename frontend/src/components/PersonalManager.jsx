import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  HiOutlineUserAdd,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineMinusCircle
} from 'react-icons/hi';
import './PersonalManager.css';

const roleLabels = {
  admin: 'Administrador',
  operadora: 'Operadora',
  contadora: 'Contadora',
};

const roleColors = {
  admin: 'var(--accent-orange)',
  operadora: 'var(--accent-cyan)',
  contadora: 'var(--accent-green)',
};

export default function PersonalManager() {
  const [personalList, setPersonalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    role: 'operadora',
    activo: true
  });

  const fetchPersonal = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/personal');
      setPersonalList(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la lista de personal del sistema. Verifica que tengas permisos de Administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setForm({
      nombre: '',
      email: '',
      role: 'operadora',
      activo: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setForm({
      nombre: user.nombre || '',
      email: user.email || '',
      role: user.role || 'operadora',
      activo: !!user.activo
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedUser) {
        const updated = await api.put(`/api/personal/${selectedUser.id}`, form);
        setPersonalList(personalList.map(u => u.id === selectedUser.id ? updated : u));
      } else {
        const created = await api.post('/api/personal', form);
        setPersonalList([...personalList, created]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error al guardar los cambios');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Está seguro de eliminar al usuario ${user.nombre}? Perderá el acceso de forma inmediata.`)) return;
    try {
      await api.delete(`/api/personal/${user.id}`);
      setPersonalList(personalList.filter(u => u.id !== user.id));
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error al eliminar usuario');
    }
  };

  return (
    <div className="personal-manager animate-fade-in">
      <div className="personal-header">
        <div>
          <h2 className="personal-title">Control de Personal</h2>
          <p className="personal-subtitle">Gestiona las cuentas del sistema, operadoras de cabina, contadoras y administradores.</p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenCreate}>
          <HiOutlineUserAdd style={{ marginRight: 8, fontSize: 18 }} />
          Registrar Usuario
        </button>
      </div>

      {error && (
        <div className="personal-error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="personal-loader">
          <div className="spinner" />
          <p>Cargando personal del sistema...</p>
        </div>
      ) : (
        <div className="personal-grid">
          {personalList.map((user) => (
            <div key={user.id} className="personal-card glass-card">
              <div className="personal-card__header">
                <div 
                  className="personal-card__avatar"
                  style={{ borderColor: roleColors[user.role] }}
                >
                  {user.nombre?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="personal-card__badge-role" style={{ background: `${roleColors[user.role]}20`, color: roleColors[user.role] }}>
                  {roleLabels[user.role] || user.role}
                </div>
              </div>

              <div className="personal-card__body">
                <h3 className="personal-card__name">{user.nombre}</h3>
                <div className="personal-card__info-item">
                  <HiOutlineMail className="personal-card__icon" />
                  <span>{user.email}</span>
                </div>
                <div className="personal-card__info-item">
                  <HiOutlineShieldCheck className="personal-card__icon" />
                  <span className={`status-text ${user.activo ? 'status-text--active' : 'status-text--inactive'}`}>
                    {user.activo ? (
                      <>
                        <HiOutlineCheckCircle /> Activo
                      </>
                    ) : (
                      <>
                        <HiOutlineMinusCircle /> Suspendido
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="personal-card__actions">
                <button 
                  className="btn btn--secondary btn--sm" 
                  onClick={() => handleOpenEdit(user)}
                  title="Editar perfil"
                >
                  <HiOutlinePencilAlt style={{ marginRight: 4 }} /> Editar
                </button>
                <button 
                  className="btn btn--danger btn--sm btn--outline" 
                  onClick={() => handleDelete(user)}
                  title="Eliminar usuario"
                >
                  <HiOutlineTrash style={{ marginRight: 4 }} /> Eliminar
                </button>
              </div>
            </div>
          ))}

          {personalList.length === 0 && !error && (
            <div className="personal-empty">
              No hay usuarios del sistema registrados. Usa el botón superior para dar de alta operadores o contadoras.
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-up">
            <div className="modal-header-personal">
              <h3>{isEditing ? 'Editar Perfil de Usuario' : 'Registrar Nuevo Usuario'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="personal-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  value={form.nombre} 
                  onChange={e => setForm({...form, nombre: e.target.value})} 
                  placeholder="Ej. Maria Lopez"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico (Firebase Auth / Google)</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder="ejemplo@correo.com"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Rol del Sistema</label>
                <select 
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})}
                  required
                >
                  <option value="operadora">Operadora (Gestión Cabina / Turnos)</option>
                  <option value="contadora">Contadora (Revisión Cobros / Finanzas)</option>
                  <option value="admin">Administrador (Control Total)</option>
                </select>
              </div>

              <div className="form-group-checkbox">
                <input 
                  type="checkbox" 
                  id="activo" 
                  checked={form.activo} 
                  onChange={e => setForm({...form, activo: e.target.checked})} 
                />
                <label htmlFor="activo">Cuenta Activa (Habilitar inicio de sesión)</label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  {isEditing ? 'Guardar Cambios' : 'Registrar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
