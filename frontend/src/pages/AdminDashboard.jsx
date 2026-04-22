import { useEffect, useState } from "react";
import api from "../api/axios";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  Trash2,
  FileText,
  Loader,
  ArrowUpRight,
  ShieldCheck,
  BarChart3,
  Layers3,
} from "lucide-react";
import toast from "react-hot-toast";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
);

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
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const totalResolved = stats?.by_status?.resolved || 0;
  const totalIssues = stats?.total || 0;
  const resolutionRate = totalIssues ? Math.round((totalResolved / totalIssues) * 100) : 0;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, trendRes] = await Promise.all([
          api.get("/issues/analytics/stats"),
          api.get("/issues/analytics/trend"),
        ]);
        setStats(statsRes.data);
        setTrend(trendRes.data || []);
      } catch {
        toast.error("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const doughnutData = {
    labels: ["Pending", "In Progress", "Resolved", "Rejected"],
    datasets: [
      {
        data: [
          stats?.by_status?.pending || 0,
          stats?.by_status?.in_progress || 0,
          stats?.by_status?.resolved || 0,
          stats?.by_status?.rejected || 0,
        ],
        backgroundColor: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: Object.keys(stats?.by_category || {}).map((key) => CATEGORY_LABELS[key] || key),
    datasets: [
      {
        label: "Issues",
        data: Object.values(stats?.by_category || {}),
        backgroundColor: "#4f46e5",
        borderRadius: 8,
      },
    ],
  };

  const lineData = {
    labels: trend.map((d) => new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [
      {
        label: "Issues Reported",
        data: trend.map((d) => d.count),
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6, 182, 212, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  const navigationCards = [
    {
      href: "/all-issues",
      title: "All Issues",
      description: "Review every issue across all departments.",
      icon: LayoutDashboard,
      accent: "from-blue-500 to-cyan-500",
      tone: "border-blue-200/70 bg-blue-50/80",
    },
    {
      href: "/department",
      title: "Departments",
      description: "Open the department and sub-department console.",
      icon: FolderOpen,
      accent: "from-violet-500 to-fuchsia-500",
      tone: "border-violet-200/70 bg-violet-50/80",
    },
    {
      href: "/admin-feedback",
      title: "Feedback",
      description: "Track citizen feedback and responses.",
      icon: MessageSquare,
      accent: "from-emerald-500 to-teal-500",
      tone: "border-emerald-200/70 bg-emerald-50/80",
    },
    {
      href: "/deleted",
      title: "Deleted Issues",
      description: "Inspect soft-deleted records and cleanup history.",
      icon: Trash2,
      accent: "from-rose-500 to-red-500",
      tone: "border-rose-200/70 bg-rose-50/80",
    },
  ];

  const severityEntries = Object.entries(stats?.by_severity || {});

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-strong flex items-center gap-3 rounded-2xl px-6 py-4 text-slate-700">
          <Loader className="animate-spin" size={20} />
          Loading dashboard metrics...
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
                  <Badge variant="resolved">Admin operations</Badge>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                    <ShieldCheck size={14} />
                    Live issue control center
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    Admin Dashboard
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    Monitor the portal at a glance, review status movement, and jump straight into the
                    department, feedback, or deleted issue workflows.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-105">
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{totalIssues}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Resolved</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{totalResolved}</p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Active</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-600">
                    {(stats?.by_status?.pending || 0) + (stats?.by_status?.in_progress || 0)}
                  </p>
                </div>
                <div className="glass-strong rounded-2xl border border-white/70 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{resolutionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Issues</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{totalIssues}</p>
                <p className="mt-2 text-sm text-slate-500">All active civic reports tracked in one place.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-100">
                <FileText size={22} />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{stats?.by_status?.pending || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Awaiting assignment or inspection.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 ring-1 ring-inset ring-amber-100">
                <LayoutDashboard size={22} />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">In Progress</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">{stats?.by_status?.in_progress || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Currently being worked on by staff.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Loader size={22} className="animate-spin" />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200/70 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Resolved</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">{totalResolved}</p>
                <p className="mt-2 text-sm text-slate-500">Closed cases contributing to the service rate.</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <Badge variant="resolved">OK</Badge>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden border border-slate-200/70">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Quick Navigation</h2>
              <p className="mt-1 text-sm text-slate-500">Jump into the main admin workflows.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm sm:flex">
              <ArrowUpRight size={14} />
              Core sections
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            {navigationCards.map((card) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.href}
                  href={card.href}
                  className={`group rounded-3xl border ${card.tone} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`rounded-2xl bg-linear-to-br ${card.accent} p-3 text-white shadow-lg shadow-slate-900/10`}>
                      <Icon size={22} />
                    </div>
                    <ArrowUpRight className="text-slate-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={18} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </a>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card className="overflow-hidden border border-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Status Distribution</h3>
                <p className="mt-1 text-sm text-slate-500">How cases are moving across the workflow.</p>
              </div>
              <Badge variant="pending">Live</Badge>
            </div>
            <div className="p-6">
              <div className="h-80">
                <Doughnut
                  data={doughnutData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 10 } },
                    },
                    cutout: "64%",
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border border-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Issues by Category</h3>
                <p className="mt-1 text-sm text-slate-500">Category load across the portal.</p>
              </div>
              <Badge variant="resolved">Analytics</Badge>
            </div>
            <div className="p-6">
              <div className="h-80">
                <Bar
                  data={barData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148, 163, 184, 0.18)" } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden border border-slate-200/70">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Issues Reported - Last 30 Days</h3>
              <p className="mt-1 text-sm text-slate-500">Recent activity trend across the system.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <BarChart3 size={14} />
              Rolling 30 days
            </div>
          </div>
          <div className="p-6">
            <div className="h-80">
              <Line
                data={lineData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148, 163, 184, 0.18)" } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </Card>

        {severityEntries.length > 0 && (
          <Card className="border border-slate-200/70 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Issues by Severity</h3>
                <p className="mt-1 text-sm text-slate-500">Severity mix for prioritization and triage.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                <Layers3 size={14} />
                Priority view
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {severityEntries.map(([severity, count]) => (
                <div key={severity} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{severity}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{count}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
