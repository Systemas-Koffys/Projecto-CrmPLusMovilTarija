import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from './LoginIcons';
import { FcGoogle } from 'react-icons/fc';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(`/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate(`/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background effects */}
      <div className="login-bg">
        <div className="login-bg__grid" />
        <div className="login-bg__orb login-bg__orb--1" />
        <div className="login-bg__orb login-bg__orb--2" />
        <div className="login-bg__orb login-bg__orb--3" />
      </div>

      <div className="login-container">
        {/* Left: Branding */}
        <div className="login-branding animate-fade-in">
          <div className="login-branding__content">
            <div className="login-branding__badge">CRM v1.0</div>
            <h1 className="login-branding__title">
              <span className="login-branding__title-line">Radio</span>
              <span className="login-branding__title-line login-branding__title-accent">Móviles</span>
            </h1>
            <p className="login-branding__subtitle">
              Sistema de gestión integral para Plus Móvil Tarija
            </p>
            
            <div className="login-branding__features">
              <div className="login-feature">
                <span className="login-feature__icon">📱</span>
                <span className="login-feature__text">WhatsApp Gateway</span>
              </div>
              <div className="login-feature">
                <span className="login-feature__icon">🚗</span>
                <span className="login-feature__text">Control de Móviles</span>
              </div>
              <div className="login-feature">
                <span className="login-feature__icon">📊</span>
                <span className="login-feature__text">Dashboard Analítico</span>
              </div>
              <div className="login-feature">
                <span className="login-feature__icon">💰</span>
                <span className="login-feature__text">Gestión Financiera</span>
              </div>
            </div>
          </div>

          <div className="login-branding__footer">
            <span>Made in</span>
            <span className="login-branding__koffys">Sistemas Koffys</span>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="login-form-wrapper animate-fade-up delay-2">
          <div className="login-card glass-card">
            <div className="login-card__header">
              <h2 className="login-card__title">Iniciar sesión</h2>
              <p className="login-card__desc">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            {!isFirebaseConfigured && (
              <div className="login-setup-banner">
                <div className="login-setup-banner__icon">⚙️</div>
                <div className="login-setup-banner__content">
                  <strong>Configuración pendiente</strong>
                  <p>Configura las variables de Firebase en <code>frontend/.env</code> para habilitar el login.</p>
                </div>
              </div>
            )}

            {isFirebaseConfigured && (
              <button
                type="button"
                className="btn btn--secondary btn--full login-google-btn"
                onClick={handleGoogleLogin}
                disabled={googleLoading || isLoading}
              >
                {googleLoading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <FcGoogle className="login-google-icon" />
                )}
                Ingresar con Google
              </button>
            )}

            {isFirebaseConfigured && (
              <div className="login-divider">
                <span>o ingresar con correo</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="login-email">
                  Correo electrónico
                </label>
                <div className="input-icon-wrapper">
                  <MailIcon className="input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="input input--with-icon"
                    placeholder="usuario@plusmovil.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading || googleLoading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="login-password">
                  Contraseña
                </label>
                <div className="input-icon-wrapper">
                  <LockIcon className="input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input input--with-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading || googleLoading}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--full btn--lg"
                disabled={isLoading || googleLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" style={{ width: 20, height: 20, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>

            <div className="login-card__footer">
              <p>Plus Móvil Tarija · CRM Radio Móviles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
