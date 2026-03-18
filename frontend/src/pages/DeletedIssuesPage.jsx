import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { Download, Search, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORY_LABELS = {
  pothole: "Pothole",
  garbage: "Garbage",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  road_damage: "Road Damage",
  drainage: "Drainage",
  other: "Other",
};

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  resolved: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

const severityIcons = {
  low: <AlertTriangle size={16} className="text-blue-400" />,
  medium: <AlertTriangle size={16} className="text-yellow-400" />,
  high: <AlertTriangle size={16} className="text-orange-400" />,
  critical: <AlertTriangle size={16} className="text-red-400" />,
};

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DeletedIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", severity: "" });

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      const res = await api.get("/issues/deleted/list", { params });
      setIssues(res.data);
    } catch {
      toast.error("Failed to load deleted issues");
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeleted();
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Description",
      "Category",
      "Severity",
      "Status",
      "Reporter",
      "Created",
      "Deleted",
    ];

    const rows = issues.map((i) => [
      i.id,
      `"${(i.title || "").replace(/"/g, '""')}"`,
      `"${(i.description || "").replace(/"/g, '""')}"`,
      CATEGORY_LABELS[i.category] || i.category,
      i.severity,
      i.status,
      i.reporter_name || "—",
      formatDate(i.created_at),
      formatDate(i.deleted_at),
    ]);

    const csv =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deleted-issues-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "#050b14" }}>
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Deleted Issues Archive
          </h1>
          <p className="text-slate-400">
            View and analyze issues that have been deleted from the system
          </p>
        </div>

        {/* ── Filters & Search ── */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 mb-6 backdrop-blur-xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">All Categories</option>
                <option value="pothole">Pothole</option>
                <option value="garbage">Garbage</option>
                <option value="water_leakage">Water Leakage</option>
                <option value="streetlight">Streetlight</option>
                <option value="road_damage">Road Damage</option>
                <option value="drainage">Drainage</option>
                <option value="other">Other</option>
              </select>

              {/* Severity Filter */}
              <select
                value={filters.severity}
                onChange={(e) =>
                  setFilters({ ...filters, severity: e.target.value })
                }
                className="bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-xl hover:bg-cyan-500/30 transition-all duration-200"
              >
                <Search size={16} />
                Apply Filters
              </button>
              <button
                type="button"
                onClick={exportCSV}
                disabled={issues.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </form>
        </div>

        {/* ── Results Count ── */}
        <div className="text-slate-400 text-sm mb-4">
          {issues.length} deleted issue{issues.length !== 1 ? "s" : ""} found
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-3 border-slate-600 border-t-cyan-500 rounded-full" />
            </div>
            <p className="text-slate-400 mt-2">Loading deleted issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div
            className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 text-center"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <p className="text-slate-400">No deleted issues found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-700/50 backdrop-blur-xl">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(100, 116, 139, 0.3)",
                    background: "rgba(51, 65, 85, 0.5)",
                  }}
                >
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Reporter
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Deleted
                  </th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, idx) => (
                  <tr
                    key={issue.id}
                    style={{
                      borderBottom:
                        idx < issues.length - 1
                          ? "1px solid rgba(100, 116, 139, 0.2)"
                          : "none",
                      background:
                        idx % 2 === 0
                          ? "transparent"
                          : "rgba(30, 41, 59, 0.2)",
                    }}
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">
                      #{issue.id}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-white truncate max-w-xs">
                        {issue.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {issue.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {CATEGORY_LABELS[issue.category] || issue.category}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {severityIcons[issue.severity]}
                        <span className="capitalize text-slate-300">
                          {issue.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${
                          statusColors[issue.status] || "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {issue.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {issue.reporter_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(issue.deleted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
