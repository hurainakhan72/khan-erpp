import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

interface LeaveRequest {
  id: string;
  empId: string;
  leaveType: string;
  type?: string;
  from?: string;
  to?: string;
  start_date?: string;
  end_date?: string;
  days?: number;
  status: string;
}

interface LeaveBalance {
  used: number;
  total: number;
}

interface LeaveBalances {
  Annual: LeaveBalance;
  Casual: LeaveBalance;
  Medical: LeaveBalance;
  Sick: LeaveBalance;
  [key: string]: LeaveBalance;
}

export default function LeaveWalletHistory(): React.ReactElement {
  const { leaveRequests, employees } = useData();
  const { user } = useAuth();
  
  // Get current logged-in employee ID
  const currentEmployeeId: string = user?.employeeId || user?.id || "EMP001";
  
  // Filter leave requests for current employee
  const [mine, setMine] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalances>({
    Annual: { used: 7, total: 12 },
    Casual: { used: 10, total: 12 },
    Medical: { used: 8, total: 8 },
    Sick: { used: 4, total: 10 },
  });

  useEffect((): void => {
    if (leaveRequests) {
      const userLeaves: LeaveRequest[] = leaveRequests.filter((row: LeaveRequest) => row.empId === currentEmployeeId);
      setMine(userLeaves);
      
      // Calculate actual balances from leave requests
      const approvedLeaves: LeaveRequest[] = userLeaves.filter((l: LeaveRequest) => l.status === "Approved");
      const newBalances: LeaveBalances = { ...leaveBalances };
      
      approvedLeaves.forEach((leave: LeaveRequest) => {
        const type: string = leave.leaveType || leave.type || "Annual";
        if (newBalances[type]) {
          newBalances[type].used = (newBalances[type].used || 0) + (leave.days || 1);
        }
      });
      
      setLeaveBalances(newBalances);
    }
  }, [leaveRequests, currentEmployeeId]);

  // Format date helper
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  // Balance cards data
  const balanceCards: Array<{
    label: string;
    used: number;
    total: number;
    color: string;
    bg: string;
  }> = [
    { label: "Annual", used: leaveBalances.Annual.used, total: leaveBalances.Annual.total, color: "#6366f1", bg: "#ede9fe" },
    { label: "Casual", used: leaveBalances.Casual.used, total: leaveBalances.Casual.total, color: "#f97316", bg: "#fef3c7" },
    { label: "Medical", used: leaveBalances.Medical.used, total: leaveBalances.Medical.total, color: "#10b981", bg: "#dcfce7" },
    { label: "Sick", used: leaveBalances.Sick.used, total: leaveBalances.Sick.total, color: "#ec4899", bg: "#fdf2f8" },
  ];

  // Get status style
  const getStatusStyle = (status: string): { bg: string; color: string } => {
    switch (status) {
      case "Approved":
        return { bg: "#dcfce7", color: "#166534" };
      case "Pending":
        return { bg: "#fef3c7", color: "#d97706" };
      case "Rejected":
        return { bg: "#fee2e2", color: "#dc2626" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  return (
    <div style={{ padding: "20px 24px", background: "#f0f2f8", minHeight: "100vh" }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>📋 Leave Wallet + History</h1>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Employee leave balances with request history.</p>
      </div>

      {/* Balance Cards Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: 14, 
        marginBottom: 20 
      }}>
        {balanceCards.map((card, i: number) => {
          const percentage: number = (card.used / card.total) * 100;
          const remaining: number = card.total - card.used;
          
          return (
            <div 
              key={i}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "18px 20px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 10px rgba(0,0,0,.05)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,.1)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 10px rgba(0,0,0,.05)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{card.label}</span>
                <span style={{ 
                  background: card.bg, 
                  color: card.color, 
                  padding: "2px 8px", 
                  borderRadius: 20, 
                  fontSize: 10, 
                  fontWeight: 700 
                }}>
                  {card.used} / {card.total}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1e1b4b", marginBottom: 8 }}>
                {remaining} <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>days left</span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ 
                  height: "100%", 
                  width: `${percentage}%`, 
                  background: card.color, 
                  borderRadius: 4,
                  transition: "width 0.5s ease"
                }} />
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
                {card.used} used of {card.total}
              </div>
            </div>
          );
        })}
      </div>

      {/* History Table */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 1px 10px rgba(0,0,0,.05)"
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", background: "#fafbff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>📜</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>Leave Request History</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{mine.length} requests</span>
          </div>
        </div>

        {mine.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No leave requests yet</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Your leave history will appear here</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafbff" }}>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#6b7280", fontSize: 11 }}>ID</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#6b7280", fontSize: 11 }}>Type</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#6b7280", fontSize: 11 }}>From</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#6b7280", fontSize: 11 }}>To</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#6b7280", fontSize: 11 }}>Days</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#6b7280", fontSize: 11 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((row: LeaveRequest, idx: number) => {
                  const statusStyle = getStatusStyle(row.status);
                  return (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderBottom: idx < mine.length - 1 ? "1px solid #f3f4f6" : "none",
                        transition: "background 0.12s"
                      }}
                      className="hover-row"
                      onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => {
                        e.currentTarget.style.background = "#f5f7ff";
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{row.id || `LV-${idx + 1}`}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#374151" }}>{row.leaveType || row.type || "Annual"}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{formatDate(row.from || row.start_date)}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{formatDate(row.to || row.end_date)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#374151" }}>{row.days || 1}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          background: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {row.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={(): void => {
            window.location.href = "/leave/request";
          }}
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            borderRadius: 40,
            padding: "10px 24px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(99,102,241,.4)",
            transition: "all 0.15s"
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(99,102,241,.5)";
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,.4)";
          }}
        >
          ✏️ Request New Leave
        </button>
      </div>

      {/* Global Styles */}
      <style>{`
        .hover-row {
          transition: background 0.12s;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}