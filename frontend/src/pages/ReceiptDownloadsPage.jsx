import { useEffect, useState } from "react";
import api from "../api/axios";
import { Download, FileText, Search } from "lucide-react";
import toast from "react-hot-toast";

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReceiptDownloadsPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      try {
        const res = await api.get("/issues");
        setIssues(res.data || []);
      } catch {
        toast.error("Failed to load issues");
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, []);

  const handleDownload = async (issue) => {
    setDownloadingId(issue.id);
    try {
      const res = await api.get(`/issues/${issue.id}/receipt`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `issue-receipt-${issue.issue_token || issue.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to download receipt");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = issues.filter((issue) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      issue.title?.toLowerCase().includes(q) ||
      issue.category?.toLowerCase().includes(q) ||
      issue.status?.toLowerCase().includes(q) ||
      issue.issue_token?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animated-bg min-h-screen relative">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold gradient-text">Receipt Downloads</h1>
          <p className="text-slate-500 text-sm mt-1">Download issue receipts in PDF format.</p>
        </div>

        <div className="glass-strong rounded-2xl p-4 mb-5">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, category, token..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm text-slate-700 outline-none"
              style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(15,61,145,0.18)" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="glass-strong rounded-2xl p-10 text-center text-slate-500">Loading receipts...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-strong rounded-2xl p-10 text-center text-slate-500">No issues found for receipt download.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((issue) => (
              <div
                key={issue.id}
                className="glass rounded-2xl p-4 flex items-center justify-between gap-4"
                style={{ border: "1px solid rgba(15,61,145,0.14)" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={15} className="text-slate-500" />
                    <p className="text-sm font-semibold text-slate-800 truncate">{issue.title}</p>
                  </div>
                  <p className="text-xs text-slate-600 mb-0.5">Token: {issue.issue_token || `ISSUE-${issue.id}`}</p>
                  <p className="text-xs text-slate-500">
                    {issue.category?.replace("_", " ")} | {issue.status?.replace("_", " ")} | {formatDateTime(issue.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(issue)}
                  disabled={downloadingId === issue.id}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  style={{
                    background: "rgba(15,61,145,0.1)",
                    border: "1px solid rgba(15,61,145,0.2)",
                    color: "#0f3d91",
                    opacity: downloadingId === issue.id ? 0.7 : 1,
                  }}
                >
                  <Download size={14} /> {downloadingId === issue.id ? "Downloading..." : "Download Receipt"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
