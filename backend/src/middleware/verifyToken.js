const admin = require('../config/firebase');
const supabase = require('../config/supabase');

/**
 * Middleware to verify Firebase token and attach user info
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get role from Supabase
    const { data, error } = await supabase
      .from('users_roles')
      .select('*')
      .eq('email', decodedToken.email)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: 'Usuario no registrado en el sistema' });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: data.role,
      nombre: data.nombre,
      userId: data.id,
    };

    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware factory to verify specific roles
 */
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Admin always has access
    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'No autorizado para esta acción' });
  };
};

module.exports = { verifyToken, verifyRole };
