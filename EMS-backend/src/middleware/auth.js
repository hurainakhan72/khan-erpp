import jwt from 'jsonwebtoken';
import { sendError } from '../utils/respond.js';
import pool from '../config/db.js';

export async function verifyToken(req, res, next) {
  // Check both cookie and Authorization header
  let token = req.cookies?.ems_jwt;
  let source = 'cookie';

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      source = 'header';
    }
  }

  console.log(`[AUTH DEBUG] Request to ${req.originalUrl} | Token found: ${!!token} | Source: ${source}`);

  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      user_id: decoded.user_id,
      employee_id: decoded.employee_id,
      role_id: decoded.role_id,
      must_change_password: decoded.must_change_password,
    };

    // Attach role name and simple flags to make role checks easier downstream.
    try {
      const roleResult = await pool.query('SELECT role_name FROM public.roles WHERE id = $1 LIMIT 1', [req.user.role_id]);
      const roleName = roleResult.rows[0]?.role_name || null;
      req.user.role = roleName;
      req.user.is_super_admin = roleName === 'super_admin';
    } catch (e) {
      // If DB lookup fails, continue without role_name; permission middleware will still guard.
      req.user.role = null;
      req.user.is_super_admin = false;
    }

    const isChangePasswordRoute =
      req.method === 'POST' &&
      (req.path === '/change-password' ||
        req.originalUrl?.endsWith('/api/auth/change-password'));

    if (req.user.must_change_password === true && !isChangePasswordRoute) {
      return sendError(
        res,
        'MUST_CHANGE_PASSWORD',
        'Password must be changed before continuing.',
        403
      );
    }

    return next();
  } catch {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token.', 401);
  }
}

verifyToken.__auth = true;
