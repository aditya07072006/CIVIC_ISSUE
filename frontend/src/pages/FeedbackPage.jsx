import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input, Select, Textarea } from "../components/ui/Input";
import { CheckCircle2, XCircle, MessageSquare, Star, Send, RefreshCcw } from "lucide-react";
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
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FeedbackPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.get("/issues/feedback/my");
      setItems(res.data);
      const initial = {};
      for (const row of res.data) {
        initial[row.id] = {
          is_satisfied: typeof row.is_satisfied === "boolean" ? row.is_satisfied : null,
          rating: row.rating || "",
          comment: row.comment || "",
        };
      }
      setForms(initial);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to load feedback items";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(item.title || "").toLowerCase().includes(q)
        || String(item.category || "").toLowerCase().includes(q)
        || String(item.comment || "").toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const updateForm = (issueId, patch) => {
    setForms((prev) => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        ...patch,
      },
    }));
  };

  const submitFeedback = async (issueId) => {
    const form = forms[issueId] || {};
    if (typeof form.is_satisfied !== "boolean") {
      toast.error("Please select whether the issue was solved properly.");
      return;
    }

    setSavingId(issueId);
    try {
      await api.post(`/issues/${issueId}/feedback`, {
        is_satisfied: form.is_satisfied,
        rating: form.rating ? Number(form.rating) : null,
        comment: form.comment || "",
      });
      toast.success("Feedback submitted");
      await loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit feedback");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40 p-4 md:p-6">
      <div className="w-full">
        <Card className="overflow-hidden border border-slate-200/70 mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="space-y-3">
              <Badge variant="resolved">Citizen feedback</Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Issue Feedback</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Tell us whether your reported issue was solved properly, and share any additional comments.
              </p>
            </div>
          </div>
        </Card>

        {!loading && items.length > 0 && (
          <Card className="border border-slate-200/70 p-4 mb-5 flex flex-col md:flex-row gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by issue title or category"
              className="flex-1"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="md:w-48"
            >
              <option value="">All statuses</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </Select>
            <button
              type="button"
              onClick={loadItems}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              Refresh
            </button>
          </Card>
        )}

        {!loading && errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <Card className="border border-slate-200/70 p-8 text-center text-slate-600">
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-700/25 border-t-blue-700 rounded-full animate-spin" />
            Loading feedback items...
          </Card>
        ) : items.length === 0 ? (
          <Card className="border border-slate-200/70 p-6 text-slate-600">
            No resolved or rejected issues yet. Feedback will appear here once your issue is closed.
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border border-slate-200/70 p-6 text-slate-600">
            No feedback entries match your current filters.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredItems.map((item) => {
              const form = forms[item.id] || { is_satisfied: null, rating: "", comment: "" };
              const submitted = Boolean(item.feedback_id);
              const canSubmitFeedback = item.status === "resolved" || item.status === "rejected";
              return (
                <Card
                  key={item.id}
                  className="border border-slate-200/70 p-5"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Issue #{item.id}</p>
                      <h3 className="text-lg font-semibold text-slate-800">{item.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {CATEGORY_LABELS[item.category] || item.category} • {item.severity} • {item.status.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">Updated: {formatDate(item.updated_at)}</div>
                  </div>

                  {submitted && (
                    <div className="mb-4 rounded-xl p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
                      Feedback already submitted on {formatDate(item.feedback_at)}. You can update it anytime.
                    </div>
                  )}

                  {!canSubmitFeedback && (
                    <div className="mb-4 rounded-xl p-3 border border-amber-500/30 bg-amber-500/10 text-amber-700 text-sm">
                      Feedback is available after this issue is marked as resolved or rejected.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Was the issue solved properly?</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => updateForm(item.id, { is_satisfied: true })}
                          disabled={!canSubmitFeedback}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${form.is_satisfied === true ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-white text-slate-700"}`}
                        >
                          <CheckCircle2 size={15} /> Yes, solved well
                        </button>
                        <button
                          type="button"
                          onClick={() => updateForm(item.id, { is_satisfied: false })}
                          disabled={!canSubmitFeedback}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${form.is_satisfied === false ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-slate-200 bg-white text-slate-700"}`}
                        >
                          <XCircle size={15} /> No, not solved properly
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Star size={15} className="text-amber-400" /> Rating (optional)
                      </label>
                      <Select
                        value={form.rating}
                        onChange={(e) => updateForm(item.id, { rating: e.target.value })}
                        disabled={!canSubmitFeedback}
                        className="md:w-52"
                      >
                        <option value="">Select rating</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Very Poor</option>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <MessageSquare size={15} className="text-cyan-400" /> Additional comments
                      </label>
                      <Textarea
                        rows={3}
                        value={form.comment}
                        onChange={(e) => updateForm(item.id, { comment: e.target.value })}
                        disabled={!canSubmitFeedback}
                        placeholder="Share what was good, what was missed, or what should improve..."
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitFeedback(item.id)}
                        disabled={savingId === item.id || !canSubmitFeedback}
                        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === item.id ? <RefreshCcw size={15} className="animate-spin" /> : <Send size={15} />}
                        {submitted ? "Update Feedback" : "Submit Feedback"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
