import React, { useMemo } from "react";
import { useData } from "../context/DataContext";

export default function AttendanceVerification() {
  const { allAttendanceToday, setAllAttendanceToday } = useData();

  const toggleAck = (empId: string) => {
    setAllAttendanceToday((prev) =>
      prev.map((row: any) =>
        row.empId === empId
          ? {
              ...row,
              state: row.state === 'acknowledged' ? 'submitted' : 'acknowledged',
              acknowledgedAt: row.state === 'acknowledged' ? null : new Date().toISOString(),
            }
          : row
      )
    );
  };

  const summary = useMemo(() => {
    const total = allAttendanceToday.length;
    const acknowledgedCount = allAttendanceToday.filter((row: any) => row.state === 'acknowledged').length;
    return {
      total,
      acknowledged: acknowledgedCount,
      pending: total - acknowledgedCount,
    };
  }, [allAttendanceToday]);

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Employee Verification & Attendance Acknowledge</div>
          <div className="pg-sub">Verify daily records, acknowledge exceptions and keep HR workflow aligned.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pill pill-green">Acknowledged {summary.acknowledged}</div>
          <div className="pill pill-amber">Pending {summary.pending}</div>
          <div className="pill pill-blue">Total {summary.total}</div>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Attendance State</th>
              <th>Acknowledge</th>
            </tr>
          </thead>
          <tbody>
            {allAttendanceToday.map((row: any) => (
              <tr key={row.empId}>
                <td className="mono">{row.empId}</td>
                <td>{row.name}</td>
                <td>{row.branch || 'Head Office'}</td>
                <td><span className="pill pill-blue">{row.status}</span></td>
                <td>
                  <span className={`pill ${row.state === 'acknowledged' ? 'pill-green' : 'pill-amber'}`}>
                    {row.state === 'acknowledged' ? 'Acknowledged' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${row.state === 'acknowledged' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleAck(row.empId)}
                  >
                    {row.state === 'acknowledged' ? 'Mark Pending' : 'Acknowledge'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
