import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { IssueMap } from "../components/map/IssueMap";
import { Input, Select } from "../components/ui/Input";
import api from "../api/axios";
import {
  Search,
  Map,
  List,
  Loader,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileDown,
  Filter,
  ShieldCheck,
  Layers3,
  ArrowUpRight,
  BarChart3,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORY_LABELS = {
  pothole: "Pothole",
  garbage: "Garbage Overflow",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  road_damage: "Road Damage",
  drainage: "Drainage",
  other: "Other",
};

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AllIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", severity: "", status: "" });
  const [activeTab, setActiveTab] = useState("table");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [mapIssues, setMapIssues] = useState([]);
  const [updateStatusModal, setUpdateStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [issueDetail, setIssueDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleClearFilters = () => {
    setSearch("");
    setFilters({ category: "", severity: "", status: "" });
  };

  const summary = useMemo(() => {
    const counts = issues.reduce(
      (acc, issue) => {
        acc.total += 1;
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        acc.byCategory[issue.category] = (acc.byCategory[issue.category] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0, byCategory: {} },
    );

    counts.active = counts.pending + counts.in_progress;
    counts.resolutionRate = counts.total ? Math.round((counts.resolved / counts.total) * 100) : 0;
    return counts;
  }, [issues]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      const [issuesRes, mapRes] = await Promise.all([
        api.get("/issues", { params }),
        api.get("/issues/map/all"),
      ]);
      setIssues(issuesRes.data);
      setMapIssues(mapRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    fetchAll();
  }, [filters, fetchAll]);

  const handleSearch = () => fetchAll();

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      await api.patch(`/issues/${selectedIssue.id}/status`, {
        status: newStatus,
      });
      toast.success("Status updated successfully");
      setUpdateStatusModal(false);
      setSelectedIssue(null);
      setNewStatus("");
      fetchAll();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteIssue = async (issue) => {
    const confirmed = window.confirm(
      `Delete issue #${issue.id}? This will move it to the deleted archive.`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/issues/${issue.id}`);
      toast.success("Issue deleted successfully");
      if (selectedIssue?.id === issue.id) {
        setSelectedIssue(null);
        setUpdateStatusModal(false);
        setNewStatus("");
      }
      fetchAll();
    } catch (err) {
      const message = err.response?.data?.error || "Failed to delete issue";
      toast.error(message);
    }
  };

  const openIssueDetails = async (issueId) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await api.get(`/issues/${issueId}`);
      setIssueDetail(res.data);
    } catch {
      toast.error("Failed to load issue details");
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const getIssueImageUrl = (image) => {
    if (!image) return null;
    return image.startsWith("http") ? image : `/uploads/${image}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "in_progress":
        return <Loader size={16} className="text-blue-500" />;
      case "resolved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "rejected":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Title", "Category", "Severity", "Status", "Reporter", "Date"];
    const rows = issues.map((i) => [
      i.id,
      `"${(i.title || "").replace(/"/g, '""')}"`,
      CATEGORY_LABELS[i.category] || i.category,
      i.severity,
      i.status,
      i.reporter_name || "Unknown",
      formatDate(i.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusCards = [
    { key: "pending", label: "Pending", tone: "border-amber-200 bg-amber-50 text-amber-700" },
    { key: "in_progress", label: "In Progress", tone: "border-blue-200 bg-blue-50 text-blue-700" },
    { key: "resolved", label: "Resolved", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { key: "rejected", label: "Rejected", tone: "border-rose-200 bg-rose-50 text-rose-700" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-strong flex items-center gap-3 rounded-2xl px-6 py-4 text-slate-700" role="status" aria-live="polite">
          <Loader className="animate-spin" size={20} />
          Loading issues...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40 p-4 md:p-6">
      <div className="w-full space-y-6">
        <Card className="overflow-hidden border border-slate-200/70">
          <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="resolved">Admin issue ledger</Badge>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                    <ShieldCheck size={14} />
                    All departments in one view
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    All Issues
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    Search, filter, inspect on the map, and update statuses from a single consolidated admin view.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.total}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Active</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-600">{summary.active}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Resolved</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{summary.resolved}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{summary.resolutionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Search</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Find issues fast</p>
                <p className="mt-2 text-sm text-slate-500">Use keywords in the title or description.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Search size={22} />
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by title or description..."
                  aria-label="Search issues by title or description"
                  className="pl-11"
                />
                <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
              >
                Search
                <ArrowUpRight size={16} />
              </button>
            </div>
          </Card>

          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl md:col-span-1">
            <p className="text-sm font-medium text-slate-500">Export</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Download CSV</p>
            <p className="mt-2 text-sm text-slate-500">Create a quick spreadsheet of the visible list.</p>
            <button
              onClick={exportCSV}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <FileDown size={16} />
              Export CSV
            </button>
          </Card>

          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl md:col-span-1">
            <p className="text-sm font-medium text-slate-500">Mode</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{activeTab === "table" ? "Table" : "Map"}</p>
            <p className="mt-2 text-sm text-slate-500">Switch between list and spatial view.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <Layers3 size={14} />
              {issues.length} loaded
            </div>
          </Card>
        </div>

        <Card className="border border-slate-200/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">Narrow the ledger by category, severity, or current status.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <Filter size={14} />
              Refine results
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>

            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Tip: In table mode, swipe horizontally on small screens to view all columns.</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {statusCards.map((item) => (
            <Card key={item.key} className={`border p-5 ${item.tone}`}>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{summary[item.key]}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <BarChart3 size={14} />
                Current portal status count
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden border border-slate-200/70">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Issue Views</h2>
              <p className="mt-1 text-sm text-slate-500">Toggle between the table and the map without leaving this page.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
              <button
                onClick={() => setActiveTab("table")}
                aria-label="Switch to table view"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === "table" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
              >
                <List size={16} />
                Table
              </button>
              <button
                onClick={() => setActiveTab("map")}
                aria-label="Switch to map view"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === "map" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Map size={16} />
                Map
              </button>
            </div>
          </div>

          <div className="p-6">
            <p className="mb-4 text-sm text-slate-500" aria-live="polite">Showing {issues.length} issue{issues.length === 1 ? "" : "s"} for the current search and filters.</p>
            {activeTab === "table" ? (
              issues.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-245">
                      <caption className="sr-only">All filtered issues with department, severity, status, reporter, and date.</caption>
                      <thead className="bg-slate-50/90">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th scope="col" className="px-6 py-4">Issue</th>
                          <th scope="col" className="px-6 py-4">Department</th>
                          <th scope="col" className="px-6 py-4">Category</th>
                          <th scope="col" className="px-6 py-4">Severity</th>
                          <th scope="col" className="px-6 py-4">Status</th>
                          <th scope="col" className="px-6 py-4">Reporter</th>
                          <th scope="col" className="px-6 py-4">Date</th>
                          <th scope="col" className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {issues.map((issue) => (
                          <tr key={issue.id} className="transition-colors hover:bg-slate-50/80">
                            <th scope="row" className="px-6 py-4 align-top text-left">
                              <p className="font-semibold text-slate-900">{issue.title}</p>
                              <p className="mt-1 max-w-xl text-sm text-slate-500">
                                {issue.description?.substring(0, 120)}{issue.description?.length > 120 ? "..." : ""}
                              </p>
                            </th>
                            <td className="px-6 py-4 align-top text-sm text-slate-600">
                              <div className="space-y-1">
                                <p className="font-medium text-slate-900">{issue.department_name || "Unassigned"}</p>
                                <p>{issue.sub_department_name || "No sub-department"}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top text-sm text-slate-600">
                              {CATEGORY_LABELS[issue.category] || issue.category}
                            </td>
                            <td className="px-6 py-4 align-top text-sm">
                              <Badge variant={issue.severity}>{issue.severity}</Badge>
                            </td>
                            <td className="px-6 py-4 align-top text-sm">
                              <Badge variant={issue.status} className="capitalize">
                                <span className="inline-flex items-center gap-1.5 capitalize">
                                  {getStatusIcon(issue.status)}
                                  {issue.status.replace("_", " ")}
                                </span>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 align-top text-sm text-slate-600">{issue.reporter_name || "Unknown"}</td>
                            <td className="px-6 py-4 align-top text-sm text-slate-600">{formatDate(issue.created_at)}</td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => openIssueDetails(issue.id)}
                                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setNewStatus(issue.status || "");
                                    setUpdateStatusModal(true);
                                  }}
                                  className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => handleDeleteIssue(issue)}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500">
                  <AlertTriangle size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium text-slate-700">No issues found</p>
                  <p className="mt-1 text-sm text-slate-500" role="status" aria-live="polite">Try clearing filters or using a broader search.</p>
                </div>
              )
            ) : (
              <div className="h-104 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:h-136">
                <IssueMap issues={mapIssues} />
              </div>
            )}
          </div>
        </Card>

      {/* Update Status Modal */}
      {updateStatusModal && (
        <Modal
          open={Boolean(updateStatusModal)}
          onClose={() => setUpdateStatusModal(false)}
          title="Update Issue Status"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Issue</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{selectedIssue?.title}</p>
              <p className="mt-1 text-sm text-slate-500">{CATEGORY_LABELS[selectedIssue?.category] || selectedIssue?.category}</p>
            </div>

            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="New status">
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </Select>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUpdateStatusModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
              >
                Update
              </button>
            </div>
          </div>
        </Modal>
      )}

      {detailModalOpen && (
        <Modal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setIssueDetail(null);
          }}
          title="Issue Details"
        >
          {detailLoading ? (
            <div className="py-6 text-center text-sm text-slate-600">Loading issue details...</div>
          ) : issueDetail ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Title</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{issueDetail.title}</p>
                <p className="mt-3 text-sm text-slate-600">{issueDetail.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                  <p className="mt-1 font-medium text-slate-900">{CATEGORY_LABELS[issueDetail.category] || issueDetail.category}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Severity</p>
                  <p className="mt-1 font-medium capitalize text-slate-900">{issueDetail.severity}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <p className="mt-1 font-medium capitalize text-slate-900">{issueDetail.status?.replace("_", " ")}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Reporter</p>
                  <p className="mt-1 font-medium text-slate-900">{issueDetail.reporter_name || "Unknown"}</p>
                </div>
              </div>

              {issueDetail.address && (
                <div className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                  <p className="mt-1 text-slate-800">{issueDetail.address}</p>
                </div>
              )}

              {issueDetail.image && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Uploaded Image</p>
                  <img
                    src={getIssueImageUrl(issueDetail.image)}
                    alt="Uploaded issue evidence"
                    className="max-h-72 w-full rounded-xl border border-slate-200 object-contain bg-white"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-slate-600">No details found for this issue.</div>
          )}
        </Modal>
      )}
      </div>
    </div>
  );
}
