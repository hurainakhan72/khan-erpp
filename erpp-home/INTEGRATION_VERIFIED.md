Login page integration check
===========================

- Frontend login uses `/api/auth/login` and `/api/auth/session` (see `src/context/AuthContext.tsx`).
- Vite dev server proxy is configured in `vite.config.ts` with default target `http://localhost:3001`.
- Backend seed scripts (`EMS-backend/seeds/master_seed_extend.js`) generate 520 employee and user rows (EMP001..EMP520).

What I verified
----------------
- Client is wired to backend endpoints and will store session token/cookie.
- Seed script outputs indicate `employee_info 520` and `users 520` when run.

Next steps to fully verify runtime behavior
-----------------------------------------
- Start the backend (`EMS-backend/server.js`) and the database, run the seed scripts, then confirm `SELECT COUNT(*) FROM users` returns 520.
- Start the frontend (`erpp-home`) with Vite and ensure `VITE_DEV_API_PROXY` points to the running backend if needed.

If you want, I can run the seed and start the backend now (requires DB access). Otherwise this file records the integration checks.
