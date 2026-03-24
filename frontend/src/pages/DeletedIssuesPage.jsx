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
    <div className="animated-bg min-h-screen p-4 md:p-8">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Deleted Issues Archive
          </h1>
          <p className="text-slate-600">
            View and analyze issues that have been deleted from the system
          </p>
        </div>

        {/* ── Filters & Search ── */}
        <div className="glass-strong border border-slate-300/80 rounded-2xl p-6 mb-6 backdrop-blur-xl">
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
                  className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-700/25"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/25"
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
                className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/25"
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-700/10 border border-blue-700/30 text-blue-700 rounded-xl hover:bg-blue-700/15 transition-all duration-200"
              >
                <Search size={16} />
                Apply Filters
              </button>
              <button
                type="button"
                onClick={exportCSV}
                disabled={issues.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/35 text-emerald-700 rounded-xl hover:bg-emerald-500/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </form>
        </div>

        {/* ── Results Count ── */}
        <div className="text-slate-600 text-sm mb-4">
          {issues.length} deleted issue{issues.length !== 1 ? "s" : ""} found
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-3 border-slate-300 border-t-blue-700 rounded-full" />
            </div>
            <p className="text-slate-600 mt-2">Loading deleted issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div
            className="glass-strong border border-slate-300/80 rounded-2xl p-8 text-center"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <p className="text-slate-600">No deleted issues found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-300/80 bg-white/95 backdrop-blur-xl">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(15, 61, 145, 0.18)",
                    background: "rgba(241, 245, 249, 0.9)",
                  }}
                >
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Reporter
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
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
                          ? "1px solid rgba(15, 61, 145, 0.12)"
                          : "none",
                      background:
                        idx % 2 === 0
                          ? "transparent"
                          : "rgba(241, 245, 249, 0.6)",
                    }}
                  >
                    <td className="px-6 py-4 text-sm text-slate-700">
                      #{issue.id}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-slate-800 truncate max-w-xs">
                        {issue.title}
                      </div>
                      <div className="text-xs text-slate-600 truncate max-w-xs">
                        {issue.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {CATEGORY_LABELS[issue.category] || issue.category}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {severityIcons[issue.severity]}
                        <span className="capitalize text-slate-700">
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
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {issue.reporter_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
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
