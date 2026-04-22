import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  Plus, MapPin, Clock, CheckCircle, Search,
  AlertCircle, RefreshCcw, XCircle, Eye, ThumbsUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { reverseGeocode } from "../utils/geocoding";

const STATUS_ICONS = {
  pending: <Clock size={14} className="text-yellow-400" />,
  in_progress: <RefreshCcw size={14} className="text-blue-400" />,
  resolved: <CheckCircle size={14} className="text-emerald-400" />,
  rejected: <XCircle size={14} className="text-red-400" />,
};

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/issues", { params });
      setIssues(res.data);
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchIssues(); }, [statusFilter]);

  const handleUpvote = async (e, issueId, userUpvoted) => {
    e.stopPropagation();
    try {
      const res = userUpvoted
        ? await api.delete(`/issues/${issueId}/upvote`)
        : await api.post(`/issues/${issueId}/upvote`);
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId
            ? { ...i, upvote_count: res.data.upvote_count, user_upvoted: res.data.user_upvoted }
            : i
        )
      );
    } catch {
      toast.error("Failed to upvote");
    }
  };

  const openDetail = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    try {
      const res = await api.get(`/issues/${id}`);
      const issue = res.data;
      if (!issue.address && issue.latitude && issue.longitude) {
        const address = await reverseGeocode(issue.latitude, issue.longitude);
        setDetail({ ...issue, address: address || "" });
      } else {
        setDetail(issue);
      }
    } catch {
      toast.error("Failed to load issue details");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = issues.filter((i) =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: issues.length,
    pending: issues.filter((i) => i.status === "pending").length,
    in_progress: issues.filter((i) => i.status === "in_progress").length,
    resolved: issues.filter((i) => i.status === "resolved").length,
  };

  const STAT_CARDS = [
    { label: "Total Reported", value: counts.total, color: "#22d3ee", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.2)" },
    { label: "Pending", value: counts.pending, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    { label: "In Progress", value: counts.in_progress, color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
    { label: "Resolved", value: counts.resolved, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  ];

  const SEVERITY_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

  return (
    <div className="min-h-screen relative bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"5%",right:"10%",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(15,61,145,0.08) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"20%",left:"5%",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)"}} />
      </div>

      <div className="relative z-10 w-full px-4 py-6 md:px-6">
        <Card className="overflow-hidden border border-slate-200/70 mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge variant="resolved">Citizen dashboard</Badge>
                <div>
                  <p className="text-sm font-medium text-slate-500">Welcome back</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">{user?.name}</h1>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Track your reports, review progress, and jump into a new issue submission when needed.
                </p>
              </div>
              <Link to="/report" className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5">
                <Plus size={16} /> Report Issue
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((s) => (
            <Card key={s.label} className="rounded-2xl p-5 text-center border border-slate-200/70">
              <p className="text-3xl font-black mb-1" style={{color:s.color}}>{s.value}</p>
              <p className="text-slate-600 text-xs font-medium">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border border-slate-200/70 p-4 mb-6">
          <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search issues…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchIssues()}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-700 placeholder-slate-500 outline-none transition-all"
              style={{background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.2)"}}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-slate-700 outline-none"
            style={{background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.2)"}}
          >
            <option value="" style={{background:"#ffffff",color:"#0f172a"}}>All Status</option>
            <option value="pending" style={{background:"#ffffff",color:"#0f172a"}}>Pending</option>
            <option value="in_progress" style={{background:"#ffffff",color:"#0f172a"}}>In Progress</option>
            <option value="resolved" style={{background:"#ffffff",color:"#0f172a"}}>Resolved</option>
            <option value="rejected" style={{background:"#ffffff",color:"#0f172a"}}>Rejected</option>
          </select>
          <button
            onClick={fetchIssues}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <RefreshCcw size={14} />
          </button>
          </div>
        </Card>

        {/* Issues List */}
        {loading ? (
          <Card className="border border-slate-200/70 p-10 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-700/20 border-t-blue-700 rounded-full animate-spin mx-auto mb-4" />
            Loading issues…
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border border-slate-200/70 text-center py-16 px-4">
            <AlertCircle size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 mb-5">No issues found</p>
            <Link to="/report">
              <button className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200">
                <Plus size={15} /> Report Your First Issue
              </button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((issue) => {
              const sevColor = SEVERITY_COLORS[issue.severity] || "#94a3b8";
              return (
                <div
                  key={issue.id}
                  className="overflow-hidden rounded-2xl cursor-pointer border border-slate-200/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                  style={{borderLeft:`3px solid ${sevColor}`}}
                  onClick={() => openDetail(issue.id)}
                >
                  <div className="p-4 flex items-start gap-4">
                    {issue.image ? (
                      <img src={issue.image.startsWith("http") ? issue.image : `/uploads/${issue.image}`} alt="issue"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-white/10" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center"
                        style={{background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.14)"}}>
                        <AlertCircle size={22} className="text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-800 text-sm">{issue.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant={issue.severity}>{issue.severity}</Badge>
                          <Badge variant={issue.status}>
                            <span className="flex items-center gap-1">
                              {STATUS_ICONS[issue.status]}
                              {issue.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-2 mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="capitalize">{issue.category.replace("_", " ")}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {formatDate(issue.created_at)}
                        </span>
                        {issue.latitude && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {parseFloat(issue.latitude).toFixed(4)}, {parseFloat(issue.longitude).toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={(e) => handleUpvote(e, issue.id, issue.user_upvoted)}
                        className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all"
                        style={issue.user_upvoted
                          ? {background:"rgba(34,211,238,0.15)",color:"#22d3ee"}
                          : {background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.14)",color:"#475569"}}
                      >
                        <ThumbsUp size={14} className={issue.user_upvoted ? "fill-cyan-400" : ""} />
                        <span className="text-xs font-bold">{issue.upvote_count || 0}</span>
                      </button>
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl"
                        style={{background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.12)",color:"#475569"}}>
                        <Eye size={13} />
                      </div>
                    </div>
                  </div>
                  {/* Status progress bar */}
                  <div className="h-0.5 w-full bg-slate-200">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: issue.status === "resolved" ? "100%" : issue.status === "in_progress" ? "60%" : issue.status === "rejected" ? "100%" : "20%",
                        background: issue.status === "resolved" ? "#10b981" : issue.status === "in_progress" ? "#60a5fa" : issue.status === "rejected" ? "#ef4444" : "#f59e0b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setDetail(null); }}
        title="Issue Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
            Loading…
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-5">
            {detail.image && (
              <img src={detail.image.startsWith("http") ? detail.image : `/uploads/${detail.image}`} alt="issue"
                className="w-full rounded-xl max-h-64 object-cover ring-1 ring-white/10" />
            )}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-900">{detail.title}</h2>
              <div className="flex gap-2">
                <Badge variant={detail.severity}>{detail.severity}</Badge>
                <Badge variant={detail.status}>{detail.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{detail.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Category", value: detail.category.replace("_", " "), cap: true },
                { label: "Reported", value: formatDate(detail.created_at) },
                { label: "SLA", value: `${detail.sla_hours}h expected` },
              ].filter(Boolean).map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-slate-500 text-xs mb-0.5">{item.label}</p>
                  <p className={`text-slate-800 font-medium ${item.small ? "text-xs" : ""} ${item.cap ? "capitalize" : ""}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Location Details */}
            {(detail.latitude && detail.longitude) && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-700">Location</p>
                <div className="space-y-1">
                  {detail.address && (
                    <p className="text-sm font-medium text-slate-900">{detail.address}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Coordinates: {parseFloat(detail.latitude).toFixed(6)}, {parseFloat(detail.longitude).toFixed(6)}
                  </p>
                </div>
              </div>
            )}
            {detail.timeline?.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Activity Timeline</h4>
                <div className="flex flex-col gap-2">
                  {detail.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}} />
                      <div>
                        <p className="text-sm text-slate-700">{t.action}</p>
                        <p className="text-xs text-slate-500">{formatDate(t.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
