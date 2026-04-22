import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import api from "../api/axios";
import { Download, Search, AlertTriangle, Trash2, ShieldCheck, Filter, FileDown } from "lucide-react";
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

  const totalDeleted = issues.length;
  const resolvedDeleted = issues.filter((issue) => issue.status === "resolved").length;
  const rejectedDeleted = issues.filter((issue) => issue.status === "rejected").length;

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
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40 p-4 md:p-6">
      <div className="w-full space-y-6">
        <Card className="overflow-hidden border border-slate-200/70">
          <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="rejected">Deleted issue archive</Badge>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                    <ShieldCheck size={14} />
                    Soft-delete history
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Deleted Issues Archive</h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    View and analyze issues that have been deleted from the system.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Deleted</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{totalDeleted}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Resolved</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{resolvedDeleted}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rejected</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-600">{rejectedDeleted}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Archive</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">Live</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border border-slate-200/70 p-5 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Search</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Find deleted records quickly</p>
                <p className="mt-2 text-sm text-slate-500">Search by title or description before applying filters.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Search size={22} />
              </div>
            </div>
            <form onSubmit={handleSearch} className="mt-5 relative">
              <Input
                type="text"
                placeholder="Search title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search deleted issues by title or description"
                className="pl-11"
              />
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </form>
          </Card>

          <Card className="border border-slate-200/70 p-5">
            <p className="text-sm font-medium text-slate-500">Export</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">CSV snapshot</p>
            <button
              type="button"
              onClick={exportCSV}
              disabled={issues.length === 0}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown size={16} /> Export CSV
            </button>
          </Card>
        </div>

        <Card className="border border-slate-200/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">Narrow the archive by category and severity.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <Filter size={14} /> Archive filter
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              label="Category"
            >
              <option value="">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="water_leakage">Water Leakage</option>
              <option value="streetlight">Streetlight</option>
              <option value="road_damage">Road Damage</option>
              <option value="drainage">Drainage</option>
              <option value="other">Other</option>
            </Select>

            <Select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              label="Severity"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              onClick={handleSearch}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
            >
              <Search size={16} /> Apply Filters
            </button>
            <button
              type="button"
              onClick={exportCSV}
              disabled={issues.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilters({ category: "", severity: "" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </Card>

        <div className="text-sm text-slate-600" aria-live="polite">{issues.length} deleted issue{issues.length !== 1 ? "s" : ""} found</div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-slate-600">
            <div className="glass-strong flex items-center gap-3 rounded-2xl px-6 py-4" role="status" aria-live="polite">
              <Trash2 className="animate-pulse" size={18} />
              Loading deleted issues...
            </div>
          </div>
        ) : issues.length === 0 ? (
          <Card className="border border-slate-200/70 p-8 text-center text-slate-600">
            No deleted issues found
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200/70">
            <p className="border-b border-slate-200/70 px-6 py-3 text-xs text-slate-500">
              Tip: Swipe horizontally on smaller screens to view all archive columns.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-245">
                <caption className="sr-only">Deleted issues with category, severity, status, reporter, and deletion date.</caption>
                <thead className="bg-slate-50/90">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th scope="col" className="px-6 py-4">ID</th>
                    <th scope="col" className="px-6 py-4">Title</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Severity</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Reporter</th>
                    <th scope="col" className="px-6 py-4">Deleted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="transition-colors hover:bg-slate-50/80">
                      <th scope="row" className="px-6 py-4 text-left text-sm text-slate-700">#{issue.id}</th>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-slate-900 truncate max-w-xs">{issue.title}</div>
                        <div className="text-xs text-slate-600 truncate max-w-xs">{issue.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{CATEGORY_LABELS[issue.category] || issue.category}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {severityIcons[issue.severity]}
                          <span className="capitalize text-slate-700">{issue.severity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={issue.status} className="capitalize">
                          {issue.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{issue.reporter_name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(issue.deleted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
