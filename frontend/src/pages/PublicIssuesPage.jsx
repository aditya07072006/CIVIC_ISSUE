import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ThumbsUp, Star, MapPin, RefreshCcw } from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import toast from "react-hot-toast";
import api from "../api/axios";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PublicIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
    sort_by: "newest",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status: filters.status,
        category: filters.category,
        search: filters.search,
        sort_by: filters.sort_by,
      };

      const [listRes, statsRes] = await Promise.all([
        api.get("/issues/public/list", { params }),
        api.get("/issues/public/stats"),
      ]);

      setIssues(listRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load public issues");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolvedVsUnresolved = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ["Resolved", "Unresolved"],
      datasets: [
        {
          data: [stats.resolved || 0, stats.unresolved || 0],
          backgroundColor: ["#10b981", "#f59e0b"],
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  const categoryChart = useMemo(() => {
    if (!stats?.by_category) return null;
    const labels = Object.keys(stats.by_category).map((k) => CATEGORY_LABELS[k] || k);
    const values = Object.values(stats.by_category);
    return {
      labels,
      datasets: [
        {
          label: "Issues",
          data: values,
          backgroundColor: "rgba(34,211,238,0.65)",
          borderRadius: 10,
        },
      ],
    };
  }, [stats]);

  const severityChart = useMemo(() => {
    if (!stats?.by_severity) return null;
    const ordered = ["low", "medium", "high", "critical"];
    return {
      labels: ordered.map((s) => s[0].toUpperCase() + s.slice(1)),
      datasets: [
        {
          label: "Severity Count",
          data: ordered.map((s) => stats.by_severity[s] || 0),
          backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
          borderRadius: 10,
        },
      ],
    };
  }, [stats]);

  return (
    <div className="animated-bg min-h-screen relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{ position: "absolute", top: "5%", right: "8%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(15,61,145,0.08),transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "12%", left: "6%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.08),transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-blue-700 text-xs font-semibold tracking-wide uppercase mb-2">Community Intelligence</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Public Issues & City Pulse</h1>
            <p className="text-slate-600 text-sm md:text-base">Explore all city issues, resolution quality, and trends in one place.</p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-700 border border-blue-700/30 bg-blue-700/10 hover:bg-blue-700/15 transition-all"
          >
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <div className="glass-strong rounded-2xl p-4 border border-blue-700/20">
            <p className="text-xs text-slate-600">Total Issues</p>
            <p className="text-2xl font-bold text-blue-700">{stats?.total ?? 0}</p>
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-emerald-500/25">
            <p className="text-xs text-slate-600">Resolved</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.resolved ?? 0}</p>
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-amber-500/25">
            <p className="text-xs text-slate-600">Unresolved</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.unresolved ?? 0}</p>
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-purple-500/25">
            <p className="text-xs text-slate-600">Avg Rating</p>
            <p className="text-2xl font-bold text-purple-700">{stats?.avg_rating ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-7">
          <div className="glass-strong rounded-2xl p-4 border border-slate-300/80 backdrop-blur-xl">
            <p className="text-sm font-semibold text-slate-700 mb-3">Resolution Split</p>
            {resolvedVsUnresolved && <Doughnut data={resolvedVsUnresolved} />}
          </div>
          <div className="glass-strong rounded-2xl p-4 border border-slate-300/80 backdrop-blur-xl xl:col-span-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">Category Distribution</p>
            {categoryChart && <Bar data={categoryChart} options={{ plugins: { legend: { display: false } } }} />}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-4 border border-slate-300/80 backdrop-blur-xl mb-7">
          <p className="text-sm font-semibold text-slate-700 mb-3">Severity Breakdown</p>
          {severityChart && <Bar data={severityChart} options={{ plugins: { legend: { display: false } } }} />}
        </div>

        <div className="glass-strong rounded-2xl p-5 border border-slate-300/80 backdrop-blur-xl mb-6">
          <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium text-sm">
            <SlidersHorizontal size={15} /> Smart Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search title, description, address..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-800/60 border border-slate-600/40 text-slate-100"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="py-2.5 px-3 rounded-xl text-sm bg-slate-800/60 border border-slate-600/40 text-slate-100"
            >
              <option value="">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="py-2.5 px-3 rounded-xl text-sm bg-slate-800/60 border border-slate-600/40 text-slate-100"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value }))}
              className="py-2.5 px-3 rounded-xl text-sm bg-slate-800/60 border border-slate-600/40 text-slate-100 md:col-start-4"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="most_upvoted">Sort: Most Upvoted</option>
              <option value="rating_high">Sort: Rating High to Low</option>
              <option value="rating_low">Sort: Rating Low to High</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-14 text-slate-600">Loading public issues...</div>
        ) : issues.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center border border-slate-300/80 text-slate-600">
            No issues matched your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {issues.map((issue) => (
              <div key={issue.id} className="glass rounded-2xl p-4 border border-slate-300/80 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                  <h3 className="text-slate-800 font-semibold">#{issue.id} {issue.title}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-lg border border-slate-300 text-slate-700 capitalize">{issue.status.replace("_", " ")}</span>
                    <span className="px-2 py-1 rounded-lg border border-slate-300 text-slate-700 capitalize">{issue.severity}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{issue.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="capitalize">{CATEGORY_LABELS[issue.category] || issue.category}</span>
                  <span>Reporter: {issue.reporter_name}</span>
                  <span>Posted: {formatDate(issue.created_at)}</span>
                  <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {issue.upvote_count || 0}</span>
                  <span className="inline-flex items-center gap-1 text-amber-700"><Star size={12} /> {issue.avg_rating ? issue.avg_rating.toFixed(1) : "No rating"}</span>
                  {issue.address && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {issue.address}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
