import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  Plus, MapPin, Clock, CheckCircle, Search,
  AlertCircle, RefreshCcw, XCircle, Eye, ThumbsUp,
} from "lucide-react";
import toast from "react-hot-toast";

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
      setDetail(res.data);
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
    <div className="animated-bg min-h-screen relative">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"5%",right:"10%",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.06) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"20%",left:"5%",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)"}} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-400 text-sm mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold gradient-text">{user?.name}</h1>
          </div>
          <Link to="/report">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105"
              style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)",boxShadow:"0 0 24px rgba(34,211,238,0.3)"}}>
              <Plus size={16} /> Report Issue
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="glass-strong rounded-2xl p-5 text-center"
              style={{border:`1px solid ${s.border}`}}>
              <p className="text-3xl font-black mb-1" style={{color:s.color}}>{s.value}</p>
              <p className="text-slate-400 text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-strong rounded-2xl p-4 mb-6 flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search issues…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchIssues()}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
              style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-slate-300 outline-none"
            style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}
          >
            <option value="" style={{background:"#0f172a"}}>All Status</option>
            <option value="pending" style={{background:"#0f172a"}}>Pending</option>
            <option value="in_progress" style={{background:"#0f172a"}}>In Progress</option>
            <option value="resolved" style={{background:"#0f172a"}}>Resolved</option>
            <option value="rejected" style={{background:"#0f172a"}}>Rejected</option>
          </select>
          <button
            onClick={fetchIssues}
            className="px-4 py-2 rounded-xl text-sm font-medium text-cyan-400 transition-all hover:text-white"
            style={{background:"rgba(34,211,238,0.08)",border:"1px solid rgba(34,211,238,0.2)"}}>
            <RefreshCcw size={14} />
          </button>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            Loading issues…
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-strong rounded-2xl text-center py-16 px-4">
            <AlertCircle size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-5">No issues found</p>
            <Link to="/report">
              <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
                style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>
                <Plus size={15} /> Report Your First Issue
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((issue) => {
              const sevColor = SEVERITY_COLORS[issue.severity] || "#94a3b8";
              return (
                <div
                  key={issue.id}
                  className="glass rounded-2xl cursor-pointer transition-all hover:scale-[1.01] overflow-hidden"
                  style={{border:"1px solid rgba(255,255,255,0.07)",borderLeft:`3px solid ${sevColor}`}}
                  onClick={() => openDetail(issue.id)}
                >
                  <div className="p-4 flex items-start gap-4">
                    {issue.image ? (
                      <img src={issue.image.startsWith("http") ? issue.image : `/uploads/${issue.image}`} alt="issue"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-white/10" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center"
                        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                        <AlertCircle size={22} className="text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-100 text-sm">{issue.title}</h3>
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
                      <p className="text-slate-400 text-xs line-clamp-2 mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
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
                          : {background:"rgba(255,255,255,0.04)",color:"#475569"}}
                      >
                        <ThumbsUp size={14} className={issue.user_upvoted ? "fill-cyan-400" : ""} />
                        <span className="text-xs font-bold">{issue.upvote_count || 0}</span>
                      </button>
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl"
                        style={{background:"rgba(255,255,255,0.03)",color:"#475569"}}>
                        <Eye size={13} />
                      </div>
                    </div>
                  </div>
                  {/* Status progress bar */}
                  <div className="h-0.5 w-full" style={{background:"rgba(255,255,255,0.04)"}}>
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
              <h2 className="text-xl font-bold text-slate-100">{detail.title}</h2>
              <div className="flex gap-2">
                <Badge variant={detail.severity}>{detail.severity}</Badge>
                <Badge variant={detail.status}>{detail.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{detail.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Category", value: detail.category.replace("_", " "), cap: true },
                { label: "Reported", value: formatDate(detail.created_at) },
                detail.latitude ? { label: "Coordinates", value: `${parseFloat(detail.latitude).toFixed(5)}, ${parseFloat(detail.longitude).toFixed(5)}`, small: true } : null,
                { label: "SLA", value: `${detail.sla_hours}h expected` },
              ].filter(Boolean).map((item) => (
                <div key={item.label} className="rounded-xl p-3"
                  style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <p className="text-slate-500 text-xs mb-0.5">{item.label}</p>
                  <p className={`text-slate-200 font-medium ${item.small ? "text-xs" : ""} ${item.cap ? "capitalize" : ""}`}>{item.value}</p>
                </div>
              ))}
            </div>
            {detail.timeline?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Activity Timeline</h4>
                <div className="flex flex-col gap-2">
                  {detail.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}} />
                      <div>
                        <p className="text-sm text-slate-300">{t.action}</p>
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
