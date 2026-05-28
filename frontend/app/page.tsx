"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { UserButton, useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

const LANGUAGES = [
  "python","javascript","typescript",
  "java","go","rust","cpp","sql","php"
];

const SAMPLE_CODE = `def get_user(id):
    query = "SELECT * FROM users WHERE id=" + str(id)
    result = db.execute(query)
    return result`;

type Review = {
  id: string;
  code: string;
  language: string;
  review: string;
  created_at: string;
};

export default function Home() {
  const { user } = useUser();
  const [code, setCode]               = useState(SAMPLE_CODE);
  const [lang, setLang]               = useState("python");
  const [review, setReview]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [history, setHistory]         = useState<Review[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  async function loadHistory() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  }

  async function saveReview(reviewText: string) {
    if (!user) return;
    await supabase.from("reviews").insert({
      user_id: user.id,
      code,
      language: lang,
      review: reviewText,
    });
    loadHistory();
  }

  async function handleReview() {
    if (!code.trim() || loading) return;
    setLoading(true);
    setReview("");
    setError("");
    let fullReview = "";

    try {
      const res = await fetch(`${BACKEND}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang }),
      });

      if (!res.ok) throw new Error("Backend error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullReview += chunk;
        setReview((prev) => prev + chunk);
      }

      await saveReview(fullReview);

    } catch {
      setError("❌ Error! Backend chal raha hai?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              AI Code Reviewer
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Python FastAPI + React + Groq AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-gray-400 hover:text-white
                         border border-gray-700 px-3 py-1.5
                         rounded-lg transition-colors"
            >
              {showHistory ? "Hide History" : "My History"}
            </button>
            <UserButton />
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="mb-6 bg-gray-900 border border-gray-700
                          rounded-xl p-4">
            <h2 className="text-sm font-medium text-white mb-3">
              Past Reviews
            </h2>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Koi review nahi abhi tak
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setCode(h.code);
                      setLang(h.language);
                      setReview(h.review);
                      setShowHistory(false);
                    }}
                    className="flex items-center justify-between
                               p-3 bg-gray-800 rounded-lg cursor-pointer
                               hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs bg-blue-900 text-blue-300
                                       px-2 py-0.5 rounded mr-2">
                        {h.language}
                      </span>
                      <span className="text-sm text-gray-300">
                        {h.code.slice(0, 40)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(h.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Your code</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-gray-800 text-white text-sm border
                           border-gray-700 rounded-lg px-3 py-1.5
                           outline-none focus:border-blue-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              rows={16}
              className="w-full bg-gray-900 border border-gray-700
                         rounded-xl p-4 font-mono text-sm text-gray-100
                         resize-none outline-none focus:border-blue-500
                         leading-relaxed"
              placeholder="Yahan apna code paste karo..."
            />
            <button
              onClick={handleReview}
              disabled={loading || !code.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-white rounded-xl text-sm font-medium
                         transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30
                                   border-t-white rounded-full animate-spin"/>
                  AI review kar raha hai...
                </span>
              ) : "Review my code →"}
            </button>
            {error && (
              <p className="text-red-400 text-sm bg-red-950/40
                            border border-red-900 rounded-lg p-3">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm text-gray-400">AI Review</label>
            <div className="h-[430px] overflow-y-auto bg-gray-900
                            border border-gray-700 rounded-xl p-5">
              {review ? (
                <div className="prose prose-invert prose-sm max-w-none
                                prose-headings:text-blue-400
                                prose-code:bg-gray-800
                                prose-code:px-1.5 prose-code:py-0.5
                                prose-code:rounded">
                  <ReactMarkdown>{review}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex items-center
                                justify-center text-center">
                  <div>
                    <div className="text-4xl mb-3">
                      {loading ? "⏳" : "✨"}
                    </div>
                    <p className="text-gray-500 text-sm">
                      {loading
                        ? "Review aa rahi hai..."
                        : "Code paste karo aur button dabao"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {review && (
              <button
                onClick={() => setReview("")}
                className="text-xs text-gray-600 hover:text-gray-400
                           w-full text-center transition-colors"
              >
                Clear review
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}