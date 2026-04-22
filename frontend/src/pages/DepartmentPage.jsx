import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import api from "../api/axios";
import {
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Building2,
  Layers3,
  ListChecks,
  ShieldCheck,
  RefreshCcw,
  SlidersHorizontal,
  Sparkles,
  ChevronRight,
  MapPinned,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_META = {
  pending: { label: "Pending", tone: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  in_progress: { label: "In Progress", tone: "border-blue-200 bg-blue-50 text-blue-700", icon: Loader },
  resolved: { label: "Resolved", tone: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle },
  rejected: { label: "Rejected", tone: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
};

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildCacheKey(subDeptId, statusFilter, search) {
  return `${subDeptId}:${statusFilter || "all"}:${search.trim().toLowerCase()}`;
}

function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.pending;
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [expandedDept, setExpandedDept] = useState(null);
  const [expandedSubDept, setExpandedSubDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [issueCache, setIssueCache] = useState({});
  const issueCacheRef = useRef({});
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [updateStatusModal, setUpdateStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [pageError, setPageError] = useState("");

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const [departmentsRes, statsRes] = await Promise.all([
        api.get("/issues/departments/all"),
        api.get("/issues/department/stats"),
      ]);
      setDepartments(departmentsRes.data || []);
      setDepartmentStats(statsRes.data || []);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to load departments";
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const statsByDepartment = useMemo(() => {
    return departmentStats.reduce((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [departmentStats]);

  const summaryStats = useMemo(() => {
    const totals = departmentStats.reduce(
      (acc, row) => {
        acc.total += Number(row.total_issues || 0);
        acc.pending += Number(row.pending || 0);
        acc.in_progress += Number(row.in_progress || 0);
        acc.resolved += Number(row.resolved || 0);
        acc.rejected += Number(row.rejected || 0);
        return acc;
      },
      { total: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0 },
    );

    const active = totals.pending + totals.in_progress;
    const closed = totals.resolved + totals.rejected;
    return {
      ...totals,
      active,
      closed,
      resolutionRate: totals.total ? Math.round((totals.resolved / totals.total) * 100) : 0,
    };
  }, [departmentStats]);

  const totalSubDepartments = useMemo(
    () => departments.reduce((count, dept) => count + (dept.sub_departments?.length || 0), 0),
    [departments],
  );

  const fetchSubDepartmentIssues = useCallback(async (subDeptId, force = false) => {
    const cacheKey = buildCacheKey(subDeptId, statusFilter, search);
    if (!force && issueCacheRef.current[cacheKey]) {
      return issueCacheRef.current[cacheKey];
    }

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const url = params.toString()
        ? `/issues/sub_department/${subDeptId}/issues?${params.toString()}`
        : `/issues/sub_department/${subDeptId}/issues`;

      const res = await api.get(url);
      const updatedCache = {
        ...issueCacheRef.current,
        [cacheKey]: res.data || [],
      };
      issueCacheRef.current = updatedCache;
      setIssueCache(updatedCache);
      return res.data || [];
    } catch {
      toast.error("Failed to load issues");
      return [];
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (expandedSubDept) {
      fetchSubDepartmentIssues(expandedSubDept, true);
    }
  }, [search, statusFilter, expandedSubDept, fetchSubDepartmentIssues]);

  const handleDepartmentClick = (deptId) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
      setExpandedSubDept(null);
      return;
    }
    setExpandedDept(deptId);
    setExpandedSubDept(null);
  };

  const handleSubDepartmentClick = (subDeptId) => {
    if (expandedSubDept === subDeptId) {
      setExpandedSubDept(null);
      return;
    }
    setExpandedSubDept(subDeptId);
    fetchSubDepartmentIssues(subDeptId);
  };

  const clearSubDeptCaches = (subDeptId) => {
    const prefix = `${subDeptId}:`;
    const nextCache = {};
    Object.entries(issueCacheRef.current).forEach(([key, value]) => {
      if (!key.startsWith(prefix)) {
        nextCache[key] = value;
      }
    });
    issueCacheRef.current = nextCache;
    setIssueCache(nextCache);
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue || !newStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      await api.patch(`/issues/${selectedIssue.id}/status`, {
        status: newStatus,
      });
      toast.success("Status updated successfully");
      setUpdateStatusModal(false);
      const subDeptId = selectedIssue.sub_department_id;
      setSelectedIssue(null);
      setNewStatus("");

      if (subDeptId) {
        clearSubDeptCaches(subDeptId);
        await fetchSubDepartmentIssues(subDeptId, true);
      }
      if (expandedSubDept && expandedSubDept !== subDeptId) {
        fetchSubDepartmentIssues(expandedSubDept, true);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-strong flex items-center gap-3 rounded-2xl px-6 py-4 text-slate-700">
          <Loader className="animate-spin" size={20} />
          Loading departments...
        </div>
      </div>
    );
  }

  const departmentCards = departments.map((dept) => {
    const stats = statsByDepartment[dept.id] || {};
    const totalIssues = Number(stats.total_issues || 0);
    const resolved = Number(stats.resolved || 0);
    const completion = totalIssues ? Math.round((resolved / totalIssues) * 100) : 0;

    return {
      ...dept,
      totalIssues,
      pending: Number(stats.pending || 0),
      inProgress: Number(stats.in_progress || 0),
      resolved,
      rejected: Number(stats.rejected || 0),
      completion,
    };
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40 p-4 md:p-6">
      <div className="w-full space-y-6">
        <Card className="overflow-hidden border border-slate-200/70">
          <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                  <Sparkles size={14} />
                  Department Control Center
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  Departments
                </h1>
                <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
                  Browse departments and sub-departments, review their issues, and update status in a cleaner workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-117.5">
                {[
                  { label: "Departments", value: departments.length, icon: Building2, tone: "text-blue-700 bg-blue-50 border-blue-200" },
                  { label: "Sub-departments", value: totalSubDepartments, icon: Layers3, tone: "text-violet-700 bg-violet-50 border-violet-200" },
                  { label: "Active", value: summaryStats.active, icon: ListChecks, tone: "text-amber-700 bg-amber-50 border-amber-200" },
                  { label: "Resolved", value: summaryStats.resolved, icon: ShieldCheck, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`rounded-2xl border ${item.tone} p-4 shadow-sm`}>
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide opacity-80">
                        <span>{item.label}</span>
                        <Icon size={14} />
                      </div>
                      <div className="mt-3 text-3xl font-black text-slate-900">{item.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {pageError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Issues", value: summaryStats.total, accent: "from-blue-600 to-cyan-500" },
            { label: "Pending", value: summaryStats.pending, accent: "from-amber-500 to-orange-500" },
            { label: "In Progress", value: summaryStats.in_progress, accent: "from-sky-500 to-blue-600" },
            { label: "Resolution Rate", value: `${summaryStats.resolutionRate}%`, accent: "from-emerald-500 to-green-600" },
          ].map((item) => (
            <Card key={item.label} className="overflow-hidden border border-slate-200/70">
              <div className={`h-1 bg-linear-to-r ${item.accent}`} />
              <div className="p-5">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{item.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="border border-slate-200/70">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Filter issues</h2>
                <p className="text-sm text-slate-500">Search within the selected department and sub-department.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchDepartments}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          <div className="grid gap-4 border-t border-slate-200 p-5 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search issue title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-800 outline-none transition-shadow focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-shadow focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div className="space-y-4">
          {departmentCards.map((dept) => {
            const isExpanded = expandedDept === dept.id;
            const stats = {
              pending: dept.pending,
              inProgress: dept.inProgress,
              resolved: dept.resolved,
              rejected: dept.rejected,
            };

            return (
              <Card key={dept.id} className="overflow-hidden border border-slate-200/70 transition-shadow hover:shadow-2xl">
                <button
                  onClick={() => handleDepartmentClick(dept.id)}
                  className="flex w-full items-stretch justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-slate-50/80"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-11 w-11 items-center justify-center rounded-2xl ${isExpanded ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Building2 size={20} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-extrabold text-slate-900">{dept.name}</h3>
                        <Badge variant="pending" className="border border-amber-200 bg-amber-50 text-amber-700">
                          {dept.sub_departments ? dept.sub_departments.length : 0} sub-depts
                        </Badge>
                        <Badge variant="resolved" className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          {dept.totalIssues} issues
                        </Badge>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm text-slate-500">{dept.description}</p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        {[
                          { label: "Pending", value: stats.pending, variant: "pending" },
                          { label: "In Progress", value: stats.inProgress, variant: "in_progress" },
                          { label: "Resolved", value: stats.resolved, variant: "resolved" },
                          { label: "Rejected", value: stats.rejected, variant: "rejected" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span>{item.label}</span>
                              <Badge variant={item.variant}>{item.value}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-500 via-cyan-500 to-blue-600"
                          style={{ width: `${dept.completion}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="hidden text-right md:block">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Coverage</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{dept.totalIssues} tracked</p>
                    </div>
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Layers3 size={16} />
                      Sub-departments
                    </div>

                    {dept.sub_departments && dept.sub_departments.length > 0 ? (
                      <div className="space-y-4">
                        {dept.sub_departments.map((subDept) => {
                          const cacheKey = buildCacheKey(subDept.id, statusFilter, search);
                          const subDeptIssues = issueCache[cacheKey] || [];
                          const subDeptExpanded = expandedSubDept === subDept.id;
                          const issueCount = Number(subDept.issue_count ?? subDeptIssues.length ?? 0);
                          const status = subDeptIssues.length > 0 ? "resolved" : "pending";
                          const meta = getStatusMeta(status);
                          const StatusIcon = meta.icon;

                          return (
                            <div key={subDept.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <button
                                onClick={() => handleSubDepartmentClick(subDept.id)}
                                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${subDeptExpanded ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                    {subDeptExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-bold text-slate-900">{subDept.name}</p>
                                      <Badge variant="pending" className="border border-amber-200 bg-amber-50 text-amber-700">
                                        {issueCount} issues
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{subDept.description}</p>
                                  </div>
                                </div>

                                <div className="hidden items-center gap-2 text-slate-400 md:flex">
                                  <ChevronRight size={18} />
                                </div>
                              </button>

                              {subDeptExpanded && (
                                <div className="border-t border-slate-200 bg-slate-50/80 p-4 md:p-5">
                                  {subDeptIssues.length > 0 ? (
                                    <div className="grid gap-3">
                                      {subDeptIssues.map((issue) => {
                                        const issueMeta = getStatusMeta(issue.status);
                                        const IssueStatusIcon = issueMeta.icon;

                                        return (
                                          <div
                                            key={issue.id}
                                            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                          >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                              <button
                                                type="button"
                                                onClick={() => setSelectedIssue(issue)}
                                                className="flex-1 text-left"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <IssueStatusIcon size={16} className={issue.status === "pending" ? "text-amber-500" : issue.status === "in_progress" ? "text-blue-500" : issue.status === "resolved" ? "text-emerald-500" : "text-red-500"} />
                                                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                                                    {issue.title}
                                                  </h4>
                                                </div>
                                                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                                                  {issue.description?.substring(0, 160)}{issue.description?.length > 160 ? "..." : ""}
                                                </p>

                                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                                  <Badge variant={issue.severity}>
                                                    {issue.severity}
                                                  </Badge>
                                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${issueMeta.tone}`}>
                                                    <IssueStatusIcon size={13} />
                                                    {issueMeta.label}
                                                  </span>
                                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPinned size={13} />
                                                    {formatDate(issue.created_at)}
                                                  </span>
                                                </div>
                                              </button>

                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedIssue(issue);
                                                  setNewStatus(issue.status);
                                                  setUpdateStatusModal(true);
                                                }}
                                                className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
                                              >
                                                Update Status
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-500">
                                      <AlertTriangle size={16} className="mr-2" />
                                      No issues match the current filters in this sub-department.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-500">
                        No sub-departments available.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {Object.keys(issueCache).length === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center text-slate-500">
            <AlertTriangle size={18} className="mx-auto mb-2" />
            Expand a sub-department to view and update issues.
          </div>
        )}
      </div>

      {updateStatusModal && (
        <Modal
          open={Boolean(updateStatusModal)}
          onClose={() => setUpdateStatusModal(false)}
          title="Update Issue Status"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected issue</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{selectedIssue?.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedIssue?.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={selectedIssue?.severity || "pending"}>{selectedIssue?.severity}</Badge>
                <Badge variant={selectedIssue?.status || "pending"}>{selectedIssue?.status?.replace("_", " ")}</Badge>
                <Badge variant="pending">#{selectedIssue?.id}</Badge>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Update status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-shadow focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUpdateStatusModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
              >
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
