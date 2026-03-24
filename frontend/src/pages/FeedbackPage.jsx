import { useEffect, useState, useCallback } from "react";
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
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});

  const loadItems = useCallback(async () => {
    setLoading(true);
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
    } catch {
      toast.error("Failed to load feedback items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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
    <div className="animated-bg min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Issue Feedback</h1>
          <p className="text-slate-600">
            Tell us whether your reported issue was solved properly, and share any additional comments.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-14 text-slate-600">
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-700/25 border-t-blue-700 rounded-full animate-spin" />
            Loading feedback items...
          </div>
        ) : items.length === 0 ? (
          <div className="glass-strong rounded-2xl p-6 text-slate-600 border border-slate-300/80">
            No resolved or rejected issues yet. Feedback will appear here once your issue is closed.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {items.map((item) => {
              const form = forms[item.id] || { is_satisfied: null, rating: "", comment: "" };
              const submitted = Boolean(item.feedback_id);
              return (
                <div
                  key={item.id}
                  className="glass-strong rounded-2xl p-5 border border-slate-300/80 backdrop-blur-xl"
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

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Was the issue solved properly?</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => updateForm(item.id, { is_satisfied: true })}
                          className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                          style={form.is_satisfied === true
                            ? { background: "rgba(16,185,129,0.18)", color: "#34d399", border: "1px solid rgba(16,185,129,0.5)" }
                            : { background: "rgba(255,255,255,0.96)", color: "#475569", border: "1px solid rgba(15,61,145,0.14)" }}
                        >
                          <CheckCircle2 size={15} /> Yes, solved well
                        </button>
                        <button
                          type="button"
                          onClick={() => updateForm(item.id, { is_satisfied: false })}
                          className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                          style={form.is_satisfied === false
                            ? { background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.5)" }
                            : { background: "rgba(255,255,255,0.96)", color: "#475569", border: "1px solid rgba(15,61,145,0.14)" }}
                        >
                          <XCircle size={15} /> No, not solved properly
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Star size={15} className="text-amber-400" /> Rating (optional)
                      </label>
                      <select
                        value={form.rating}
                        onChange={(e) => updateForm(item.id, { rating: e.target.value })}
                        className="w-full md:w-52 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 border border-slate-300"
                      >
                        <option value="">Select rating</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Very Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <MessageSquare size={15} className="text-cyan-400" /> Additional comments
                      </label>
                      <textarea
                        rows={3}
                        value={form.comment}
                        onChange={(e) => updateForm(item.id, { comment: e.target.value })}
                        placeholder="Share what was good, what was missed, or what should improve..."
                        className="w-full rounded-xl px-3 py-2 text-sm bg-white text-slate-800 border border-slate-300 resize-y"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitFeedback(item.id)}
                        disabled={savingId === item.id}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                        style={{
                          background: "linear-gradient(135deg,#0f3d91,#1c5bbf)",
                          opacity: savingId === item.id ? 0.6 : 1,
                        }}
                      >
                        {savingId === item.id ? <RefreshCcw size={15} className="animate-spin" /> : <Send size={15} />}
                        {submitted ? "Update Feedback" : "Submit Feedback"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
