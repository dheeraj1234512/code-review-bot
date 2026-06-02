"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { UserButton, useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import jsPDF from "jspdf";


function CodeBlock({ children, className }: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group my-3">
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                   transition-opacity px-2 py-1 text-xs rounded
                   bg-gray-700 hover:bg-gray-600 text-gray-300
                   border border-gray-600 z-10"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-gray-800 border border-gray-700 rounded-lg
                      p-4 overflow-x-auto text-sm leading-relaxed">
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
}
const LANGUAGES = [
  "python","javascript","typescript",
  "java","go","rust","cpp","sql","php"
];

const SAMPLE_CODE = `function generateFibonacci(terms) {
    let series = [0, 1];
    if (terms <= 1) return series.slice(0, terms);
    
    for (let i = 2; i < terms; i++) {
        series.push(series[i - 1] + series[i - 2]);
    }
    return series;
}

console.log(generateFibonacci(8));`;

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
  const [fileName, setFileName] = useState<string | null>(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  // File extension se language detect karo
function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    py: "python", js: "javascript", ts: "typescript",
    jsx: "javascript", tsx: "typescript", java: "java",
    go: "go", rs: "rust", cpp: "cpp", cc: "cpp",
    sql: "sql", php: "php", rb: "ruby",
  };
  return map[ext || ""] || "javascript";
}

// File upload handler
function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Sirf code files allow karo
  const allowed = [
    ".py",".js",".ts",".jsx",".tsx",".java",
    ".go",".rs",".cpp",".cc",".sql",".php",".rb"
  ];
  const isAllowed = allowed.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isAllowed) {
    alert("Sirf code files upload karo (.py, .js, .ts, .java etc.)");
    return;
  }

  if (file.size > 100 * 1024) { // 100KB limit
    alert("File bahut badi hai — 100KB se chhoti file upload karo");
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    const content = ev.target?.result as string;
    setCode(content);
    setLang(detectLanguage(file.name));
    setFileName(file.name);
    setReview("");
  };
  reader.readAsText(file);

  // Input reset karo taaki same file dobara upload ho sake
  e.target.value = "";
}

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
  function downloadPDF() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxW = pageW - margin * 2;
  let y = 20;

  // Header
  doc.setFillColor(37, 99, 235); // blue
  doc.rect(0, 0, pageW, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("AI Code Reviewer — Review Report", margin, 8);

  // Date
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  doc.text(date, pageW - margin, 8, { align: "right" });

  y = 22;

  // Language badge
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, 30, 7, 2, 2, "FD");
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(lang.toUpperCase(), margin + 15, y + 4.5, { align: "center" });

  y += 12;

  // Code section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Submitted Code", margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  const codeLines = doc.splitTextToSize(code, maxW - 6);
  const codeH = codeLines.length * 4.2 + 6;
  doc.roundedRect(margin, y, maxW, Math.min(codeH, 60), 2, 2, "FD");
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.setFont("courier", "normal");

  // Code — max 14 lines dikhao
  const shownCode = codeLines.slice(0, 14);
  shownCode.forEach((line: string, i: number) => {
    doc.text(line, margin + 3, y + 5 + i * 4.2);
  });
  if (codeLines.length > 14) {
    doc.setTextColor(100, 116, 139);
    doc.text(`... aur ${codeLines.length - 14} lines`, margin + 3, y + 5 + 14 * 4.2);
  }
  y += Math.min(codeH, 65);

  // Review section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("AI Review", margin, y + 4);
  y += 10;

  // Review text — markdown clean karo
  const cleanReview = review
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, "[code block]")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^\s*[-*]\s/gm, "• ");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const reviewLines = doc.splitTextToSize(cleanReview, maxW);
  const pageH = doc.internal.pageSize.getHeight();

  reviewLines.forEach((line: string) => {
    if (y > pageH - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y);
    y += 5;
  });

  // Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageH - 10, pageW, 10, "F");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text("Generated by AI CodeReviewer", margin, pageH - 4);

  // Save
  const filename = `code-review-${lang}-${Date.now()}.pdf`;
  doc.save(filename);
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
            Power Ai Code Reviewer
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
          <ThemeToggle />
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
            <p className="text-xs text-gray-600">No reviews available</p>
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
                border-b border-gray-800 shrink-0 gap-2">

            {/* Language select */}
            <select value={lang} onChange={e => setLang(e.target.value)}
                className="bg-gray-800 text-white text-xs border border-gray-700
                        rounded-md px-2 py-1 outline-none
                        focus:border-blue-500 dark:bg-gray-800
                        light:bg-gray-100">
                {LANGUAGES.map(l => (
                <option key={l} value={l}>{l}</option>
                ))}
            </select>

            {/* File name — agar upload hua ho */}
            {fileName && (
                <span className="text-xs text-blue-400 truncate max-w-24
                                flex-1 text-center">
                📄 {fileName}
                </span>
            )}

            <div className="flex items-center gap-2 shrink-0">
                {/* Upload button */}
                <label className="cursor-pointer flex items-center gap-1
                                text-xs text-gray-400 hover:text-white
                                border border-gray-700 hover:border-gray-500
                                px-2 py-1 rounded-md transition-colors">
                <svg className="w-3.5 h-3.5" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0
                            0L8 8m4-4v12"/>
                </svg>
                Upload
                <input
                    type="file"
                    className="hidden"
                    accept=".py,.js,.ts,.jsx,.tsx,.java,.go,.rs,.cpp,.cc,.sql,.php,.rb"
                    onChange={handleFileUpload}
                />
                </label>

                {/* Clear button */}
                <button
                onClick={() => { setCode(""); setFileName(null); }}
                className="text-xs text-gray-500 hover:text-gray-300
                            transition-colors"
                >
                Clear
                </button>
            </div>
            </div>

          {/* Textarea */}
          <textarea value={code} onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-gray-950 text-gray-100 font-mono text-sm
                       p-4 resize-none outline-none leading-relaxed
                       placeholder-gray-700 min-h-64"
            placeholder="Paste your code here..."
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
                  Review My Code
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
              <div className="flex items-center gap-2 px-1">
                {/* Download PDF button */}
                <button
                  onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-1.5
                            py-2 text-xs font-medium bg-blue-600
                            hover:bg-blue-500 text-white rounded-lg
                            transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0
                            01-2-2V5a2 2 0 012-2h5.586a1 1 0
                            01.707.293l5.414 5.414a1 1 0
                            01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Download PDF
                </button>

                {/* Clear button */}
                <button
                  onClick={() => { setReview(""); setTab("editor"); }}
                  className="px-3 py-2 text-xs text-gray-500
                            hover:text-gray-300 border border-gray-700
                            hover:border-gray-500 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
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
                <ReactMarkdown
  components={{
    code({ className, children }) {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <CodeBlock className={className}>
            {children}
          </CodeBlock>
        );
      }
      return (
        <code className="bg-gray-800 px-1.5 py-0.5 rounded
                          text-xs font-mono">
          {children}
        </code>
      );
    },
  }}
>
  {review}
</ReactMarkdown>
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
                      ? "Review in progress..."
                      : "Paste Your Code and Click the Review Button."}
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