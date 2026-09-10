import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";

export default function App() {
  const [page, setPage] = useState("landing");
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("vezilka_theme") !== "light"
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("vezilka_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080C18] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {page !== "landing" && (
        <Sidebar page={page} setPage={setPage} isDark={isDark} setIsDark={setIsDark} />
      )}
      <main className="flex-1 min-h-screen overflow-hidden">
        {page === "landing"   && <Landing setPage={setPage} isDark={isDark} setIsDark={setIsDark} />}
        {page === "upload"    && <Upload setPage={setPage} />}
        {page === "dashboard" && <Dashboard />}
        {page === "history"   && <History />}
      </main>
    </div>
  );
}
