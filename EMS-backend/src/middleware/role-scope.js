import { sendError } from '../utils/respond.js';

export function enforceRoleScope(req, res, next) {
  try {
    // Allow an employee to fetch their own profile even if they lack global employees:read permission.
    const employeeIdParam = req.params?.employeeId;
    if (req.method === 'GET' && employeeIdParam && req.user) {
      const role = req.user.role;
      if (role === 'employee' && req.user.employee_id === employeeIdParam) {
        // Mark the request as allowed by role-scope so permission middleware can skip.
        req.__roleScopeAllowed = true;
        return next();
      }
      // super_admin handled by requirePermission; HR roles will have permission set.
    }

    return next();
  } catch (err) {
    return sendError(res, 'INTERNAL_SERVER_ERROR', 'Role scope check failed.', 500);
  }
}

export default enforceRoleScope;
