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
    <div className="min-h-screen p-4 md:p-8" style={{ background: "#050b14" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Citizen Feedback</h1>
          <p className="text-slate-400">Review how citizens rated issue resolution quality.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl p-4 border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-xs text-cyan-200/80 mb-1">Total Feedback</p>
            <p className="text-2xl font-bold text-cyan-200">{totalFeedback}</p>
          </div>
          <div className="rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-xs text-emerald-200/80 mb-1">Satisfaction Rate</p>
            <p className="text-2xl font-bold text-emerald-200">{satisfactionRate}%</p>
          </div>
          <div className="rounded-2xl p-4 border border-amber-500/30 bg-amber-500/10">
            <p className="text-xs text-amber-200/80 mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-amber-200">{averageRating}</p>
          </div>
          <div className="rounded-2xl p-4 border border-red-500/30 bg-red-500/10">
            <p className="text-xs text-red-200/80 mb-1">Not Satisfied</p>
            <p className="text-2xl font-bold text-red-200">{unsatisfiedCount}</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 mb-6 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by issue, citizen, email or comment"
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Issue Status</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={satisfaction}
              onChange={(e) => setSatisfaction(e.target.value)}
              className="bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-xl hover:bg-cyan-500/30 transition-all duration-200"
            >
              <Search size={16} /> Apply Filters
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="text-slate-400 text-sm mb-4">{rows.length} feedback entries found</div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading feedback...</div>
        ) : rows.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400">
            No feedback found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-700/50 backdrop-blur-xl">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(100,116,139,0.3)", background: "rgba(51,65,85,0.5)" }}>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Issue</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Citizen</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Satisfaction</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Rating</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Comment</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-slate-300">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.feedback_id}
                    style={{
                      borderBottom: idx < rows.length - 1 ? "1px solid rgba(100,116,139,0.2)" : "none",
                      background: idx % 2 === 0 ? "transparent" : "rgba(30,41,59,0.2)",
                    }}
                  >
                    <td className="px-5 py-4 text-sm text-slate-200">
                      <p className="font-medium">#{r.issue_id} {r.issue_title}</p>
                      <p className="text-xs text-slate-500">{CATEGORY_LABELS[r.category] || r.category} • {r.severity}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      <p>{r.citizen_name}</p>
                      <p className="text-xs text-slate-500">{r.citizen_email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300 capitalize">{r.status.replace("_", " ")}</td>
                    <td className="px-5 py-4 text-sm">
                      {r.is_satisfied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300"><ThumbsUp size={14} /> Satisfied</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-300"><ThumbsDown size={14} /> Not Satisfied</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-amber-300">{r.rating ? `${r.rating}/5` : "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      <div className="max-w-sm truncate" title={r.comment || ""}>
                        {r.comment || <span className="text-slate-500">No comment</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{formatDate(r.feedback_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-slate-500 flex items-center gap-2">
          <MessageSquare size={14} /> Admin feedback monitor helps identify poor resolution quality quickly.
        </div>
      </div>
    </div>
  );
}
