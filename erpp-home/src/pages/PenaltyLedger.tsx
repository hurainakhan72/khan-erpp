import React from "react";
import { useData } from "../context/DataContext";

export default function PenaltyLedger() {
  const { penalties } = useData();

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Penalty Ledger</div>
          <div className="pg-sub">Track applied penalties, reversals and totals.</div>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {penalties.map((row: any) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td>{row.empName}</td>
                <td>{row.type}</td>
                <td className="mono">PKR {row.amount.toLocaleString()}</td>
                <td className="mono">{row.date}</td>
                <td><span className="pill pill-red">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
