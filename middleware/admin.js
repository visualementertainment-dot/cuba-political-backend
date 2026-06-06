function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Acceso de administrador requerido' });
  }
  next();
}

module.exports = adminMiddleware;