import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, ShieldCheck, ShieldOff, Users, UserCheck, UserX, KeyRound } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useToastContext } from '../context/ToastContext';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .acc-page {
    font-family:'Segoe UI',system-ui,sans-serif;
    padding:24px 30px;
    background:#f0f2f8;
    min-height:100vh;
  }

  .acc-card {
    background:#fff;
    border-radius:16px;
    box-shadow:0 1px 12px rgba(30,27,75,.07);
    animation:fadeUp .35s ease both;
  }

  /* ── Stats ── */
  .acc-stats {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:12px;
    margin-bottom:14px;
  }
  @media(max-width:900px){ .acc-stats{ grid-template-columns:repeat(2,1fr); } }

  .acc-stat {
    background:#fff;
    border:0.5px solid #e5e7eb;
    border-radius:14px;
    padding:14px 16px;
    display:flex; align-items:center; gap:12px;
    animation:fadeUp .35s ease both;
  }
  .acc-stat-icon {
    width:42px; height:42px; border-radius:11px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .acc-stat-lbl   { font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.06em; margin-bottom:2px; }
  .acc-stat-val   { font-size:20px; font-weight:800; font-family:monospace; }
  .acc-stat-sub   { font-size:10px; color:#9ca3af; margin-top:1px; }

  /* ── Table ── */
  .acc-table { width:100%; border-collapse:collapse; }
  .acc-table thead tr { border-bottom:1.5px solid #f1f5f9; }
  .acc-table th {
    text-align:left; padding:10px 14px;
    font-size:10px; font-weight:700; color:#9ca3af;
    letter-spacing:.07em; text-transform:uppercase; white-space:nowrap;
  }
  .acc-table td {
    padding:11px 14px; font-size:12px; color:#374151;
    border-bottom:0.5px solid #f8fafc; vertical-align:middle;
  }
  .acc-table tbody tr { transition:background .12s; }
  .acc-table tbody tr:hover td { background:#f8faff; }
  .acc-table tbody tr:last-child td { border-bottom:none; }

  /* ── Avatar ── */
  .acc-avatar {
    width:34px; height:34px; border-radius:10px;
    color:#fff; display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:800; flex-shrink:0; letter-spacing:.03em;
  }

  /* ── Chips ── */
  .acc-id-chip {
    font-family:monospace; font-size:11px;
    background:#f3f4f6; padding:2px 8px;
    border-radius:6px; color:#374151; font-weight:600;
  }
  .acc-date-chip {
    font-family:monospace; font-size:11px; color:#6b7280;
    background:#f3f4f6; padding:2px 7px; border-radius:6px;
  }

  /* ── Pills ── */
  .acc-pill {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 10px; border-radius:20px;
    font-size:9px; font-weight:800; white-space:nowrap;
  }
  .acc-pill-active   { background:#d1fae5; color:#065f46; }
  .acc-pill-inactive { background:#fee2e2; color:#991b1b; }
  .acc-pill-hr       { background:#ede9fe; color:#3730a3; }
  .acc-pill-super    { background:#fef3c7; color:#92400e; border:1px solid #fde68a; }

  /* ── Status dot ── */
  .acc-dot {
    width:7px; height:7px; border-radius:50%;
    display:inline-block; flex-shrink:0;
  }

  /* ── Buttons ── */
  .acc-btn {
    height:36px; border:none; border-radius:10px; padding:0 16px;
    font-size:12px; font-weight:700; cursor:pointer;
    display:inline-flex; align-items:center; gap:6px;
    transition:opacity .15s,transform .15s; font-family:inherit;
  }
  .acc-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
  .acc-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .acc-btn-primary  {
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff; box-shadow:0 3px 10px rgba(99,102,241,.3);
    border:none;
  }
  .acc-btn-secondary{ background:#f3f4f6; color:#374151; border:1.5px solid #e5e7eb; }
  .acc-btn-deact    {
    background:#fee2e2; color:#991b1b; border:0.5px solid #fecaca;
    height:28px; padding:0 10px; font-size:11px; border-radius:8px;
    cursor:pointer; display:inline-flex; align-items:center; gap:5px;
    font-weight:700; font-family:inherit; transition:background .13s;
  }
  .acc-btn-deact:hover { background:#fecaca; }
  .acc-btn-act      {
    background:#d1fae5; color:#065f46; border:0.5px solid #a7f3d0;
    height:28px; padding:0 10px; font-size:11px; border-radius:8px;
    cursor:pointer; display:inline-flex; align-items:center; gap:5px;
    font-weight:700; font-family:inherit; transition:background .13s;
  }
  .acc-btn-act:hover { background:#a7f3d0; }

  /* ── Modal form ── */
  .acc-sec-lbl {
    font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
    margin-bottom:8px; margin-top:16px; padding-bottom:5px;
    border-bottom:1.5px dashed #f1f5f9;
  }
  .acc-form-row   { display:flex; gap:10px; flex-wrap:wrap; }
  .acc-form-group { display:flex; flex-direction:column; gap:4px; flex:1; min-width:120px; margin-bottom:10px; }
  .acc-form-label { font-size:11px; font-weight:700; color:#6b7280; }
  .acc-input {
    height:34px; border:0.5px solid #e5e7eb; border-radius:9px;
    padding:0 11px; font-size:12px; background:#fff; color:#374151;
    outline:none; font-family:inherit; width:100%; transition:border .15s;
  }
  .acc-input:focus { border-color:#6366f1; box-shadow:0 0 0 2px rgba(99,102,241,.15); }
  .acc-input:disabled { background:#f9fafb; color:#9ca3af; }
  .acc-select { cursor:pointer; }

  /* ── Password strength ── */
  .acc-pw-track { height:4px; border-radius:4px; background:#f3f4f6; margin-top:5px; overflow:hidden; }
  .acc-pw-fill  { height:100%; border-radius:4px; transition:width .3s,background .3s; }

  /* ── Info note ── */
  .acc-info-note {
    margin-top:12px; padding:10px 13px; border-radius:10px;
    background:#ede9fe; border:0.5px solid #c7d2fe;
    font-size:11px; color:#3730a3; font-weight:600;
    display:flex; align-items:center; gap:8px;
  }

  /* ── Protected label ── */
  .acc-protected {
    font-size:11px; color:#9ca3af; font-style:italic;
  }

  /* ── Empty ── */
  .acc-empty { text-align:center; padding:52px 20px; }

  ::-webkit-scrollbar { height:4px; width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:4px; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || '?';

const avatarGradients = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#f97316,#f59e0b)',
  'linear-gradient(135deg,#14b8a6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
];
const nameGrad = (name: string) =>
  avatarGradients[(name?.charCodeAt(0) || 0) % avatarGradients.length];

const pwStrength = (pw: string) => {
  if (!pw)           return { label: '',        color: '#e5e7eb', pct: 0 };
  if (pw.length < 4) return { label: 'Weak',    color: '#ef4444', pct: 20 };
  if (pw.length < 7) return { label: 'Fair',    color: '#f97316', pct: 45 };
  if (pw.length < 10)return { label: 'Good',    color: '#6366f1', pct: 72 };
  return               { label: 'Strong',       color: '#10b981', pct: 100 };
};

// ══════════════════════════════════════════════════════════════════════════════
export default function Accounts() {
  const { hrAccounts, setHrAccounts, employees } = useData();
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [linkedEmp, setLinkedEmp] = useState('');
  const { showToast } = useToastContext();

  // ── Logic untouched ───────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!username || !password) { showToast('Username and password required', 'error'); return; }
    if (password !== confirmPw)  { showToast('Passwords do not match', 'error'); return; }
    setSaving(true);
    setTimeout(() => {
      setHrAccounts((prev: any) => [...prev, {
        id: 'ACC' + String(prev.length + 1).padStart(3, '0'),
        username, role: 'hr',
        linkedEmployee: linkedEmp || '-',
        status: 'Active',
        created: new Date().toISOString().split('T')[0],
      }]);
      setSaving(false); setModal(false); showToast('Account created');
      setUsername(''); setPassword(''); setConfirmPw(''); setLinkedEmp('');
    }, 500);
  };

  const toggleStatus = (id: string) => {
    setHrAccounts((prev: any) =>
      prev.map((a: any) => a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a)
    );
    showToast('Account status updated');
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const total    = hrAccounts.length;
  const active   = hrAccounts.filter((a: any) => a.status === 'Active').length;
  const inactive = hrAccounts.filter((a: any) => a.status === 'Inactive').length;
  const linked   = hrAccounts.filter((a: any) => a.linkedEmployee && a.linkedEmployee !== '-').length;

  const pw = pwStrength(password);
  const pwMatch = confirmPw.length > 0 ? password === confirmPw : null;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="acc-page">

        {/* ── Page Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#1e1b4b' }}>HR Accounts</h1>
            <p style={{ margin:'4px 0 0', fontSize:12, color:'#9ca3af' }}>
              Manage system user accounts &nbsp;·&nbsp;
              <span style={{ color:'#6366f1', fontWeight:700 }}>{total} account{total !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <button className="acc-btn acc-btn-primary" onClick={() => setModal(true)}>
            <Plus size={13} /> Add HR Account
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="acc-stats">
          {([
            { icon:<Users size={18}/>,     bg:'#ede9fe', color:'#3730a3', label:'Total Accounts',   value: total,    sub:'All system users' },
            { icon:<UserCheck size={18}/>, bg:'#d1fae5', color:'#065f46', label:'Active',            value: active,   sub:'Currently enabled' },
            { icon:<UserX size={18}/>,     bg:'#fee2e2', color:'#991b1b', label:'Inactive',          value: inactive, sub:'Disabled accounts' },
            { icon:<KeyRound size={18}/>,  bg:'#dbeafe', color:'#1e40af', label:'Linked Employees',  value: linked,   sub:'With employee mapping' },
          ] as any[]).map((s, i) => (
            <div className="acc-stat" key={i} style={{ animationDelay:`${i * 0.06}s` }}>
              <div className="acc-stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
              <div>
                <div className="acc-stat-lbl">{s.label}</div>
                <div className="acc-stat-val" style={{ color:s.color }}>{s.value}</div>
                <div className="acc-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="acc-card" style={{ padding:0 }}>
          <div style={{ overflowX:'auto' }}>
            <table className="acc-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Account ID</th>
                  <th>Role</th>
                  <th>Linked Employee</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hrAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="acc-empty">
                        <div style={{ fontSize:28, marginBottom:8 }}>🔐</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:4 }}>No accounts yet</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>Click "Add HR Account" to create the first user</div>
                      </div>
                    </td>
                  </tr>
                ) : hrAccounts.map((a: any) => {
                  const isSuper = a.role === 'super_admin';
                  return (
                    <tr key={a.id}>

                      {/* User avatar + name */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div
                            className="acc-avatar"
                            style={{ background: isSuper
                              ? 'linear-gradient(135deg,#f97316,#eab308)'
                              : nameGrad(a.username)
                            }}
                          >
                            {getInitials(a.username)}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:12, color:'#1e1b4b' }}>{a.username}</div>
                            <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>
                              {isSuper ? 'System Administrator' : 'HR Personnel'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ID chip */}
                      <td><span className="acc-id-chip">{a.id}</span></td>

                      {/* Role pill */}
                      <td>
                        {isSuper
                          ? <span className="acc-pill acc-pill-super">★ Super Admin</span>
                          : <span className="acc-pill acc-pill-hr">⚙ HR</span>
                        }
                      </td>

                      {/* Linked employee */}
                      <td>
                        {a.linkedEmployee && a.linkedEmployee !== '-' ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:'#1e1b4b' }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:'#6366f1', display:'inline-block', flexShrink:0 }} />
                            {a.linkedEmployee}
                          </span>
                        ) : (
                          <span style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>— not linked</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`acc-pill ${a.status === 'Active' ? 'acc-pill-active' : 'acc-pill-inactive'}`}>
                          <span
                            className="acc-dot"
                            style={{ background: a.status === 'Active' ? '#10b981' : '#ef4444' }}
                          />
                          {a.status}
                        </span>
                      </td>

                      {/* Created */}
                      <td><span className="acc-date-chip">{a.created}</span></td>

                      {/* Actions */}
                      <td>
                        {isSuper ? (
                          <span className="acc-protected">Protected</span>
                        ) : a.status === 'Active' ? (
                          <button className="acc-btn-deact" onClick={() => toggleStatus(a.id)}>
                            <ShieldOff size={11} /> Deactivate
                          </button>
                        ) : (
                          <button className="acc-btn-act" onClick={() => toggleStatus(a.id)}>
                            <ShieldCheck size={11} /> Activate
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ Add Account Modal ═══════════════════════════════════════════════ */}
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Add HR Account"
          footer={
            <>
              <button className="acc-btn acc-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="acc-btn acc-btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Creating...' : 'Create Account'}
              </button>
            </>
          }
        >
          {/* ── Credentials ── */}
          <div className="acc-sec-lbl" style={{ color:'#3730a3', marginTop:0 }}>Credentials</div>

          <div className="acc-form-group">
            <label className="acc-form-label">Username</label>
            <input
              className="acc-input"
              placeholder="e.g. hr.manager"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="acc-form-row">
            <div className="acc-form-group">
              <label className="acc-form-label">Password</label>
              <input
                className="acc-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {password && (
                <>
                  <div className="acc-pw-track">
                    <div className="acc-pw-fill" style={{ width:`${pw.pct}%`, background:pw.color }} />
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:pw.color, marginTop:2 }}>{pw.label}</div>
                </>
              )}
            </div>
            <div className="acc-form-group">
              <label className="acc-form-label">Confirm Password</label>
              <input
                className="acc-input"
                type="password"
                placeholder="Re-enter password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                style={{ borderColor: pwMatch === false ? '#ef4444' : undefined }}
              />
              {pwMatch === true  && <div style={{ fontSize:10, fontWeight:700, color:'#065f46', marginTop:2 }}>✓ Passwords match</div>}
              {pwMatch === false && <div style={{ fontSize:10, fontWeight:700, color:'#991b1b', marginTop:2 }}>✕ Passwords do not match</div>}
            </div>
          </div>

          {/* ── Account Setup ── */}
          <div className="acc-sec-lbl" style={{ color:'#065f46' }}>Account Setup</div>

          <div className="acc-form-group">
            <label className="acc-form-label">Link to Employee (optional)</label>
            <select
              className="acc-input acc-select"
              value={linkedEmp}
              onChange={e => setLinkedEmp(e.target.value)}
            >
              <option value="">None — standalone account</option>
              {employees.map((e: any) => (
                <option key={e.id} value={`${e.id} - ${e.name}`}>{e.id} — {e.name}</option>
              ))}
            </select>
          </div>

          <div className="acc-form-group">
            <label className="acc-form-label">Role</label>
            <input className="acc-input" value="hr" disabled />
          </div>

          <div className="acc-info-note">
            <KeyRound size={13} />
            This account will have HR-level access. Super Admin privileges are assigned separately.
          </div>
        </Modal>

      </div>
    </>
  );
}