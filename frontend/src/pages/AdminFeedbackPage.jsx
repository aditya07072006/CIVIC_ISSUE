import { useEffect, useState, useCallback } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import {
  Download,
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  ShieldCheck,
  BarChart3,
  Filter,
} from "lucide-react";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [satisfaction, setSatisfaction] = useState("");

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setSatisfaction("");
  };

  const totalFeedback = rows.length;
  const satisfiedCount = rows.filter((r) => r.is_satisfied).length;
  const unsatisfiedCount = totalFeedback - satisfiedCount;
  const satisfactionRate = totalFeedback ? Math.round((satisfiedCount / totalFeedback) * 100) : 0;
  const ratedRows = rows.filter((r) => r.rating);
  const averageRating = ratedRows.length
    ? (ratedRows.reduce((sum, r) => sum + Number(r.rating), 0) / ratedRows.length).toFixed(1)
    : "-";

  const statusCounts = rows.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    },
    { resolved: 0, rejected: 0 },
  );

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (satisfaction) params.is_satisfied = satisfaction;
      const res = await api.get("/issues/feedback/all", { params });
      setRows(res.data);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to load feedback";
      setErrorMessage(message);
      toast.error(message);
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
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40 p-4 md:p-6">
      <div className="w-full space-y-6">
        <Card className="overflow-hidden border border-slate-200/70">
          <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="resolved">Admin feedback monitor</Badge>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                    <ShieldCheck size={14} /> Resolution quality tracking
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    Citizen Feedback
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    Review how citizens rated issue resolution quality and spot recurring service gaps quickly.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-4xl">
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{totalFeedback}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Satisfied</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{satisfiedCount}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Unsatisfied</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-600">{unsatisfiedCount}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{satisfactionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border border-slate-200/70 p-5 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Search</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Find feedback by issue or citizen</p>
                <p className="mt-2 text-sm text-slate-500">Search issue titles, names, emails, or comments.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Search size={22} />
              </div>
            </div>
            <div className="relative mt-5">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by issue, citizen, email or comment"
                aria-label="Search feedback by issue, citizen, email or comment"
                className="pl-11"
              />
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </Card>

          <Card className="border border-slate-200/70 p-5">
            <p className="text-sm font-medium text-slate-500">Action</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Controls</p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={fetchFeedback}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
              >
                <RefreshCcw size={16} /> Apply Filters
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={rows.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </Card>

          <Card className="border border-slate-200/70 p-5">
            <p className="text-sm font-medium text-slate-500">Refresh</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Update view</p>
            <button
              type="button"
              onClick={fetchFeedback}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </Card>
        </div>

        <Card className="border border-slate-200/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">Filter the feedback stream by issue status and satisfaction.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <Filter size={14} /> Refine results
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Issue status">
              <option value="">All Issue Status</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </Select>

            <Select value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)} label="Feedback sentiment">
              <option value="">All Feedback</option>
              <option value="true">Satisfied</option>
              <option value="false">Not Satisfied</option>
            </Select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                clearFilters();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RefreshCcw size={16} /> Clear Filters
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border border-slate-200/70 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Resolved</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{statusCounts.resolved}</p>
          </Card>
          <Card className="border border-slate-200/70 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rejected</p>
            <p className="mt-2 text-3xl font-semibold text-rose-600">{statusCounts.rejected}</p>
          </Card>
          <Card className="border border-slate-200/70 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Average rating</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{averageRating}</p>
          </Card>
        </div>

        <div className="text-sm text-slate-600" aria-live="polite">{rows.length} feedback entries found</div>

        {!loading && errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-slate-600">
            <div className="glass-strong flex items-center gap-3 rounded-2xl px-6 py-4" role="status" aria-live="polite">
              <MessageSquare className="animate-pulse" size={18} />
              Loading feedback...
            </div>
          </div>
        ) : rows.length === 0 ? (
          <Card className="border border-slate-200/70 p-8 text-center text-slate-600">
            No feedback found for the selected filters. Try clearing filters or broadening your search.
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200/70">
            <p className="border-b border-slate-200/70 px-6 py-3 text-xs text-slate-500">
              Tip: Swipe horizontally on smaller screens to view all feedback columns.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-245">
                <caption className="sr-only">Citizen feedback entries with issue details, sentiment, rating, and submission date.</caption>
                <thead className="bg-slate-50/90">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th scope="col" className="px-5 py-4">Issue</th>
                    <th scope="col" className="px-5 py-4">Citizen</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4">Satisfaction</th>
                    <th scope="col" className="px-5 py-4">Rating</th>
                    <th scope="col" className="px-5 py-4">Comment</th>
                    <th scope="col" className="px-5 py-4">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((r) => (
                    <tr key={r.feedback_id} className="transition-colors hover:bg-slate-50/80">
                      <th scope="row" className="px-5 py-4 text-left text-sm text-slate-800">
                        <p className="font-medium">#{r.issue_id} {r.issue_title}</p>
                        <p className="text-xs text-slate-600">{CATEGORY_LABELS[r.category] || r.category} • {r.severity}</p>
                      </th>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <p>{r.citizen_name}</p>
                        <p className="text-xs text-slate-600">{r.citizen_email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 capitalize">{r.status.replace("_", " ")}</td>
                      <td className="px-5 py-4 text-sm">
                        {r.is_satisfied ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                            <ThumbsUp size={14} /> Satisfied
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                            <ThumbsDown size={14} /> Not Satisfied
                          </span>
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
          </Card>
        )}

        <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
          <BarChart3 size={14} /> Admin feedback monitor helps identify poor resolution quality quickly.
        </div>
      </div>
    </div>
  );
}
