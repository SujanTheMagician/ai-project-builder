"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Cpu,
  Sparkles,
  Database,
  Code2,
  Map,
  Zap,
  ArrowRight,
  CheckCircle,
  Github,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "Requirements Generator", desc: "Detailed functional and non-functional requirements from a single idea description." },
  { icon: Code2, title: "Architecture Designer", desc: "Full-stack architecture diagrams with technology recommendations." },
  { icon: Database, title: "Database Schema", desc: "Complete ER diagrams, table designs, and Prisma schema ready to use." },
  { icon: Zap, title: "API Blueprint", desc: "RESTful API endpoints with request/response specs and status codes." },
  { icon: Map, title: "Roadmap & Sprints", desc: "Development phases, sprint planning, and cost estimations in seconds." },
  { icon: Cpu, title: "AI Chat Assistant", desc: "Contextual AI that refines your architecture and answers technical questions." },
];

const steps = [
  { n: "01", title: "Describe your idea", desc: "Enter your project concept in plain English — no technical jargon required." },
  { n: "02", title: "AI analysis", desc: "Gemini AI analyses your idea, market context, and technical requirements." },
  { n: "03", title: "Generate blueprint", desc: "Get a complete project blueprint with architecture, schema, APIs, and roadmap." },
  { n: "04", title: "Start building", desc: "Export to PDF, Markdown or DOCX and start your project with confidence." },
];

const testimonials = [
  { name: "Priya Sharma", role: "Founder, HealthOS", quote: "Saved us 2 weeks of planning. The database schema it generated was better than what our team would have produced." },
  { name: "Arjun Mehta", role: "CTO, FinVest", quote: "We used the API blueprint directly — barely needed to modify it. Incredible tool for early-stage startups." },
  { name: "Sneha Reddy", role: "Product Manager, EduFlow", quote: "The roadmap and sprint plan were spot-on. I shared it with investors and they were impressed." },
];

const faqs = [
  { q: "Which AI model powers the generation?", a: "We use Google's Gemini 1.5 Flash — optimised for speed and structured output quality." },
  { q: "Can I export the generated blueprint?", a: "Yes — export to PDF, Markdown, or DOCX from any project view." },
  { q: "Is my project data private?", a: "Absolutely. Projects are tied to your account and never shared or used to train AI models." },
  { q: "How many projects can I create?", a: "The free plan includes 5 projects. Pro includes unlimited projects and 500 AI credits/month." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            ProjectAI
          </Link>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/sign-up" className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors">
                Get started free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-100 dark:bg-violet-900/20 rounded-full blur-3xl opacity-60" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Gemini AI
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
            Turn any idea into a
            <span className="text-gradient"> complete project blueprint</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Describe your startup or app idea. Get architecture, database schema, API design,
            roadmap, and cost estimates — all in under 10 seconds.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105">
              Generate your first blueprint <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://github.com" className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 px-6 py-3 rounded-xl font-medium transition-colors">
              <Github className="w-4 h-4" /> View on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Everything a software architect produces</h2>
            <p className="text-gray-500 dark:text-gray-400">Six pillars of a production-ready blueprint, generated in seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors group">
                <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
                  <f.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">How it works</h2>
            <p className="text-gray-500 dark:text-gray-400">From idea to blueprint in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-4xl font-bold text-violet-100 dark:text-violet-900/50 mb-3">{s.n}</div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-12">What builders are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Simple pricing</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { name: "Free", price: "$0", desc: "For individuals exploring the tool", features: ["5 projects", "100 AI credits/month", "PDF & Markdown export", "Basic chat assistant"] },
              { name: "Pro", price: "$12/mo", desc: "For teams building seriously", features: ["Unlimited projects", "500 AI credits/month", "All export formats", "Priority AI generation", "Team collaboration"], highlight: true },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 border text-left ${plan.highlight ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 mb-1">{plan.price}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{plan.desc}</p>
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <CheckCircle className="w-4 h-4 text-violet-500" />{f}
                  </div>
                ))}
                <Link href="/sign-up" className={`mt-5 w-full flex justify-center py-2.5 rounded-xl text-sm font-medium transition-colors ${plan.highlight ? "bg-violet-600 hover:bg-violet-700 text-white" : "border border-gray-200 dark:border-gray-700 hover:border-gray-400 text-gray-700 dark:text-gray-300"}`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
{/* About the Author */}
<section className="py-20 px-4">
  <div className="max-w-5xl mx-auto">
    <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-3">About the author</h2>
    <p className="text-gray-500 dark:text-gray-400 text-center mb-12">The developer behind ProjectAI</p>

    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Top banner */}
      <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            SA
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sujan Anandh S I</h3>
            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium mt-0.5">Frontend Developer · SDE Intern @ ATIUM Sports</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Open to work</span>
            </div>
          </div>
        </div>

        {/* Bio + Values grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-3">My story</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              B.Tech CSE student at <strong className="text-gray-900 dark:text-white">AMET University, Chennai</strong> (Class of 2028).
              I discovered my passion for web development in my first year and got completely hooked on turning
              designs into living, breathing interfaces.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
              Currently interning as a Software Developer at <strong className="text-green-600 dark:text-green-400">ATIUM Sports</strong>,
              building React-powered athlete management tools. Previously a Teaching Assistant at{" "}
              <strong className="text-purple-600 dark:text-purple-400">Kalvium</strong> (Jun–Aug 2025),
              reviewing Frontend Web Development submissions for 50+ students.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-3">What drives me</p>
            <div className="space-y-3">
              {[
                { icon: "🎯", title: "User-first thinking", desc: "I obsess over how real people experience interfaces." },
                { icon: "⚡", title: "Performance matters", desc: "Clean, fast code — every millisecond counts." },
                { icon: "📚", title: "Always learning", desc: "From TA-ing 50+ students to building AI-powered SaaS apps." },
                { icon: "🤝", title: "Team player", desc: "Agile sprints, code reviews, standups — I thrive collaborating." },
              ].map((v) => (
                <div key={v.title} className="flex gap-3 items-start">
                  <span className="text-base flex-shrink-0">{v.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{v.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick facts */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-4">Quick facts</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: "📍", label: "Location", val: "Chennai, India" },
              { icon: "🎓", label: "Degree", val: "B.Tech CSE, 2024–2028" },
              { icon: "💼", label: "Current role", val: "SDE Intern @ ATIUM Sports" },
              { icon: "🌐", label: "Languages", val: "Tamil, English, Hindi" },
              { icon: "☕", label: "Fuel", val: "Coffee + lo-fi beats" },
              { icon: "🎮", label: "Off the clock", val: "Chess, open source, UI" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <span className="text-lg">{f.icon}</span>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{f.label}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{f.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3">
          <a href="https://github.com/SujanTheMagician" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            💻 GitHub
          </a>
          <a href="https://www.linkedin.com/in/sujan-anandh-227253212" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            🔗 LinkedIn
          </a>
          <a href="mailto:sujananandhsi@gmail.com" className="inline-flex items-center gap-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            ✉️ sujananandhsi@gmail.com
          </a>
          <a href="tel:8438339737" className="inline-flex items-center gap-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            📞 +91 84383 39737
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            ProjectAI · Sujan Anandh
          </div>
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
