import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../images/logo.png';


export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  if (user) {
    return <Navigate to={user.role === 'employee' ? '/my-dashboard' : '/dashboard'} />;
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    (async () => {
      try {
        const result = await login(email, password);
        if (result.ok) {
          const stored = JSON.parse(localStorage.getItem('ems_user') || '{}');
          navigate(stored.role === 'employee' ? '/my-dashboard' : '/dashboard');
        } else {
          setError(result.error);
        }
      } catch (e) {
        setError('Login failed');
      } finally {
        setLoading(false);
      }
    })();
  };


  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img
            src={logo}
            alt="ESSPL Logo"
            className="login-logo"
            style={{ width: 170, height: 'auto', display: 'block', margin: '0 auto 8px' }}
          />
        </div>
        <div className="login-title">Employee Management System</div>
        <div className="login-sub">Sign in to your account</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}