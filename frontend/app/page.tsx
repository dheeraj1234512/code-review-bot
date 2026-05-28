"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { UserButton } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

const LANGUAGES = [
  "python", "javascript", "typescript",
  "java", "go", "rust", "cpp", "sql", "php"
];

const SAMPLE_CODE = `def get_user(id):
    query = "SELECT * FROM users WHERE id=" + str(id)
    result = db.execute(query)
    return result`;

export default function Home() {
  const [code, setCode]       = useState(SAMPLE_CODE);
  const [lang, setLang]       = useState("python");
  const [review, setReview]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  async function handleReview() {
    if (!code.trim() || loading) return;
    setLoading(true);
    setReview("");
    setError("");

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
        setReview((prev) => prev + decoder.decode(value));
      }
    } catch {
      setError("❌ Error! Backend is not running? Check the terminal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Power AI
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Code Reviewer
            </p>
          </div>
          <UserButton />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Left Panel — Code Input */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">
                Your Code
              </label>
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
              placeholder="Paste your code here..."
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
                                   border-t-white rounded-full
                                   animate-spin" />
                  AI is reviewing...
                </span>
              ) : (
                "Review My Code →"
              )}
            </button>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40
                            border border-red-900 rounded-lg p-3">
                {error}
              </p>
            )}
          </div>

          {/* Right Panel — AI Review Output */}
          <div className="flex flex-col gap-3">
            <label className="text-sm text-gray-400">
              AI Review
            </label>
            <div className="h-107.5 overflow-y-auto bg-gray-900
                            border border-gray-700 rounded-xl p-5">
              {review ? (
                <div className="prose prose-invert prose-sm max-w-none
                                prose-headings:text-blue-400
                                prose-code:bg-gray-800
                                prose-code:px-1.5 prose-code:py-0.5
                                prose-code:rounded prose-code:text-xs">
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
                        ? "AI is reviewing..."
                        : "Paste your code and click 'Review My Code'"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {review && (
              <button
                onClick={() => setReview("")}
                className="text-xs text-gray-600
                           hover:text-gray-400 transition-colors
                           w-full text-center"
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
