import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getVisibleEmployees } from '../utils/utils';
import { getStatusColor } from '../services/api';
import { Plus, Search, Eye, Pencil, ChevronUp, ChevronDown, ArrowUpDown, UserX } from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToastContext } from '../context/ToastContext';

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .emp-page { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; padding:22px 28px; background:#f0f2f8; min-height:100vh; }
  .emp-card { background:#fff; border-radius:16px; padding:18px 20px; box-shadow:0 1px 10px rgba(0,0,0,.07); animation:fadeUp .35s ease both; }
  .emp-input {
    height:36px; border:1.5px solid #e5e7eb; border-radius:10px; padding:0 12px;
    font-size:12px; color:#374151; background:#fff; outline:none; transition:border .15s,box-shadow .15s;
    font-family:inherit;
  }
  .emp-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
  .emp-select { cursor:pointer; padding-right:28px; }
  .emp-table { width:100%; border-collapse:collapse; }
  .emp-table thead tr { border-bottom:2px solid #f1f5f9; }
  .emp-table th {
    text-align:left; padding:10px 12px; font-size:10px; font-weight:700;
    color:#9ca3af; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap;
    user-select:none;
  }
  .emp-table th.sortable { cursor:pointer; }
  .emp-table th.sortable:hover { color:#6366f1; }
  .emp-table td { padding:10px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f8fafc; vertical-align:middle; }
  .emp-table tbody tr { transition:background .1s; }
  .emp-table tbody tr:hover td { background:#f8faff; }
  .emp-table tbody tr:last-child td { border-bottom:none; }
  .emp-avatar {
    width:32px; height:32px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff; display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:700; flex-shrink:0;
  }
  .emp-pill {
    display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px;
    font-size:9px; font-weight:700; white-space:nowrap;
  }
  .emp-pill-active    { background:#dcfce7; color:#166534; }
  .emp-pill-probation { background:#fef3c7; color:#d97706; }
  .emp-pill-notice    { background:#fee2e2; color:#dc2626; }
  .emp-pill-terminated{ background:#f3f4f6; color:#6b7280; }
  .emp-pill-default   { background:#eff6ff; color:#2563eb; }
  .emp-ico-btn {
    width:28px; height:28px; border:1.5px solid #e5e7eb; border-radius:8px;
    background:#fff; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;
    color:#6b7280; transition:all .15s;
  }
  .emp-ico-btn:hover { background:#6366f1; border-color:#6366f1; color:#fff; }
  .emp-btn {
    height:36px; border:none; border-radius:10px; padding:0 16px; font-size:12px;
    font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;
    transition:opacity .15s,transform .15s; font-family:inherit;
  }
  .emp-btn:hover { opacity:.88; transform:translateY(-1px); }
  .emp-btn-primary { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,.35); }
  .emp-btn-danger  { background:#fee2e2; color:#dc2626; }
  .emp-btn-ghost   { background:#f3f4f6; color:#374151; border:1.5px solid #e5e7eb; }
  .emp-btn-ghost:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .emp-btn-pg      { height:30px; min-width:30px; padding:0 10px; border-radius:8px; font-size:11px; }
  .emp-btn-pg-active { background:#6366f1; color:#fff; box-shadow:0 2px 8px rgba(99,102,241,.3); }
  .emp-bulk { background:#eff6ff; border:1.5px solid #c7d2fe; border-radius:14px; padding:10px 16px; margin-bottom:12px; display:flex; align-items:center; gap:12px; animation:fadeUp .2s ease both; }
  .emp-check { accent-color:#6366f1; width:14px; height:14px; cursor:pointer; }
  ::-webkit-scrollbar { height:4px; width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:4px; }
`;

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();

// ── Avatar color from name hash ──
const avatarGradients = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f9a8d4)',
  'linear-gradient(135deg,#f97316,#fbbf24)',
  'linear-gradient(135deg,#14b8a6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
];
const nameGrad = (name: string) => avatarGradients[name.charCodeAt(0) % avatarGradients.length];

// ── Status pill mapping ──
const pillClass = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'active')     return 'emp-pill emp-pill-active';
  if (s === 'probation')  return 'emp-pill emp-pill-probation';
  if (s?.includes('notice')) return 'emp-pill emp-pill-notice';
  if (s === 'terminated') return 'emp-pill emp-pill-terminated';
  return 'emp-pill emp-pill-default';
};

type SortKey = 'id' | 'name' | 'department' | 'designation' | 'employmentType' | 'jobStatus' | 'shift' | 'dateOfJoining';
type SortDir = 'asc' | 'desc';

// ══════════════════════════════════════════════════════════════════════════════
export default function Employees() {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { employees, setEmployees, departments, jobStatuses, workModes } = useData();
  const { user, activeRole } = useAuth();
  const [search,           setSearch]           = useState('');
  const [deptFilter,       setDeptFilter]       = useState('');
  const [statusFilter,     setStatusFilter]     = useState('');
  const [modeFilter,       setModeFilter]       = useState('');
  const [showTerminated,   setShowTerminated]   = useState(false);
  const [terminateConfirm, setTerminateConfirm] = useState(false);
  const [selected,         setSelected]         = useState<Set<string>>(new Set());
  const [sortKey,          setSortKey]          = useState<SortKey>('id');
  const [sortDir,          setSortDir]          = useState<SortDir>('asc');
  const [page,             setPage]             = useState(0);
  const [perPage,          setPerPage]          = useState(25);

  // ── All original logic unchanged ──────────────────────────────────────────
  const visibleEmployees = useMemo(() => getVisibleEmployees(user, activeRole, employees), [user, activeRole, employees]);

  const filtered = useMemo(() => {
    let list = visibleEmployees.filter(e => {
      if (!showTerminated && e.jobStatus === 'Terminated') return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (deptFilter && e.department !== deptFilter) return false;
      if (statusFilter && e.jobStatus !== statusFilter) return false;
      if (modeFilter && e.workMode !== modeFilter) return false;
      return true;
    });
    list.sort((a: any, b: any) => {
      const av = a[sortKey] || '';
      const bv = b[sortKey] || '';
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [employees, search, deptFilter, statusFilter, modeFilter, sortKey, sortDir, showTerminated]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged      = filtered.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map(e => e.id)));
  };

  const terminateSelected = () => {
    setEmployees(prev => prev.map(e => selected.has(e.id) ? { ...e, jobStatus: 'Terminated' } : e));
    showToast(`${selected.size} employee(s) terminated successfully`);
    setSelected(new Set());
    setTerminateConfirm(false);
  };

  const clearFilters = () => { setSearch(''); setDeptFilter(''); setStatusFilter(''); setModeFilter(''); };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={10} style={{ opacity: .3, marginLeft: 3 }} />;
    return sortDir === 'asc'
      ? <ChevronUp   size={10} style={{ marginLeft: 3, color: '#6366f1' }} />
      : <ChevronDown size={10} style={{ marginLeft: 3, color: '#6366f1' }} />;
  };

  const activeCount = visibleEmployees.filter(e => e.jobStatus !== 'Terminated').length;
  const hasFilters  = search || deptFilter || statusFilter || modeFilter;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="emp-page">

        {/* ── Page Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#1e1b4b' }}>Employees</h1>
            <p style={{ margin:'4px 0 0', fontSize:12, color:'#9ca3af' }}>
              Manage all employees in your organization &nbsp;·&nbsp;
              <span style={{ color:'#6366f1', fontWeight:600 }}>{activeCount} active</span>
            </p>
          </div>
          <button className="emp-btn emp-btn-primary" onClick={() => navigate('/employees/add')}>
            <Plus size={13} /> Add Employee
          </button>
        </div>

        {activeRole === 'hr' && user?.departments && !user.departments.includes('All') && (
          <div style={{ marginBottom: 12, fontSize: 12, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
            Showing only assigned department(s): <strong>{user.departments.join(', ')}</strong>.
          </div>
        )}

        {/* ── Filters + Search — same card as table ── */}
        <div className="emp-card" style={{ marginBottom:12 }}>

          {/* Filter bar */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:16 }}>

            {/* Search */}
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
              <input
                className="emp-input"
                style={{ paddingLeft:32, width:'100%' }}
                placeholder="Search by name or ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
              />
            </div>

            {/* Department */}
            <select
              className="emp-input emp-select"
              style={{ width:160 }}
              value={deptFilter}
              onChange={e => { setDeptFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>

            {/* Status */}
            <select
              className="emp-input emp-select"
              style={{ width:140 }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Statuses</option>
              {jobStatuses.map(s => <option key={s}>{s}</option>)}
            </select>

            {/* Work Mode */}
            <select
              className="emp-input emp-select"
              style={{ width:140 }}
              value={modeFilter}
              onChange={e => { setModeFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Work Modes</option>
              {workModes.map(m => <option key={m}>{m}</option>)}
            </select>

            {/* Show terminated */}
            <label style={{ fontSize:11, display:'flex', alignItems:'center', gap:5, cursor:'pointer', color:'#6b7280', userSelect:'none' }}>
              <input
                type="checkbox"
                className="emp-check"
                checked={showTerminated}
                onChange={e => setShowTerminated(e.target.checked)}
              />
              Show terminated
            </label>

            {/* Clear filters */}
            {hasFilters && (
              <button className="emp-btn emp-btn-ghost" style={{ height:32, fontSize:11 }} onClick={clearFilters}>
                Clear All ✕
              </button>
            )}
          </div>

          {/* Results count */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:11, color:'#9ca3af' }}>
              {filtered.length === 0
                ? 'No results'
                : `Showing ${filtered.length} employee${filtered.length !== 1 ? 's' : ''}${hasFilters ? ' (filtered)' : ''}`}
            </span>
            {selected.size > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:600, color:'#6366f1' }}>{selected.size} selected</span>
                <button className="emp-btn emp-btn-danger" style={{ height:30, fontSize:11 }} onClick={() => setTerminateConfirm(true)}>
                  <UserX size={11} /> Terminate Selected
                </button>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div style={{ overflowX:'auto' }}>
            <table className="emp-table">
              <thead>
                <tr>
                  <th style={{ width:36 }}>
                    <input
                      type="checkbox"
                      className="emp-check"
                      checked={paged.length > 0 && selected.size === paged.length}
                      onChange={selectAll}
                    />
                  </th>
                  <th className="sortable" onClick={() => toggleSort('id')}>Emp ID <SortIcon col="id" /></th>
                  <th className="sortable" onClick={() => toggleSort('name')}>Name <SortIcon col="name" /></th>
                  <th className="sortable" onClick={() => toggleSort('department')}>Department <SortIcon col="department" /></th>
                  <th className="sortable" onClick={() => toggleSort('designation')}>Designation <SortIcon col="designation" /></th>
                  <th className="sortable" onClick={() => toggleSort('employmentType')}>Type <SortIcon col="employmentType" /></th>
                  <th className="sortable" onClick={() => toggleSort('jobStatus')}>Status <SortIcon col="jobStatus" /></th>
                  <th>Shift</th>
                  <th className="sortable" onClick={() => toggleSort('dateOfJoining')}>Joined <SortIcon col="dateOfJoining" /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign:'center', padding:'48px 20px' }}>
                      <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:4 }}>No employees found</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>Try adjusting your search or filters</div>
                    </td>
                  </tr>
                ) : paged.map(e => (
                  <tr
                    key={e.id}
                    style={{
                      ...(selected.has(e.id) ? { background:'#f5f3ff' } : {}),
                      ...(e.jobStatus === 'Terminated' ? { opacity:0.5 } : {}),
                    }}
                  >
                    {/* Checkbox */}
                    <td>
                      <input
                        type="checkbox"
                        className="emp-check"
                        checked={selected.has(e.id)}
                        onChange={() => toggleSelect(e.id)}
                      />
                    </td>

                    {/* Emp ID */}
                    <td>
                      <span style={{ fontFamily:'monospace', fontSize:11, background:'#f3f4f6', padding:'2px 7px', borderRadius:6, color:'#374151', fontWeight:600 }}>
                        {e.id}
                      </span>
                    </td>

                    {/* Name + Avatar */}
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="emp-avatar" style={{ background: nameGrad(e.name) }}>
                          {e.avatar || getInitials(e.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, color:'#1e1b4b', fontSize:12 }}>{e.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span style={{ fontSize:11, color:'#6b7280' }}>{e.department}</span>
                    </td>

                    {/* Designation */}
                    <td>
                      <span style={{ fontSize:11, color:'#374151' }}>{e.designation}</span>
                    </td>

                    {/* Employment Type */}
                    <td>
                      <span style={{ fontSize:10, background:'#f3f4f6', padding:'2px 8px', borderRadius:20, color:'#6b7280', fontWeight:600 }}>
                        {e.employmentType}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={pillClass(e.jobStatus)}>
                        {e.jobStatus}
                      </span>
                    </td>

                    {/* Shift */}
                    <td style={{ fontSize:11, color:'#6b7280' }}>{e.shift}</td>

                    {/* Joined */}
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'#9ca3af' }}>{e.dateOfJoining}</td>

                    {/* Actions */}
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button
                          className="emp-ico-btn"
                          title="View"
                          onClick={() => navigate(`/employees/${e.id}`)}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="emp-ico-btn"
                          title="Edit"
                          onClick={() => navigate('/employees/add')}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#9ca3af' }}>
              <span>
                Showing&nbsp;
                <strong style={{ color:'#374151' }}>
                  {filtered.length === 0 ? 0 : page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)}
                </strong>
                &nbsp;of&nbsp;
                <strong style={{ color:'#374151' }}>{filtered.length}</strong>
              </span>
              <select
                className="emp-input"
                style={{ width:60, height:28, padding:'0 6px', fontSize:11 }}
                value={perPage}
                onChange={e => { setPerPage(+e.target.value); setPage(0); }}
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>per page</span>
            </div>

            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <button
                className="emp-btn emp-btn-ghost emp-btn-pg"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i}
                  className={`emp-btn emp-btn-pg ${page === i ? 'emp-btn-pg-active' : 'emp-btn-ghost'}`}
                  onClick={() => setPage(i)}
                >{i + 1}</button>
              ))}

              <button
                className="emp-btn emp-btn-ghost emp-btn-pg"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          </div>
        </div>

        {/* ── Confirm Dialog — logic unchanged ── */}
        <ConfirmDialog
          open={terminateConfirm}
          title="Terminate Selected Employees"
          message={`Are you sure you want to terminate ${selected.size} selected employee(s)? Their status will be set to Terminated and they will be hidden from the active list.`}
          onConfirm={terminateSelected}
          onCancel={() => setTerminateConfirm(false)}
        />

      </div>
    </>
  );
}