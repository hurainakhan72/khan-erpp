import React, { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useData } from "../context/DataContext";

export default function HeadOfficeHR() {
  const { allAttendanceToday, attendanceLocks, setAttendanceLocks } = useData();
  const [selectedBranch, setSelectedBranch] = useState("Head Office");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const branches = useMemo(() => {
    const unique = Array.from(new Set(allAttendanceToday.map((row: any) => row.branch || "Head Office")));
    return unique.length ? unique : ["Head Office"];
  }, [allAttendanceToday]);

  const rows = useMemo(
    () => allAttendanceToday.filter((row: any) => (row.branch || "Head Office") === selectedBranch),
    [allAttendanceToday, selectedBranch]
  );

  const lockKey = `${selectedBranch}-${selectedDate}`;
  const lockState = attendanceLocks[lockKey] || { status: "unlocked", lockedBy: "", lockedAt: "" };
  const isBranchLocked = lockState.status === "branch_locked" || lockState.status === "locked";
  const isHeadLocked = lockState.status === "head_locked";
  const isFinalized = lockState.status === "finalized";

  const canApprove = isBranchLocked && !isHeadLocked && !isFinalized;
  const canReject = isBranchLocked && !isHeadLocked && !isFinalized;

  const approveSheet = () => {
    if (!canApprove) return;
    const now = new Date().toISOString();
    setAttendanceLocks((prev: any) => ({
      ...prev,
      [lockKey]: {
        status: "head_locked",
        lockedBy: "Head HR",
        lockedAt: now,
        branch: selectedBranch,
        date: selectedDate,
      },
    }));
  };

  const rejectSheet = () => {
    if (!canReject) return;
    setAttendanceLocks((prev: any) => ({
      ...prev,
      [lockKey]: {
        status: "unlocked",
        lockedBy: "",
        lockedAt: "",
        branch: selectedBranch,
        date: selectedDate,
      },
    }));
  };

  const breakdown = ["Present", "Late", "Absent", "On Leave"].map((status) => ({
    status,
    count: rows.filter((row: any) => row.status === status).length,
  }));

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Head Office HR Approval</div>
          <div className="pg-sub">Approve or reject branch-locked attendance sheets before final reporting.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn ${canApprove ? "btn-primary" : "btn-secondary"}`}
            onClick={approveSheet}
            disabled={!canApprove}
          >
            <ShieldCheck size={14} />
            {isFinalized ? "Finalized" : isHeadLocked ? "Approved" : "Approve for Final Report"}
          </button>
          <button
            className="btn btn-outline"
            onClick={rejectSheet}
            disabled={!canReject}
          >
            <CheckCircle2 size={14} />
            Reject back to Branch HR
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="form-label">Branch</label>
            <select
              className="select-input"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Attendance Date</label>
            <input
              className="input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="attendance-banner" style={{ marginBottom: 14, background: isFinalized ? "rgba(14,165,233,.12)" : isHeadLocked ? "rgba(59,130,246,.12)" : isBranchLocked ? "rgba(251,191,36,.12)" : "rgba(239,68,68,.12)", borderColor: isFinalized ? "rgba(14,165,233,.25)" : isHeadLocked ? "rgba(59,130,246,.25)" : isBranchLocked ? "rgba(251,191,36,.25)" : "rgba(239,68,68,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={14} />
          <span>
            Current stage for <b>{selectedBranch}</b> on <b>{selectedDate}</b> is <b>{lockState.status.replace(/_/g, " ")}</b>.
          </span>
        </div>
        <span className={`pill ${isFinalized ? "pill-blue" : isHeadLocked ? "pill-green" : isBranchLocked ? "pill-amber" : "pill-red"}`}>
          {isFinalized ? "FINALIZED" : isHeadLocked ? "HEAD APPROVED" : isBranchLocked ? "BRANCH LOCKED" : "OPEN"}
        </span>
      </div>

      <div className="attendance-summary-cards">
        {breakdown.map((item) => (
          <div key={item.status} className="summary-card summary-card-blue">
            <div className="summary-label">{item.status}</div>
            <div className="summary-value">{item.count}</div>
          </div>
        ))}
      </div>

      <div className="card attendance-table-card" style={{ marginTop: 14 }}>
        <div className="table-wrap" style={{ maxHeight: "unset" }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.empId}>
                  <td>{row.name}</td>
                  <td>{row.dept}</td>
                  <td>{row.shift}</td>
                  <td>{row.checkIn}</td>
                  <td><span className="pill pill-blue">{row.status}</span></td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--t3)" }}>
                    No attendance records available for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
