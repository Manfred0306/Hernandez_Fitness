import AuthService from '../services/AuthService.js';
export async function login(req, res, next) {
  try { const result = await AuthService.login(req.body.email, req.body.password); res.cookie('token', result.token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 28800000 }); res.json(result); } catch (e) { next(e); }
}
export function logout(_req, res) { res.clearCookie('token'); res.status(204).end(); }
