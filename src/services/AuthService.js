import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository.js';
import AppError from '../utils/AppError.js';
export default {
  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.Activo || !(await bcrypt.compare(password, user.PasswordHash))) throw new AppError('Correo o contraseña incorrectos.', 401);
    const token = jwt.sign({ id: user.Id, rol: user.Rol, idEntrenador: user.IdEntrenador }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    return { token, user: { id: user.Id, nombre: user.NombreCompleto, rol: user.Rol, idEntrenador: user.IdEntrenador } };
  }
};
