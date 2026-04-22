import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
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
    <div className="min-h-screen relative bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40">
      <div className="relative z-10 w-full px-4 py-6 md:px-6">
        <Card className="overflow-hidden border border-slate-200/70 mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge variant="resolved">Citizen receipts</Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Receipt Downloads</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">Download issue receipts in PDF format.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Ready</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Find a receipt and download it instantly.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 p-4 mb-5">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, category, token..."
              aria-label="Search receipts by issue title, category, or token"
              className="pl-9"
            />
          </div>
          <p className="mt-3 text-xs text-slate-500" aria-live="polite">Showing {filtered.length} issue{filtered.length === 1 ? "" : "s"} matching your search.</p>
        </Card>

        {loading ? (
          <Card className="border border-slate-200/70 p-10 text-center text-slate-500" role="status" aria-live="polite">Loading receipts...</Card>
        ) : filtered.length === 0 ? (
          <Card className="border border-slate-200/70 p-10 text-center text-slate-500">No issues found for receipt download. Try a different title, token, or category keyword.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((issue) => (
              <Card key={issue.id} className="border border-slate-200/70 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={15} className="text-slate-500" />
                    <p className="text-sm font-semibold text-slate-900 truncate">{issue.title}</p>
                  </div>
                  <p className="text-xs text-slate-600 mb-0.5">Token: {issue.issue_token || `ISSUE-${issue.id}`}</p>
                  <p className="text-xs text-slate-500">
                    {issue.category?.replace("_", " ")} | {issue.status?.replace("_", " ")} | {formatDateTime(issue.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(issue)}
                  disabled={downloadingId === issue.id}
                  aria-label={downloadingId === issue.id ? `Downloading receipt for ${issue.title}` : `Download receipt for ${issue.title}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={14} /> {downloadingId === issue.id ? "Downloading..." : "Download Receipt"}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
