import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const features = [
  {
    title: "Instant code review",
    desc: "Fast AI feedback on your code with suggestions and bug detection.",
    icon: "⚡",
  },
  {
    title: "Security checks",
    desc: "Find vulnerabilities and secure best practices in your code.",
    icon: "🔒",
  },
  {
    title: "Multi-language support",
    desc: "Review code in all major programming languages with ease.",
    icon: "🌐",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard"); // Already logged in → dashboard

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-4 sm:px-6 py-4
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex
                          items-center justify-center text-white
                          text-sm font-bold">AI</div>
          <span className="font-semibold text-white">CodeReviewer</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in"
            className="text-sm text-gray-400 hover:text-white
                       transition-colors">
            Login
          </Link>
          <Link href="/sign-up"
            className="text-sm bg-blue-600 hover:bg-blue-500
                       text-white px-4 py-2 rounded-lg
                       transition-colors font-medium">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 py-20 sm:py-28 text-center
                          max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-950/50
                        border border-blue-800/50 text-blue-300 text-xs
                        px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400
                           animate-pulse"></span>
          AI-powered code review — Starting at ₹0/month
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold mb-6
                       leading-tight tracking-tight">
          Review Your Code in {" "}
          <span className="text-blue-400">Seconds</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 mb-10
                      max-w-2xl mx-auto leading-relaxed">
          Take Instant Review From AI — Catch bugs, Find Security Issues, And Get Suggestions In Seconds. Professional Code Review Tool For Developers.

        </p>

        <div className="flex flex-col sm:flex-row gap-3
                        justify-center items-center">
          <Link href="/sign-up"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600
                       hover:bg-blue-500 text-white rounded-xl
                       font-medium transition-colors text-sm">
            Start Free →
          </Link>
          <Link href="/sign-in"
            className="w-full sm:w-auto px-8 py-3.5 border
                       border-gray-700 hover:border-gray-500
                       text-gray-300 hover:text-white rounded-xl
                       font-medium transition-colors text-sm">
            Login
          </Link>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Don't need a credit card • 10 free reviews/day
        </p>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center
                       mb-3">
          Anything your code needs, we've got it covered
        </h2>
        <p className="text-gray-400 text-center mb-12 text-sm">
          Professional code review tool — For Developers, By Developers
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                        gap-4">
          {features.map((f) => (
            <div key={f.title}
              className="bg-gray-900 border border-gray-800
                         rounded-xl p-5 hover:border-gray-700
                         transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-medium text-white mb-2 text-sm">
                {f.title}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center
                       mb-3">Simple pricing
        </h2>
        <p className="text-gray-400 text-center mb-12 text-sm">
          Start free — upgrade later
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6
                        max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-900 border border-gray-800
                          rounded-2xl p-6">
            <div className="text-sm font-medium text-gray-400
                            mb-1">Free</div>
            <div className="text-3xl font-bold mb-1">₹0</div>
            <div className="text-xs text-gray-500 mb-6">
              Free Plan
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "10 reviews/day",
                "Sab languages",
                "Review history",
                "Copy button",
                "Mobile app",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2
                                       text-sm text-gray-300">
                  <span className="text-green-400 text-xs">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up"
              className="block w-full text-center py-2.5 border
                         border-gray-700 hover:border-gray-500
                         text-gray-300 rounded-lg text-sm
                         transition-colors">
              Start Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-blue-950/30 border-2 border-blue-600
                          rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2
                            bg-blue-600 text-white text-xs px-3 py-1
                            rounded-full font-medium">
              Most Popular
            </div>
            <div className="text-sm font-medium text-blue-400
                            mb-1">Pro</div>
            <div className="text-3xl font-bold mb-1">₹99</div>
            <div className="text-xs text-gray-500 mb-6">
              Per Month
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited reviews",
                "All languages",
                "Review history",
                "Copy button",
                "Mobile app",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2
                                       text-sm text-gray-300">
                  <span className="text-blue-400 text-xs">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up"
              className="block w-full text-center py-2.5 bg-blue-600
                         hover:bg-blue-500 text-white rounded-lg
                         text-sm transition-colors font-medium">
              Start Pro
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-linear-to-r
                        from-blue-950/50 to-gray-900 border
                        border-blue-800/30 rounded-2xl p-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Start Free Today
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            10 free reviews/day — No credit card required
          </p>
          <Link href="/sign-up"
            className="inline-block px-8 py-3.5 bg-blue-600
                       hover:bg-blue-500 text-white rounded-xl
                       font-medium transition-colors text-sm">
            Start Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 sm:px-6
                         py-6 text-center">
        <p className="text-xs text-gray-600">
          © 2026 AiCodeReviewer — All rights reserved by Dheeraj.
        </p>
      </footer>

    </div>
  );
}