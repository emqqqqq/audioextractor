import { Home, Mic, History, Sun, Moon } from "lucide-react";

const nav = [
  { id: "upload",    icon: Home,    label: "Home"    },
  { id: "dashboard", icon: Mic,     label: "Record"  },
  { id: "history",   icon: History, label: "History" },
];

export default function Sidebar({ page, setPage, isDark, setIsDark }) {
  return (
    <aside className="w-60 min-h-screen bg-white dark:bg-[#0A0F1E] border-r border-slate-200 dark:border-white/5 flex flex-col py-6 px-4 shrink-0 transition-colors duration-200">

      {/* Logo + name */}
      <button
        onClick={() => setPage("landing")}
        className="flex items-center gap-3 mb-8 px-2 hover:opacity-80 transition-opacity group"
      >
        <img src="/logo.png" alt="Vezilka" className="h-8 w-auto shrink-0" />
        <div className="text-left leading-tight">
          <span className="block text-base font-display font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-white transition-colors">
            Vezilka
          </span>
          <span className="block text-[10px] text-slate-400 dark:text-slate-500 tracking-wide">
            Audio Extractor
          </span>
        </div>
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {nav.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left
              ${page === id
                ? "bg-violet-600/15 text-violet-600 dark:text-violet-300 border border-violet-500/25"
                : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
              }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(d => !d)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
      >
        {isDark
          ? <><Sun size={17} /><span>Light mode</span></>
          : <><Moon size={17} /><span>Dark mode</span></>
        }
      </button>
    </aside>
  );
}
