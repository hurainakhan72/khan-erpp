import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useData } from "../context/DataContext";

type PenaltyCaseStatus = "branch_pending" | "ho_pending" | "approved" | "rejected" | "employee_acknowledged";

type PenaltyCase = {
  id: string;
  empName: string;
  branch: string;
  amount: number;
  type: string;
  workflowStatus: PenaltyCaseStatus;
};

export default function PenaltyWorkflow() {
  const { penalties, setPenalties } = useData();
  const cases: PenaltyCase[] = penalties
    .filter((penalty) => penalty.workflowStatus)
    .map((penalty: any) => ({
      id: penalty.id,
      empName: penalty.empName,
      branch: penalty.branch || 'Head Office',
      amount: penalty.amount,
      type: penalty.type,
      workflowStatus: penalty.workflowStatus,
    }));

  const move = (id: string, to: PenaltyCaseStatus) => {
    setPenalties((prev) =>
      prev.map((row: any) =>
        row.id === id ? { ...row, workflowStatus: to } : row
      )
    );
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Approval Workflow</div>
          <div className="pg-sub">Branch review → HO approval → Employee acknowledgment workflow.</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Employee</th><th>Branch</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td>{row.empName}</td>
                <td>{row.branch}</td>
                <td className="mono">PKR {row.amount.toLocaleString()}</td>
                <td>{row.type}</td>
                <td>
                  <span className={`pill ${row.workflowStatus === "approved" ? "pill-green" : row.workflowStatus === "rejected" ? "pill-red" : row.workflowStatus === "employee_acknowledged" ? "pill-blue" : "pill-amber"}`}>
                    {row.workflowStatus.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: 'wrap' }}>
                    {row.workflowStatus === "branch_pending" && (
                      <button className="btn btn-sm btn-secondary" onClick={() => move(row.id, "ho_pending")}>
                        Send to HO
                      </button>
                    )}
                    {row.workflowStatus === "ho_pending" && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => move(row.id, "approved")}>
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => move(row.id, "rejected")}>
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {row.workflowStatus === "approved" && (
                      <button className="btn btn-sm btn-info" onClick={() => move(row.id, "employee_acknowledged")}>
                        Mark Acknowledged
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
