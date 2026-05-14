// pages/BranchHRDashboard.tsx
// Visible to: SuperAdmin, Head HR only
// Branch cards → select → detail with verify/reject actions

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BRANCHES, EMP_DATA, INITIAL_LOCKS, INITIAL_REPORTS,
  nameGrad, getIni, SHARED_CSS,
  Branch, EmpRecord, LockState, LockStatus, SavedReport,
  SHIFT_STYLE, STATUS_STYLE,
} from './attendanceTypes';

// Lock status configuration (visuals for branch lock state)
const LOCK_STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; pillClass: string; icon: string }> = {
  unlocked:    { label: 'Open',       color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', pillClass: 'pill-indigo', icon: '📝' },
  branch_locked:{ label: 'Submitted', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', pillClass: 'pill-amber', icon: '🔒' },
  finalized:   { label: 'Finalized',  color: '#059669', bg: '#d1fae5', border: '#6ee7b7', pillClass: 'pill-green', icon: '✅' },
  rejected:    { label: 'Sent Back',  color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', pillClass: 'pill-red', icon: '↩️' },
};

// ── Small reusable Toast ──────────────────────────────────────────────────────
function useToast() {
  const [msg,     setMsg]     = useState('');
  const [type,    setType]    = useState<'success'|'error'|'info'>('success');
  const [visible, setVisible] = useState(false);

  const show = useCallback((m: string, t: 'success'|'error'|'info' = 'success') => {
    setMsg(m); setType(t); setVisible(true);
    setTimeout(() => setVisible(false), 3200);
  }, []);

  const ToastEl = (
    <div className={`toast${visible ? ' show' : ''}`}
      style={{ background: type === 'error' ? '#7f1d1d' : '#1e293b' }}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>{msg}</span>
    </div>
  );
  return { show, ToastEl };
}

// ── Verify Modal ──────────────────────────────────────────────────────────────
interface VerifyModalProps {
  branch: Branch;
  emps: EmpRecord[];
  onClose: () => void;
  onConfirm: () => void;
}
function VerifyModal({ branch, emps, onClose, onConfirm }: VerifyModalProps) {
  const pres = emps.filter(e => e.status === 'Present').length;
  const late = emps.filter(e => e.status === 'Late').length;
  const abs  = emps.filter(e => e.status === 'Absent').length;
  const olv  = emps.filter(e => e.status === 'On Leave').length;
  return (
    <div className="modal-ov">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-title">✅ Verify & Accept Sheet</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--green-l)', border: '1.5px solid var(--green-m)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>📋 Sheet Summary</div>
            <div style={{ fontSize: 11, color: 'var(--t2)' }}>
              Branch: <strong>{branch.name}</strong> &nbsp;|&nbsp;
              Date: <strong>{new Date().toLocaleDateString('en-PK')}</strong> &nbsp;|&nbsp;
              Staff: <strong>{emps.length}</strong>
            </div>
          </div>
          <div className="mini-stats">
            <div className="ms-card"><div className="ms-val" style={{ color: 'var(--green)' }}>{pres}</div><div className="ms-lbl">Present</div></div>
            <div className="ms-card"><div className="ms-val" style={{ color: 'var(--amber)' }}>{late}</div><div className="ms-lbl">Late</div></div>
            <div className="ms-card"><div className="ms-val" style={{ color: 'var(--red)' }}>{abs}</div><div className="ms-lbl">Absent</div></div>
            <div className="ms-card"><div className="ms-val" style={{ color: 'var(--violet)' }}>{olv}</div><div className="ms-lbl">On Leave</div></div>
          </div>
          <div style={{ marginTop: 14, background: 'var(--amber-l)', border: '1px solid var(--amber-m)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--amber)' }}>
            ⚠️ Once verified, this sheet will be finalized and exported to Saved Reports. This action cannot be undone.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={onConfirm}>✅ Verify & Accept</button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
interface RejectModalProps {
  branch: Branch;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}
function RejectModal({ branch, onClose, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-ov">
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-title">↩️ Send Back to Branch HR</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>
            Reason for rejection — <strong>{branch.name}</strong> *
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 9, padding: '10px 12px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', color: 'var(--t2)', outline: 'none', background: '#fff' }}
            rows={3}
            placeholder="e.g. Missing check-out times for 3 employees..."
          />
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-red" onClick={() => {
            if (!reason.trim()) { alert('Please enter a reason'); return; }
            onConfirm(reason.trim());
          }}>↩️ Send Back</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BranchHRDashboard() {
  const { activeRole } = useAuth();
  const { show: toast, ToastEl } = useToast();

  // Guard
  if (activeRole !== 'super_admin' && activeRole !== 'head_hr') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
        <span style={{ fontSize: 40 }}>🔒</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Access Restricted</span>
        <span style={{ fontSize: 12 }}>Only SuperAdmin and Head HR can access this page.</span>
      </div>
    );
  }

  // ── State ─────────────────────────────────────────────────────────────────
  const [locks,          setLocks]          = useState<Record<string, LockState>>(INITIAL_LOCKS);
  const [reports,        setReports]        = useState<SavedReport[]>(INITIAL_REPORTS);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [branchFilter,   setBranchFilter]   = useState('all');
  const [dateFilter,     setDateFilter]     = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [empSearch,      setEmpSearch]      = useState('');
  const [showVerify,     setShowVerify]     = useState(false);
  const [showReject,     setShowReject]     = useState(false);
  const [workflowStep,   setWorkflowStep]   = useState(1); // 0=records done, 1=branch locking, 2=head verifies, 3=finalized

  useEffect(() => {
    const finalCount = Object.values(locks).filter(l => l.status === 'finalized').length;
    if (finalCount === BRANCHES.length) setWorkflowStep(3);
    else if (Object.values(locks).some(l => l.status === 'branch_locked')) setWorkflowStep(2);
    else setWorkflowStep(1);
  }, [locks]);

  // Listen for sheet submissions from branch HR UI
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ev: any = e as any;
        const d = ev.detail;
        if (!d || !d.branchId) return;
        const now = new Date().toLocaleString('en-PK', { hour12: false }).slice(0, 16);

        setLocks(p => ({
          ...p,
          [d.branchId]: { ...(p[d.branchId] || { lockedBy: '' }), status: 'branch_locked', lockedBy: d.lockedBy || 'Branch HR', lockedAt: now }
        }));

        const rep: SavedReport = {
          id: 'r' + Date.now(),
          branch: d.branchName || d.branchId,
          date: d.date || new Date().toISOString().split('T')[0],
          lockedBy: d.lockedBy || '',
          verifiedBy: '',
          verifiedAt: '',
          empCount: Array.isArray(d.data) ? d.data.length : 0,
          data: d.data || [],
        };

        setReports(p => {
          const idx = p.findIndex(r => r.branch === rep.branch && r.date === rep.date);
          return idx >= 0 ? p.map((r, i) => i === idx ? rep : r) : [...p, rep];
        });

        toast(`${rep.branch} — sheet submitted by ${rep.lockedBy}`, 'success');
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('attendanceSheetSubmitted', handler as EventListener);
    return () => window.removeEventListener('attendanceSheetSubmitted', handler as EventListener);
  }, [setLocks, setReports, toast]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const lockStats = useMemo(() => ({
    total:     BRANCHES.length,
    open:      Object.values(locks).filter(l => l.status === 'unlocked').length,
    submitted: Object.values(locks).filter(l => l.status === 'branch_locked').length,
    finalized: Object.values(locks).filter(l => l.status === 'finalized').length,
    rejected:  Object.values(locks).filter(l => l.status === 'rejected').length,
  }), [locks]);

  const pendingCount = lockStats.submitted;

  const filteredBranches = useMemo(() => {
    return BRANCHES.filter(b => {
      const lk = locks[b.id];
      if (branchFilter !== 'all' && lk?.status !== branchFilter) return false;
      if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [locks, branchFilter, searchTerm]);

  const selectedBranch = BRANCHES.find(b => b.id === selectedId);
  const selectedLock   = selectedId ? locks[selectedId] : null;
  const selectedEmps   = selectedId ? (EMP_DATA[selectedId] || []) : [];

  const filteredEmps = useMemo(() => {
    if (!empSearch.trim()) return selectedEmps;
    const t = empSearch.toLowerCase();
    return selectedEmps.filter(e => e.name.toLowerCase().includes(t) || e.dept.toLowerCase().includes(t));
  }, [selectedEmps, empSearch]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleVerify = () => {
    if (!selectedId || !selectedBranch) return;
    const now = new Date().toLocaleString('en-PK', { hour12: false }).slice(0, 16);
    const newLock: LockState = {
      ...locks[selectedId],
      status: 'finalized',
      verifiedBy: 'Head Admin',
      verifiedAt: now,
    };
    setLocks(p => ({ ...p, [selectedId]: newLock }));

    // Save to reports
    const rep: SavedReport = {
      id: 'r' + Date.now(),
      branch: selectedBranch.name,
      date: dateFilter,
      lockedBy: locks[selectedId].lockedBy,
      verifiedBy: 'Head Admin',
      verifiedAt: now,
      empCount: selectedEmps.length,
      data: selectedEmps,
    };
    setReports(p => {
      const idx = p.findIndex(r => r.branch === selectedBranch.name && r.date === dateFilter);
      return idx >= 0 ? p.map((r, i) => i === idx ? rep : r) : [...p, rep];
    });
    setShowVerify(false);
    toast(`✅ ${selectedBranch.name} sheet verified & saved to reports!`, 'success');
  };

  const handleReject = (reason: string) => {
    if (!selectedId || !selectedBranch) return;
    setLocks(p => ({ ...p, [selectedId]: { ...p[selectedId], status: 'rejected', reason } }));
    setShowReject(false);
    toast(`↩️ ${selectedBranch.name} sheet sent back to Branch HR`, 'info');
  };

  const exportBranch = (id: string) => {
    const b = BRANCHES.find(x => x.id === id);
    const data = { branch: b?.name, date: dateFilter, exportedAt: new Date().toISOString(), records: EMP_DATA[id] || [] };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `attendance_${b?.name.replace(/ /g, '_')}_${dateFilter}.json`; a.click();
    toast(`📤 Exported ${b?.name} attendance`, 'success');
  };

  const exportAll = () => {
    const all: any = { exportedAt: new Date().toISOString(), branches: {} };
    BRANCHES.forEach(b => { all.branches[b.name] = EMP_DATA[b.id] || []; });
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `all_branches_${dateFilter}.json`; a.click();
    toast('📦 All branch reports exported', 'success');
  };

  const selectBranch = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
    setEmpSearch('');
    setTimeout(() => {
      document.getElementById('branch-detail-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // ── Detail mini stats ─────────────────────────────────────────────────────
  const detailStats = useMemo(() => {
    if (!selectedEmps.length) return { pres: 0, late: 0, abs: 0, olv: 0 };
    return {
      pres: selectedEmps.filter(e => e.status === 'Present').length,
      late: selectedEmps.filter(e => e.status === 'Late').length,
      abs:  selectedEmps.filter(e => e.status === 'Absent').length,
      olv:  selectedEmps.filter(e => e.status === 'On Leave').length,
    };
  }, [selectedEmps]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{SHARED_CSS}</style>
      {ToastEl}

      <div style={{ padding: '22px 24px', fontFamily: "'DM Sans',sans-serif" }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="page-title">
              <div className="page-title-ic" style={{ background: 'linear-gradient(135deg,#eef2ff,#ede9fe)' }}>🏢</div>
              Branch HR Dashboard
            </div>
            <div className="page-sub">
              Branch HRs submit daily sheets → Head HR verifies & finalizes &nbsp;·&nbsp;
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="topbar-right">
            {pendingCount > 0 && (
              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                ⚠️ {pendingCount} sheet{pendingCount > 1 ? 's' : ''} awaiting review
              </span>
            )}
            <button className="btn btn-ghost" onClick={exportAll}>📤 Export All</button>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="steps">
          <div className={`step ${workflowStep >= 0 ? 'done' : 'pending'}`}>
            <div className="step-ic">✓</div> Branch Records Marked
          </div>
          <div className="step-arrow" style={{ background: workflowStep >= 1 ? 'var(--green-m)' : 'var(--border)' }} />
          <div className={`step ${workflowStep >= 2 ? 'done' : workflowStep === 1 ? 'active' : 'pending'}`}>
            <div className="step-ic">{workflowStep >= 2 ? '✓' : '🔒'}</div> Branch HR Locks Sheet
          </div>
          <div className="step-arrow" style={{ background: workflowStep >= 2 ? 'var(--amber-m)' : 'var(--border)' }} />
          <div className={`step ${workflowStep >= 3 ? 'done' : workflowStep === 2 ? 'active' : 'pending'}`}>
            <div className="step-ic">{workflowStep >= 3 ? '✓' : '👁'}</div> Head HR Verifies
          </div>
          <div className="step-arrow" style={{ background: workflowStep >= 3 ? 'var(--green-m)' : 'var(--border)' }} />
          <div className={`step ${workflowStep >= 3 ? 'done' : 'pending'}`}>
            <div className="step-ic">{workflowStep >= 3 ? '✓' : '✅'}</div> Finalized & Saved
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stat-grid-5">
          {[
            { cls: 'sc-green',  icon: '🏢', val: lockStats.total,     lbl: 'Total Branches', sub: 'Company-wide',        filter: 'all' },
            { cls: 'sc-indigo', icon: '📝', val: lockStats.open,      lbl: 'Open (Not Locked)', sub: 'Awaiting branch lock', filter: 'unlocked' },
            { cls: 'sc-amber',  icon: '🔒', val: lockStats.submitted, lbl: 'Submitted',      sub: 'Awaiting head verify', filter: 'branch_locked' },
            { cls: 'sc-green',  icon: '✅', val: lockStats.finalized, lbl: 'Finalized',      sub: 'Saved to reports',    filter: 'finalized' },
            { cls: 'sc-red',    icon: '↩️', val: lockStats.rejected,  lbl: 'Sent Back',      sub: 'Needs correction',    filter: 'rejected' },
          ].map((s, i) => (
            <div key={i}
              className={`scard ${s.cls}${branchFilter === s.filter ? ' on' : ''}`}
              onClick={() => setBranchFilter(branchFilter === s.filter ? 'all' : s.filter)}>
              <div className="scard-icon">{s.icon}</div>
              <div className="scard-val">{s.val}</div>
              <div className="scard-lbl">{s.lbl}</div>
              <div className="scard-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter Row */}
        <div className="frow">
          <select className="fsel" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value={new Date().toISOString().split('T')[0]}>📅 Today — {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</option>
            <option value="2026-05-06">📅 Yesterday</option>
            <option value="2026-05-05">📅 05 May 2026</option>
          </select>
          <select className="fsel" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="unlocked">Open</option>
            <option value="branch_locked">Submitted</option>
            <option value="finalized">Finalized</option>
            <option value="rejected">Sent Back</option>
          </select>
          <div className="fsrc">
            <span>🔍</span>
            <input type="text" placeholder="Search branch..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto', fontWeight: 600 }}>
            {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Branch Cards Grid */}
        <div className="branch-grid">
          {filteredBranches.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty"><span className="empty-ic">🔍</span>No branches match your filter</div>
            </div>
          ) : filteredBranches.map(b => {
            const lk  = locks[b.id] || { status: 'unlocked' };
            const cfg = LOCK_STATUS_CFG[lk.status as LockStatus];
            const emps = EMP_DATA[b.id] || [];
            const pres = emps.filter(e => e.status === 'Present').length;
            const late = emps.filter(e => e.status === 'Late').length;
            const abs  = emps.filter(e => e.status === 'Absent').length;
            const isSel = selectedId === b.id;
            return (
              <div key={b.id} className={`bcard${isSel ? ' bsel' : ''}`} onClick={() => selectBranch(b.id)}>
                <span className="bcard-status" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon} {cfg.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <div className="av" style={{ background: nameGrad(b.name), width: 34, height: 34, borderRadius: 9 }}>{getIni(b.name)}</div>
                  <div>
                    <div className="bcard-name">{b.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{b.city}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>👔 {b.mgr} · {emps.length} staff</div>
                <div className="bcard-counts">
                  <span><span className="bcard-dot" style={{ background: '#059669' }} />{pres} Present</span>
                  <span><span className="bcard-dot" style={{ background: '#d97706' }} />{late} Late</span>
                  <span><span className="bcard-dot" style={{ background: '#dc2626' }} />{abs} Absent</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Branch Detail */}
        {selectedBranch && selectedLock && (
          <div id="branch-detail-section">
            <div className="divider" />
            <div className="card">
              {/* Gradient Header */}
              <div style={{ background: nameGrad(selectedBranch.name), padding: '20px 22px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {selectedBranch.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{selectedBranch.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 3 }}>
                        {selectedBranch.city} · Manager: {selectedBranch.mgr} · {selectedEmps.length} staff
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedLock.status === 'branch_locked' && (
                      <>
                        <button className="btn btn-on-gradient" onClick={() => exportBranch(selectedId!)}>📤 Export</button>
                        <button className="btn btn-danger" onClick={() => setShowReject(true)}>↩️ Send Back</button>
                        <button className="btn btn-success" onClick={() => setShowVerify(true)}>✅ Verify & Accept</button>
                      </>
                    )}
                    {selectedLock.status === 'finalized' && (
                      <button className="btn btn-on-gradient" onClick={() => exportBranch(selectedId!)}>📤 Export Report</button>
                    )}
                    {(selectedLock.status === 'unlocked' || selectedLock.status === 'rejected') && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', padding: '6px 10px' }}>
                        {selectedLock.status === 'rejected' ? '↩️ Sheet sent back — awaiting correction' : 'Branch HR has not submitted yet'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-body">
                {/* Status Banner */}
                {(() => {
                  const cfg = LOCK_STATUS_CFG[selectedLock.status as LockStatus];
                  let info = '';
                  if (selectedLock.status === 'branch_locked') info = `Locked by <strong>${selectedLock.lockedBy}</strong> at <strong>${selectedLock.lockedAt}</strong> · Awaiting Head HR verification`;
                  else if (selectedLock.status === 'finalized') info = `✅ Verified by <strong>${selectedLock.verifiedBy}</strong> at <strong>${selectedLock.verifiedAt}</strong> · Report saved`;
                  else if (selectedLock.status === 'rejected') info = `↩️ Sent back · Reason: <strong>${selectedLock.reason || '—'}</strong>`;
                  else info = 'Branch HR has not submitted the sheet yet';
                  return (
                    <div className="banner" style={{ background: cfg.bg, borderColor: cfg.border, marginBottom: 16 }}>
                      <div className="banner-left">
                        <div className="banner-ic" style={{ background: cfg.bg }}>{cfg.icon}</div>
                        <div>
                          <div className="banner-title" style={{ color: cfg.color }}>{cfg.label} — {selectedBranch.name}</div>
                          <div className="banner-sub" style={{ color: cfg.color }} dangerouslySetInnerHTML={{ __html: info }} />
                        </div>
                      </div>
                      <span className={`pill ${cfg.pillClass}`}>{cfg.label}</span>
                    </div>
                  );
                })()}

                {/* Mini Stats */}
                <div className="mini-stats" style={{ marginBottom: 16 }}>
                  <div className="ms-card"><div className="ms-val" style={{ color: 'var(--green)' }}>{detailStats.pres}</div><div className="ms-lbl">Present</div></div>
                  <div className="ms-card"><div className="ms-val" style={{ color: 'var(--amber)' }}>{detailStats.late}</div><div className="ms-lbl">Late</div></div>
                  <div className="ms-card"><div className="ms-val" style={{ color: 'var(--red)' }}>{detailStats.abs}</div><div className="ms-lbl">Absent</div></div>
                  <div className="ms-card"><div className="ms-val" style={{ color: 'var(--violet)' }}>{detailStats.olv}</div><div className="ms-lbl">On Leave</div></div>
                </div>

                {/* Employee Table */}
                <div className="card-header" style={{ background: '#fafbff', borderRadius: '10px 10px 0 0', border: '1px solid var(--border)', marginBottom: 0 }}>
                  <div className="card-title">👥 Attendance Records</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="fsrc" style={{ width: 200 }}>
                      <span>🔍</span>
                      <input type="text" placeholder="Search employee..." value={empSearch} onChange={e => setEmpSearch(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="tbl-wrap" style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Shift</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmps.length === 0 ? (
                        <tr><td colSpan={7} className="empty"><span className="empty-ic">🔍</span>No matching employees</td></tr>
                      ) : filteredEmps.map(e => (
                        <tr key={e.code}>
                          <td>
                            <div className="emp-cell">
                              <div className="av" style={{ background: nameGrad(e.name) }}>{getIni(e.name)}</div>
                              <div>
                                <div className="emp-name">{e.name}</div>
                                <div className="emp-code">{e.code}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 10, background: '#f3f4f6', padding: '2px 7px', borderRadius: 5, color: 'var(--t2)', fontWeight: 600 }}>{e.dept}</span>
                          </td>
                          <td>
                            <span className="pill" style={SHIFT_STYLE[e.shift] || {}}>{e.shift}</span>
                          </td>
                          <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{e.ci}</td>
                          <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{e.co}</td>
                          <td>
                            <span className="pill" style={STATUS_STYLE[e.status] || {}}>{e.status}</span>
                          </td>
                          <td style={{ fontSize: 10, color: 'var(--t3)' }}>{e.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showVerify && selectedBranch && (
        <VerifyModal
          branch={selectedBranch}
          emps={selectedEmps}
          onClose={() => setShowVerify(false)}
          onConfirm={handleVerify}
        />
      )}
      {showReject && selectedBranch && (
        <RejectModal
          branch={selectedBranch}
          onClose={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      )}
    </>
  );
}
