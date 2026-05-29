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
  const [tab, setTab]                 = useState<"editor" | "review">("editor");

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => { if (user) loadHistory(); }, [user]);

  async function loadHistory() {
    const { data } = await supabase
      .from("reviews").select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }).limit(10);
    if (data) setHistory(data);
  }

  async function saveReview(reviewText: string) {
    if (!user) return;
    await supabase.from("reviews").insert({
      user_id: user.id, code, language: lang, review: reviewText,
    });
    loadHistory();
  }

  async function handleReview() {
    if (!code.trim() || loading) return;
    setLoading(true); setReview(""); setError("");
    setTab("review");
    let full = "";
    try {
      const res = await fetch(`${BACKEND}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setReview(prev => prev + chunk);
      }
      await saveReview(full);
    } catch {
      setError("Backend se connect nahi ho pa raha. Dobara try karo.");
      setTab("editor");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-4 py-3 flex
                      items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex
                          items-center justify-center text-white text-xs
                          font-medium">AI</div>
          <span className="text-white font-medium text-sm">
            CodeReviewer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-gray-400
                       hover:text-white border border-gray-700
                       hover:border-gray-500 px-3 py-1.5 rounded-lg
                       transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            History
          </button>
          <UserButton />
        </div>
      </nav>

      {/* History Drawer */}
      {showHistory && (
        <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
          <p className="text-xs font-medium text-gray-400 mb-2">
            Recent Reviews
          </p>
          {history.length === 0 ? (
            <p className="text-xs text-gray-600">Koi review nahi abhi tak</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {history.map(h => (
                <button key={h.id}
                  onClick={() => {
                    setCode(h.code); setLang(h.language);
                    setReview(h.review); setShowHistory(false);
                    setTab("review");
                  }}
                  className="flex items-center justify-between w-full
                             text-left px-3 py-2 rounded-lg bg-gray-800
                             hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs bg-blue-900/60 text-blue-300
                                     px-2 py-0.5 rounded shrink-0">
                      {h.language}
                    </span>
                    <span className="text-xs text-gray-300 truncate">
                      {h.code.slice(0, 50)}...
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0 ml-2">
                    {new Date(h.created_at).toLocaleDateString("en-IN")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="flex lg:hidden border-b border-gray-800 shrink-0">
        <button
          onClick={() => setTab("editor")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors
            ${tab === "editor"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-500"}`}
        >Code Editor</button>
        <button
          onClick={() => setTab("review")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors
            ${tab === "review"
              ? "text-white border-b-2 border-blue-500"
              : "text-gray-500"}`}
        >AI Review {review && "✓"}</button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Code Editor */}
        <div className={`flex flex-col w-full lg:w-1/2 lg:border-r
                         border-gray-800 shrink-0
                         ${tab === "review" ? "hidden lg:flex" : "flex"}`}>

          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2.5
                          border-b border-gray-800 shrink-0">
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="bg-gray-800 text-white text-xs border border-gray-700
                         rounded-md px-2 py-1 outline-none
                         focus:border-blue-500">
              {LANGUAGES.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button onClick={() => setCode("")}
              className="text-xs text-gray-500 hover:text-gray-300
                         transition-colors">
              Clear
            </button>
          </div>

          {/* Textarea */}
          <textarea value={code} onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-gray-950 text-gray-100 font-mono text-sm
                       p-4 resize-none outline-none leading-relaxed
                       placeholder-gray-700 min-h-64"
            placeholder="Yahan apna code paste karo..."
          />

          {/* Review Button */}
          <div className="p-3 border-t border-gray-800 shrink-0">
            {error && (
              <p className="text-xs text-red-400 bg-red-950/30
                            border border-red-900/50 rounded-lg px-3
                            py-2 mb-2">{error}</p>
            )}
            <button onClick={handleReview}
              disabled={loading || !code.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-white rounded-lg text-sm font-medium
                         transition-colors flex items-center
                         justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30
                                   border-t-white rounded-full
                                   animate-spin"/>
                  Reviewing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none"
                       stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Review my code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right — Review Output */}
        <div className={`flex flex-col w-full lg:w-1/2
                         ${tab === "editor" ? "hidden lg:flex" : "flex"}`}>
          <div className="flex items-center justify-between px-4 py-2.5
                          border-b border-gray-800 shrink-0">
            <span className="text-xs text-gray-400 font-medium">
              AI Review
            </span>
            {review && (
              <button onClick={() => { setReview(""); setTab("editor"); }}
                className="text-xs text-gray-500 hover:text-gray-300
                           transition-colors">
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {review ? (
              <div className="prose prose-invert prose-sm max-w-none
                              prose-headings:text-blue-400
                              prose-headings:font-medium
                              prose-code:bg-gray-800 prose-code:px-1.5
                              prose-code:py-0.5 prose-code:rounded
                              prose-code:text-xs prose-pre:bg-gray-800
                              prose-pre:border prose-pre:border-gray-700">
                <ReactMarkdown>{review}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center
                              text-center p-8">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gray-800
                                  flex items-center justify-center
                                  mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">
                    {loading
                      ? "Review aa rahi hai..."
                      : "Code paste karo aur Review dabao"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}