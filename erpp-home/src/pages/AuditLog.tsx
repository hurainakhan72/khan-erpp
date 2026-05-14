import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getVisibleEmployees } from '../utils/utils';
import { getStatusColor } from '../services/api';
import { Download, Activity, Shield, Eye, AlertTriangle } from 'lucide-react';

const actionColors: Record<string, string> = { CREATE: 'pill-green', UPDATE: 'pill-blue', DELETE: 'pill-red', LOGIN: 'pill-steel', LOGOUT: 'pill-steel' };

export default function AuditLog() {
  const { auditLog, employees } = useData();
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'activity'>('audit');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Mock Activity Logs (backend has activity_logs table)
  const activityLogs = useMemo(() => [
    {
      id: 'AL001',
      timestamp: '2026-05-09 14:30:15',
      user: 'Super Admin',
      userId: 'SA001',
      activityType: 'login',
      severity: 'info',
      module: 'Authentication',
      description: 'User logged in successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/91.0',
      location: 'Islamabad, PK',
      metadata: { sessionId: 'sess_12345', loginMethod: 'password' }
    },
    {
      id: 'AL002',
      timestamp: '2026-05-09 14:25:10',
      user: 'HR Manager',
      userId: 'HR001',
      activityType: 'data_export',
      severity: 'warning',
      module: 'Payroll',
      description: 'Exported payroll data for March 2026',
      ipAddress: '192.168.1.101',
      userAgent: 'Firefox/89.0',
      location: 'Lahore, PK',
      metadata: { recordCount: 150, exportType: 'csv' }
    },
    {
      id: 'AL003',
      timestamp: '2026-05-09 14:20:05',
      user: 'Branch HR',
      userId: 'BHR001',
      activityType: 'bulk_update',
      severity: 'info',
      module: 'Attendance',
      description: 'Bulk updated attendance records for 25 employees',
      ipAddress: '192.168.1.102',
      userAgent: 'Edge/91.0',
      location: 'Karachi, PK',
      metadata: { affectedRecords: 25, operation: 'mark_present' }
    },
    {
      id: 'AL004',
      timestamp: '2026-05-09 14:15:00',
      user: 'Super Admin',
      userId: 'SA001',
      activityType: 'permission_change',
      severity: 'critical',
      module: 'User Management',
      description: 'Changed role permissions for Finance department',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/91.0',
      location: 'Islamabad, PK',
      metadata: { targetRole: 'finance_manager', permissions: ['read', 'write', 'approve'] }
    },
    {
      id: 'AL005',
      timestamp: '2026-05-09 14:10:30',
      user: 'Employee',
      userId: 'EMP001',
      activityType: 'profile_update',
      severity: 'info',
      module: 'Profile',
      description: 'Updated contact information',
      ipAddress: '192.168.1.103',
      userAgent: 'Safari/14.0',
      location: 'Rawalpindi, PK',
      metadata: { fieldsUpdated: ['phone', 'address'] }
    }
  ], []);

  const visibleEmployees = useMemo(() => getVisibleEmployees(user, activeRole, employees), [user, activeRole, employees]);
  const visibleEmpIds = useMemo(() => new Set(visibleEmployees.map(e => e.id)), [visibleEmployees]);

  const filteredAuditLogs = auditLog.filter((log: any) => {
    // Filter by visible employees if module is Employee
    if (log.module === 'Employee' && log.recordId && !visibleEmpIds.has(log.recordId)) return false;
    if (userFilter && log.user !== userFilter) return false;
    if (actionFilter && log.action !== actionFilter) return false;
    if (moduleFilter && log.module !== moduleFilter) return false;
    if (dateFrom && log.timestamp < dateFrom) return false;
    if (dateTo && log.timestamp > dateTo + ' 23:59:59') return false;
    return true;
  });

  const filteredActivityLogs = activityLogs.filter((log: any) => {
    if (userFilter && log.user !== userFilter) return false;
    if (activityTypeFilter && log.activityType !== activityTypeFilter) return false;
    if (severityFilter && log.severity !== severityFilter) return false;
    if (moduleFilter && log.module !== moduleFilter) return false;
    if (dateFrom && log.timestamp.split(' ')[0] < dateFrom) return false;
    if (dateTo && log.timestamp.split(' ')[0] > dateTo) return false;
    return true;
  });

  const users = [...new Set([...auditLog.map((l: any) => l.user), ...activityLogs.map((l: any) => l.user)])];
  const modules = [...new Set([...auditLog.map((l: any) => l.module), ...activityLogs.map((l: any) => l.module)])];
  const activityTypes = [...new Set(activityLogs.map((l: any) => l.activityType))];

  const exportCSV = (data: any[], filename: string) => {
    const csv = 'Timestamp,User,Role,Action,Module,Record,Summary\n' +
      data.map((l: any) => `"${l.timestamp}","${l.user}","${l.role || ''}","${l.action || l.activityType}","${l.module}","${l.recordId || ''}","${l.summary || l.description}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Audit & Activity Logs</div>
          <div className="pg-sub">Comprehensive system activity tracking and audit trails</div>
        </div>
        <button className="btn btn-primary" onClick={() => exportCSV(activeTab === 'audit' ? filteredAuditLogs : filteredActivityLogs, `${activeTab}_logs.csv`)}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Shield size={14} style={{ marginRight: 6 }} />
          Audit Logs
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={14} style={{ marginRight: 6 }} />
          Activity Logs
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="input" type="date" style={{ width: 150 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
          <input className="input" type="date" style={{ width: 150 }} value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
          <select className="input select-input" style={{ width: 140 }} value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="">All Users</option>{users.map(u => <option key={u}>{u}</option>)}
          </select>

          {activeTab === 'audit' ? (
            <>
              <select className="input select-input" style={{ width: 140 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                <option value="">All Actions</option>{['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'].map(a => <option key={a}>{a}</option>)}
              </select>
            </>
          ) : (
            <>
              <select className="input select-input" style={{ width: 140 }} value={activityTypeFilter} onChange={e => setActivityTypeFilter(e.target.value)}>
                <option value="">All Activity Types</option>{activityTypes.map(a => <option key={a}>{a}</option>)}
              </select>
              <select className="input select-input" style={{ width: 140 }} value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                <option value="">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </>
          )}

          <select className="input select-input" style={{ width: 140 }} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>{modules.map(m => <option key={m}>{m}</option>)}
          </select>

          {(userFilter || actionFilter || activityTypeFilter || severityFilter || moduleFilter || dateFrom || dateTo) && (
            <button className="btn btn-sm btn-ghost" onClick={() => {
              setUserFilter('');
              setActionFilter('');
              setActivityTypeFilter('');
              setSeverityFilter('');
              setModuleFilter('');
              setDateFrom('');
              setDateTo('');
            }}>Clear Filters</button>
          )}
        </div>
      </div>

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="ch">
            <div className="ct">
              <div className="ct-ico blue">
                <Shield size={13} />
              </div>
              System Audit Trail
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>
              {filteredAuditLogs.length} audit entries
            </div>
          </div>

          {filteredAuditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)', fontSize: 13 }}>
              No audit log entries match your filters
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Record</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="mono" style={{ fontSize: 11 }}>{log.timestamp}</td>
                      <td style={{ fontWeight: 600 }}>{log.user}</td>
                      <td><span className="pill pill-blue">{log.role}</span></td>
                      <td><span className={`pill ${actionColors[log.action] || 'pill-steel'}`}>{log.action}</span></td>
                      <td>{log.module}</td>
                      <td className="mono">{log.recordId}</td>
                      <td>{log.summary}</td>
                    </tr>
                    {expanded === log.id && log.before && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--inp)', padding: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12 }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--t3)', marginBottom: 4 }}>BEFORE</div>
                              {Object.entries(log.before).map(([k, v]) => (
                                <div key={k}>{k}: <span className="mono">{String(v)}</span></div>
                              ))}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--t3)', marginBottom: 4 }}>AFTER</div>
                              {log.after && Object.entries(log.after).map(([k, v]) => (
                                <div key={k} style={{ background: 'var(--amberl)', padding: '2px 4px', borderRadius: 3 }}>
                                  {k}: <span className="mono">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="card">
          <div className="ch">
            <div className="ct">
              <div className="ct-ico green">
                <Activity size={13} />
              </div>
              User Activity Monitoring
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>
              {filteredActivityLogs.length} activity entries
            </div>
          </div>

          {filteredActivityLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)', fontSize: 13 }}>
              No activity log entries match your filters
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Activity Type</th>
                  <th>Severity</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivityLogs.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      <td className="mono" style={{ fontSize: 11 }}>{log.timestamp}</td>
                      <td style={{ fontWeight: 600 }}>{log.user}</td>
                      <td>
                        <span className={`pill ${
                          log.activityType === 'login' ? 'pill-green' :
                          log.activityType === 'data_export' ? 'pill-blue' :
                          log.activityType === 'bulk_update' ? 'pill-orange' :
                          log.activityType === 'permission_change' ? 'pill-red' :
                          'pill-steel'
                        }`}>
                          {log.activityType.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`pill ${
                          log.severity === 'info' ? 'pill-steel' :
                          log.severity === 'warning' ? 'pill-orange' :
                          log.severity === 'critical' ? 'pill-red' :
                          'pill-steel'
                        }`}>
                          {log.severity.toUpperCase()}
                        </span>
                      </td>
                      <td>{log.module}</td>
                      <td>{log.description}</td>
                      <td className="mono" style={{ fontSize: 11 }}>{log.location}</td>
                      <td>
                        <button className="ico-btn" title="View Details">
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr>
                        <td colSpan={8} style={{ background: 'var(--inp)', padding: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12 }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--t3)', marginBottom: 8 }}>
                                <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Activity Details
                              </div>
                              <div>IP Address: <span className="mono">{log.ipAddress}</span></div>
                              <div>User Agent: <span className="mono">{log.userAgent}</span></div>
                              <div>Session ID: <span className="mono">{log.metadata?.sessionId || 'N/A'}</span></div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--t3)', marginBottom: 8 }}>
                                Metadata
                              </div>
                              {log.metadata && Object.entries(log.metadata).map(([k, v]) => (
                                <div key={k} style={{ background: 'var(--card-bg)', padding: '4px 8px', borderRadius: 4, marginBottom: 4 }}>
                                  {k}: <span className="mono">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}











