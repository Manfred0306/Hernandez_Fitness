import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

export function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new AppError('Autenticación requerida.', 401);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) { next(error.name === 'JsonWebTokenError' ? new AppError('Token inválido.', 401) : error); }
}
export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user.rol) ? next() : next(new AppError('No tiene permiso para esta acción.', 403));
