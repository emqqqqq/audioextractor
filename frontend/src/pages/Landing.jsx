import { motion } from "framer-motion";
import { Mic, Brain, FolderOpen, Search, ArrowRight, Sun, Moon } from "lucide-react";
import { VoicePoweredOrb } from "../components/ui/voice-powered-orb";

const features = [
  { icon: Mic,        label: "Record audio in real time"           },
  { icon: Brain,      label: "AI-powered speech-to-text"           },
  { icon: FolderOpen, label: "Stored & searchable history"         },
  { icon: Search,     label: "Find anything across all recordings" },
];

export default function Landing({ setPage, isDark, setIsDark }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-10 relative">

      {/* Theme toggle — top right */}
      <button
        onClick={() => setIsDark(d => !d)}
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-5xl grid grid-cols-2 gap-16 items-center">

        {/* Left panel */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-7"
        >
          {/* Logo + name inline */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vezilka" className="h-10 w-auto shrink-0" />
            <div className="leading-tight">
              <span className="block text-lg font-display font-bold text-slate-900 dark:text-slate-100">Vezilka</span>
              <span className="block text-xs text-slate-400 dark:text-slate-500 tracking-wide">Audio Extractor</span>
            </div>
          </div>

          <div>
            <h1 className="font-display text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">Welcome!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Record voice, get instant transcriptions, save your history, and search everything — powered by state-of-the-art AI.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#141E33] border border-slate-300 dark:border-white/5 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-violet-500 dark:text-violet-400" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setPage("dashboard")}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-900/30"
            >
              Get Started <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setPage("upload")}
              className="px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all"
            >
              Upload a File
            </button>
          </div>
        </motion.div>

        {/* Right panel — orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.34, 1.2, 0.64, 1] }}
          className="flex items-center justify-center"
        >
          <div className="relative w-80 h-80">
            <div className="absolute inset-[-16px] rounded-full bg-violet-600/10 blur-2xl" />
            <div className="absolute inset-[-8px] rounded-full bg-indigo-600/8 blur-xl" />
            <VoicePoweredOrb
              enableVoiceControl={false}
              hue={0}
              className="rounded-full overflow-hidden shadow-2xl shadow-violet-900/40"
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
