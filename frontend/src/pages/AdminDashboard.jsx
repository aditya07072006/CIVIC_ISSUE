import { useState, useEffect, useCallback } from "react";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { IssueMap } from "../components/map/IssueMap";
import api from "../api/axios";
import {
  Doughnut, Bar, Line,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Filler,
} from "chart.js";
import {
  AlertTriangle, CheckCircle, Clock, XCircle, RefreshCcw,
  Trash2, Eye, Search, Map, List, Download,
} from "lucide-react";
import toast from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_COLORS = {
  pending: "#eab308",
  in_progress: "#3b82f6",
  resolved: "#10b981",
  rejected: "#ef4444",
};

const CATEGORY_LABELS = {
  pothole: "Pothole",
  garbage: "Garbage",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  road_damage: "Road Damage",
  drainage: "Drainage",
  other: "Other",
};

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [mapIssues, setMapIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", severity: "", status: "" });
  const [activeTab, setActiveTab] = useState("table");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const displayedIssues = issues;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      if (overdueOnly) params.overdue = "true";
      const [issuesRes, statsRes, mapRes, trendRes] = await Promise.all([
        api.get("/issues", { params }),
        api.get("/issues/analytics/stats"),
        api.get("/issues/map/all"),
        api.get("/issues/analytics/trend"),
      ]);
      setIssues(issuesRes.data);
      setStats(statsRes.data);
      setMapIssues(mapRes.data);
      setTrend(trendRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters, search, overdueOnly]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [filters, overdueOnly]);

  const handleSearch = () => fetchAll();

  const exportCSV = () => {
    const headers = ["ID", "Title", "Category", "Severity", "Status", "Reporter", "Date"];
    const rows = issues.map((i) => [
      i.id,
      `"${(i.title || "").replace(/"/g, '""')}"`,
      CATEGORY_LABELS[i.category] || i.category,
      i.severity,
      i.status,
      i.reporter_name || "",
      formatDate(i.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `civic-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (issueId, status) => {
    try {
      await api.patch(`/issues/${issueId}/status`, { status });
      toast.success("Status updated");
      fetchAll();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/issues/${deleteId}`);
      toast.success("Issue deleted");
      setDeleteId(null);
      fetchAll();
    } catch {
      toast.error("Failed to delete issue");
    }
  };

  const openDetail = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    try {
      const res = await api.get(`/issues/${id}`);
      setDetail(res.data);
    } catch {
      toast.error("Failed to load details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Chart data
  const statusChartData = stats ? {
    labels: ["Pending", "In Progress", "Resolved", "Rejected"],
    datasets: [{
      data: [
        stats.by_status?.pending || 0,
        stats.by_status?.in_progress || 0,
        stats.by_status?.resolved || 0,
        stats.by_status?.rejected || 0,
      ],
      backgroundColor: ["#eab308", "#3b82f6", "#10b981", "#ef4444"],
      borderWidth: 0,
    }],
  } : null;

  const categoryChartData = stats ? {
    labels: Object.keys(stats.by_category || {}).map(k => CATEGORY_LABELS[k] || k),
    datasets: [{
      label: "Issues",
      data: Object.values(stats.by_category || {}),
      backgroundColor: "#6366f1",
      borderRadius: 6,
    }],
  } : null;

  const trendChartData = trend.length ? {
    labels: trend.map((d) => {
      const dt = new Date(d.date);
      return `${dt.getDate()} ${dt.toLocaleString("en", { month: "short" })}`;
    }),
    datasets: [{
      label: "Issues Reported",
      data: trend.map((d) => d.count),
      borderColor: "#22d3ee",
      backgroundColor: "rgba(34,211,238,0.08)",
      borderWidth: 2,
      pointBackgroundColor: "#22d3ee",
      pointRadius: 3,
      tension: 0.4,
      fill: true,
    }],
  } : null;

  const STAT_META = [
    { label: "Total Issues",  color: "#94a3b8", border: "rgba(148,163,184,0.2)" },
    { label: "Pending",       color: "#eab308", border: "rgba(234,179,8,0.25)"  },
    { label: "In Progress",   color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
    { label: "Resolved",      color: "#10b981", border: "rgba(16,185,129,0.25)" },
    { label: "Rejected",      color: "#ef4444", border: "rgba(239,68,68,0.25)"  },
    { label: "Overdue",       color: "#f97316", border: "rgba(249,115,22,0.25)" },
  ];

  const statCards = stats ? [
    { label: "Total Issues",  value: stats.total,                        icon: <AlertTriangle size={18} /> },
    { label: "Pending",       value: stats.by_status?.pending    || 0,   icon: <Clock size={18} /> },
    { label: "In Progress",   value: stats.by_status?.in_progress || 0,  icon: <RefreshCcw size={18} /> },
    { label: "Resolved",      value: stats.by_status?.resolved   || 0,   icon: <CheckCircle size={18} /> },
    { label: "Rejected",      value: stats.by_status?.rejected   || 0,   icon: <XCircle size={18} /> },
    { label: "Overdue",       value: stats.overdue               || 0,   icon: <AlertTriangle size={18} /> },
  ] : [];

  return (
    <div className="animated-bg min-h-screen relative">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"5%",right:"8%",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.05) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"15%",left:"3%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)"}} />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-slate-500 text-sm mb-1">Municipal Management</p>
          <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((s, i) => {
            const meta = STAT_META[i] || STAT_META[0];
            return (
            <div key={s.label} className="glass-strong rounded-2xl p-4" style={{border:`1px solid ${meta.border}`}}>
              <div className="mb-2" style={{color:meta.color}}>{s.icon}</div>
              <p className="text-2xl font-bold" style={{color:meta.color}}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
            );
          })}
        </div>

        {/* Charts Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-strong rounded-2xl p-5">
              <p className="text-sm font-semibold text-slate-300 mb-4">Status Distribution</p>
                <div className="flex justify-center" style={{ height: 220 }}>
                  {statusChartData && (
                    <Doughnut
                      data={statusChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: { color: "#94a3b8", boxWidth: 12, padding: 12 },
                          },
                        },
                      }}
                    />
                  )}
                </div>
            </div>
            <div className="glass-strong rounded-2xl p-5">
              <p className="text-sm font-semibold text-slate-300 mb-4">Issues by Category</p>
                <div style={{ height: 220 }}>
                  {categoryChartData && (
                    <Bar
                      data={categoryChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
                          y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
                        },
                      }}
                    />
                  )}
                </div>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {trendChartData && (
          <div className="glass-strong rounded-2xl p-5 mb-8">
            <p className="text-sm font-semibold text-slate-300 mb-4">Issues Reported — Last 30 Days</p>
              <div style={{ height: 220 }}>
                <Line
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { color: "#94a3b8", maxTicksLimit: 10 }, grid: { color: "#1e293b" } },
                      y: { ticks: { color: "#94a3b8", stepSize: 1 }, grid: { color: "#1e293b" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
          </div>
        )}
        <div className="glass-strong rounded-2xl p-4 mb-6 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none"
              style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}
            />
          </div>
          {[{key:"category",options:Object.entries(CATEGORY_LABELS).map(([k,v])=>({value:k,label:v})),placeholder:"All Categories"},{key:"severity",options:[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"},{value:"critical",label:"Critical"}],placeholder:"All Severity"},{key:"status",options:[{value:"pending",label:"Pending"},{value:"in_progress",label:"In Progress"},{value:"resolved",label:"Resolved"},{value:"rejected",label:"Rejected"},{value:"overdue",label:"⚠ Overdue"}],placeholder:"All Status"}].map(({key,options,placeholder}) => (
            <select key={key} value={key==="status" && overdueOnly ? "overdue" : filters[key]}
              onChange={(e) => {
                if (key==="status" && e.target.value==="overdue") {
                  setOverdueOnly(true);
                  setFilters({...filters, status:""});
                } else {
                  setOverdueOnly(false);
                  setFilters({...filters,[key]:e.target.value});
                }
              }}
              className="px-3 py-2 rounded-xl text-sm text-slate-300 outline-none"
              style={key==="status" && overdueOnly
                ? {background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.4)",color:"#fb923c"}
                : {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <option value="" style={{background:"#0f172a"}}>{placeholder}</option>
              {options.map(o => <option key={o.value} value={o.value} style={{background:"#0f172a"}}>{o.label}</option>)}
            </select>
          ))}
        </div>

        {/* Tab Toggle + Export */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex gap-2">
            {[{id:"table",icon:<List size={14}/>,label:"Issue Table"},{id:"map",icon:<Map size={14}/>,label:"Issue Map"}].map(({id,icon,label}) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={activeTab===id
                  ? {background:"linear-gradient(135deg,rgba(34,211,238,0.15),rgba(168,85,247,0.15))",border:"1px solid rgba(34,211,238,0.25)",color:"#22d3ee"}
                  : {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#64748b"}}>
                {icon} {label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",color:"#10b981"}}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Table Tab */}
        {activeTab === "table" && (
          <div className="glass-strong rounded-2xl overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-slate-500">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
                Loading issues…
              </div>
            ) : displayedIssues.length === 0 ? (
              <div className="text-center py-16 text-slate-500">{overdueOnly ? "No overdue issues — all caught up! 🎉" : "No issues found"}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <th className="text-left px-4 py-3">Issue</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Severity</th>
                      <th className="text-left px-4 py-3">Image</th>
                      <th className="text-left px-4 py-3">Reported By</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedIssues.map((issue) => (
                      <tr key={issue.id} className="transition-colors cursor-pointer"
                        style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <p className="font-medium text-slate-100 truncate">{issue.title}</p>
                            <p className="text-slate-500 text-xs truncate">{issue.description}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 capitalize text-xs">{CATEGORY_LABELS[issue.category] || issue.category}</span>
                        </td>
                        <td className="px-4 py-3"><Badge variant={issue.severity}>{issue.severity}</Badge></td>
                        <td className="px-4 py-3">
                          {issue.image ? (
                            <img src={issue.image.startsWith("http") ? issue.image : `/uploads/${issue.image}`} alt="issue"
                              className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-white/10"
                              onClick={() => setImageModal(issue.image.startsWith("http") ? issue.image : `/uploads/${issue.image}`)} />
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{issue.reporter_name}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(issue.created_at)}</td>
                        <td className="px-4 py-3">
                          <select value={issue.status}
                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                            className="text-slate-200 rounded-lg px-2 py-1 text-xs outline-none"
                            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
                            <option value="pending" style={{background:"#0f172a"}}>Pending</option>
                            <option value="in_progress" style={{background:"#0f172a"}}>In Progress</option>
                            <option value="resolved" style={{background:"#0f172a"}}>Resolved</option>
                            <option value="rejected" style={{background:"#0f172a"}}>Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openDetail(issue.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => setDeleteId(issue.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === "map" && (
          <div className="glass-strong rounded-2xl p-5">
            <p className="text-sm font-semibold text-slate-300 mb-4">City Issue Map ({mapIssues.length} locations)</p>
              <IssueMap issues={mapIssues} />
              <div className="flex gap-3 mt-4 flex-wrap">
                {[
                  { color: "#10b981", label: "Low" },
                  { color: "#f97316", label: "Medium" },
                  { color: "#ef4444", label: "High" },
                  { color: "#a855f7", label: "Critical" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:l.color}} />
                    <span className="text-xs text-slate-400">{l.label}</span>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
                className="w-full rounded-xl max-h-64 object-cover cursor-pointer ring-1 ring-white/10"
                onClick={() => setImageModal(detail.image.startsWith("http") ? detail.image : `/uploads/${detail.image}`)} />
            )}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-100">{detail.title}</h2>
              <div className="flex gap-2">
                <Badge variant={detail.severity}>{detail.severity}</Badge>
                <Badge variant={detail.status}>{detail.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{detail.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:"Category",value:(CATEGORY_LABELS[detail.category]||detail.category),cap:true},
                {label:"Reporter",value:detail.reporter_name},
                {label:"Reported",value:formatDate(detail.created_at)},
                {label:"SLA",value:`${detail.sla_hours}h expected`},
              ].map(item=>(
                <div key={item.label} className="rounded-xl p-3" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  <p className="text-slate-500 text-xs mb-0.5">{item.label}</p>
                  <p className={`text-slate-200 font-medium text-sm ${item.cap?"capitalize":""}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Admin Status Update */}
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {["pending","in_progress","resolved","rejected"].map((s) => {
                  const active = detail.status === s;
                  const colors = {pending:"#eab308",in_progress:"#60a5fa",resolved:"#10b981",rejected:"#ef4444"};
                  return (
                    <button key={s}
                      onClick={async () => { await handleStatusChange(detail.id, s); setDetail({...detail,status:s}); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                      style={active
                        ? {background:`${colors[s]}22`,border:`1px solid ${colors[s]}`,color:colors[s]}
                        : {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#64748b"}}>
                      {s.replace("_"," ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
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
                        <p className="text-xs text-slate-500">
                          {formatDate(t.created_at)}{t.actor_name ? ` · ${t.actor_name}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Delete"
        size="sm"
      >
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete this issue? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteId(null)}
            style={{padding:"0.5rem 1.25rem",borderRadius:"0.75rem",border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:"0.875rem",fontWeight:500}}
            onMouseEnter={e=>e.currentTarget.style.color="#f1f5f9"}
            onMouseLeave={e=>e.currentTarget.style.color="#94a3b8"}>
            Cancel
          </button>
          <button onClick={handleDelete}
            style={{padding:"0.5rem 1.25rem",borderRadius:"0.75rem",border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",cursor:"pointer",fontSize:"0.875rem",fontWeight:600}}>
            Delete Issue
          </button>
        </div>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        open={!!imageModal}
        onClose={() => setImageModal(null)}
        title="Image Preview"
        size="xl"
      >
        {imageModal && (
          <img
            src={imageModal}
            alt="Full resolution"
            className="w-full rounded-lg"
          />
        )}
      </Modal>
    </div>
  );
}
