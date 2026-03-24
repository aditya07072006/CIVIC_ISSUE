import { useEffect, useState, useCallback } from "react";
import { Download, Search, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const CATEGORY_LABELS = {
  pothole: "Pothole",
  garbage: "Garbage",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  road_damage: "Road Damage",
  drainage: "Drainage",
  other: "Other",
};

function formatDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function trimForCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [satisfaction, setSatisfaction] = useState("");

  const totalFeedback = rows.length;
  const satisfiedCount = rows.filter((r) => r.is_satisfied).length;
  const unsatisfiedCount = totalFeedback - satisfiedCount;
  const satisfactionRate = totalFeedback ? Math.round((satisfiedCount / totalFeedback) * 100) : 0;
  const ratedRows = rows.filter((r) => r.rating);
  const averageRating = ratedRows.length
    ? (ratedRows.reduce((sum, r) => sum + Number(r.rating), 0) / ratedRows.length).toFixed(1)
    : "-";

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (satisfaction) params.is_satisfied = satisfaction;
      const res = await api.get("/issues/feedback/all", { params });
      setRows(res.data);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [search, status, satisfaction]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const exportCsv = () => {
    const headers = [
      "Feedback ID",
      "Issue ID",
      "Issue Title",
      "Category",
      "Severity",
      "Issue Status",
      "Citizen Name",
      "Citizen Email",
      "Satisfied",
      "Rating",
      "Comment",
      "Submitted On",
    ];

    const csvRows = rows.map((r) => [
      r.feedback_id,
      r.issue_id,
      trimForCsv(r.issue_title),
      CATEGORY_LABELS[r.category] || r.category,
      r.severity,
      r.status,
      trimForCsv(r.citizen_name),
      trimForCsv(r.citizen_email),
      r.is_satisfied ? "Yes" : "No",
      r.rating ?? "",
      trimForCsv(r.comment || ""),
      formatDate(r.feedback_at),
    ]);

    const csv = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Feedback CSV exported");
  };

  return (
    <div className="animated-bg min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Citizen Feedback</h1>
          <p className="text-slate-600">Review how citizens rated issue resolution quality.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-strong rounded-2xl p-4 border border-blue-700/20">
            <p className="text-xs text-slate-600 mb-1">Total Feedback</p>
            <p className="text-2xl font-bold text-blue-700">{totalFeedback}</p>
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-emerald-500/25">
            <p className="text-xs text-slate-600 mb-1">Satisfaction Rate</p>
            <p className="text-2xl font-bold text-emerald-600">{satisfactionRate}%</p>
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-amber-500/25">
            <p className="text-xs text-slate-600 mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-amber-600">{averageRating}</p>
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-red-500/25">
            <p className="text-xs text-slate-600 mb-1">Not Satisfied</p>
            <p className="text-2xl font-bold text-red-600">{unsatisfiedCount}</p>
          </div>
        </div>

        <div className="glass-strong border border-slate-300/80 rounded-2xl p-6 mb-6 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by issue, citizen, email or comment"
                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-700/25"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/25"
            >
              <option value="">All Issue Status</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={satisfaction}
              onChange={(e) => setSatisfaction(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/25"
            >
              <option value="">All Feedback</option>
              <option value="true">Satisfied</option>
              <option value="false">Not Satisfied</option>
            </select>
          </div>

          <div className="flex gap-3 flex-wrap mt-4">
            <button
              type="button"
              onClick={fetchFeedback}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700/10 border border-blue-700/30 text-blue-700 rounded-xl hover:bg-blue-700/15 transition-all duration-200"
            >
              <Search size={16} /> Apply Filters
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/35 text-emerald-700 rounded-xl hover:bg-emerald-500/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="text-slate-600 text-sm mb-4">{rows.length} feedback entries found</div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading feedback...</div>
        ) : rows.length === 0 ? (
          <div className="glass-strong border border-slate-300/80 rounded-2xl p-8 text-center text-slate-600">
            No feedback found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-300/80 bg-white/95 backdrop-blur-xl">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(15,61,145,0.18)", background: "rgba(241,245,249,0.9)" }}>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Issue</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Citizen</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Satisfaction</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Rating</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Comment</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.feedback_id}
                    style={{
                      borderBottom: idx < rows.length - 1 ? "1px solid rgba(15,61,145,0.12)" : "none",
                      background: idx % 2 === 0 ? "transparent" : "rgba(241,245,249,0.6)",
                    }}
                  >
                    <td className="px-5 py-4 text-sm text-slate-800">
                      <p className="font-medium">#{r.issue_id} {r.issue_title}</p>
                      <p className="text-xs text-slate-600">{CATEGORY_LABELS[r.category] || r.category} • {r.severity}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <p>{r.citizen_name}</p>
                      <p className="text-xs text-slate-600">{r.citizen_email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 capitalize">{r.status.replace("_", " ")}</td>
                    <td className="px-5 py-4 text-sm">
                      {r.is_satisfied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><ThumbsUp size={14} /> Satisfied</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600"><ThumbsDown size={14} /> Not Satisfied</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-amber-700">{r.rating ? `${r.rating}/5` : "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <div className="max-w-sm truncate" title={r.comment || ""}>
                        {r.comment || <span className="text-slate-500">No comment</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(r.feedback_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-slate-600 flex items-center gap-2">
          <MessageSquare size={14} /> Admin feedback monitor helps identify poor resolution quality quickly.
        </div>
      </div>
    </div>
  );
}
