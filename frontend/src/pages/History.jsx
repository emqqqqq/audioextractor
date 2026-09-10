import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Mic, Trash2, Download, ChevronRight, ChevronDown,
  AlertTriangle, RefreshCw, ServerCrash, Check, X, Pencil,
} from "lucide-react";

const ACCENT_COLORS = [
  { bg: "bg-violet-500/20", text: "text-violet-500 dark:text-violet-400"  },
  { bg: "bg-blue-500/20",   text: "text-blue-500 dark:text-blue-400"      },
  { bg: "bg-emerald-500/20",text: "text-emerald-500 dark:text-emerald-400" },
  { bg: "bg-rose-500/20",   text: "text-rose-500 dark:text-rose-400"      },
  { bg: "bg-amber-500/20",  text: "text-amber-500 dark:text-amber-400"    },
];

export default function History() {
  const [records,    setRecords]    = useState([]);
  const [search,     setSearch]     = useState("");
  const [openId,     setOpenId]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState(null);
  const [fetchErr,   setFetchErr]   = useState("");
  const [renamingId,  setRenamingId]  = useState(null);
  const [renameVal,   setRenameVal]   = useState("");
  const [editingId,   setEditingId]   = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingRecId, setEditingRecId] = useState(null);
  const [editDraft, setEditDraft] = useState({ transcription: "", extractedData: "" });

  const baseName = (f) => f ? f.replace(/\.[^/.]+$/, "") : "recording";
  const ext      = (f) => { const m = (f || "").match(/(\.[^.]+)$/); return m ? m[1] : ".webm"; };

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setFetchErr("");
    try {
      const res = await fetch("/api/recordings");
      if (res.status === 502 || res.status === 503 || res.status === 0) throw new Error("BACKEND_DOWN");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : data.recordings || []);
    } catch (e) {
      setFetchErr(
        e.message === "BACKEND_DOWN" || e.message.includes("fetch") ? "BACKEND_DOWN" : e.message
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const remove = async (id) => {
    setDeleting(id);
    try {
      await fetch(`/api/recordings/${id}`, { method: "DELETE" });
      setRecords(prev => prev.filter(r => r.id !== id));
      if (openId === id) setOpenId(null);
    } finally {
      setDeleting(null);
    }
  };

  const download = async (id, filename) => {
    const res  = await fetch(`/api/recordings/${id}/audio`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setRenamingId(null);
  };

    const saveEdit = async (id) => {
      const res = await fetch(`/api/recordings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      if (res.ok) {
        const updated = await res.json();
        setRecords(prev => prev.map(r => r.id === id ? updated : r));
      }
      setEditingRecId(null);
    };

  const startRename = (e, r) => {
    e.stopPropagation();
    setRenamingId(r.id);
    setRenameVal(baseName(r.originalFilename));
  };

  const saveEditingName = async (id, originalName) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === originalName) return;
    try {
      const res = await fetch(`/api/recordings/${id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, originalFilename: name } : rec));
      }
    } catch (e) {
      console.error("Rename failed:", e);
    }
  };

  const confirmDownload = (e, r) => {
    e.stopPropagation();
    const name = (renameVal.trim() || baseName(r.originalFilename)) + ext(r.originalFilename);
    download(r.id, name);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const filtered = records
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(r => (r.transcription || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-screen">

      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 dark:border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-slate-900 dark:text-slate-100">History</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {loading ? "Loading…" : `${records.length} recording${records.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        <div className="flex items-center gap-3 bg-slate-200 dark:bg-[#141E33] border border-slate-300 dark:border-white/5 rounded-xl px-4 py-2.5">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transcriptions…"
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-8">

        {fetchErr === "BACKEND_DOWN" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <ServerCrash size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-300 mb-1">Spring Boot backend is not reachable</p>
                <ol className="text-xs text-amber-600/70 dark:text-amber-400/70 leading-relaxed list-decimal list-inside space-y-1">
                  <li>PostgreSQL must be running on port 5432 with database <span className="font-mono">vezilka</span></li>
                  <li>Run: <span className="font-mono bg-black/10 dark:bg-black/30 px-1.5 py-0.5 rounded">cd audio-extractor &amp;&amp; ./mvnw spring-boot:run</span></li>
                  <li>Wait ~15s then click Refresh</li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}

        {fetchErr && fetchErr !== "BACKEND_DOWN" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
          >
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-300">{fetchErr}</p>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 && !fetchErr ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-[#141E33] flex items-center justify-center">
              <Mic size={20} className="text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">
              {search ? "No recordings match your search" : "No recordings yet — go record something!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r, i) => {
              const isOpen = openId === r.id;
              const color  = ACCENT_COLORS[i % ACCENT_COLORS.length];
              const isDel  = deleting === r.id;

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="bg-white dark:bg-[#141E33] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden"
                >
                  <div
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
                      <Mic size={15} className={color.text} />
                    </div>

                    <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                      {editingId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            autoFocus
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter")  saveEditingName(r.id, r.originalFilename);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="flex-1 min-w-0 text-sm font-medium bg-transparent border-b border-violet-400 text-slate-800 dark:text-slate-200 outline-none pb-0.5"
                          />
                          <button
                            onClick={() => saveEditingName(r.id, r.originalFilename)}
                            className="p-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 dark:text-violet-400 shrink-0"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-500 shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/name">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {r.originalFilename || "Recording"}
                          </p>
                          <button
                            onClick={() => { setEditingId(r.id); setEditingName(r.originalFilename || "Recording"); }}
                            className="opacity-0 group-hover/name:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-all shrink-0"
                            title="Rename"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {renamingId === r.id ? (
                        /* ── Rename input ── */
                        <AnimatePresence mode="wait">
                          <motion.div
                            key="rename"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              autoFocus
                              value={renameVal}
                              onChange={e => setRenameVal(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") confirmDownload(e, r);
                                if (e.key === "Escape") setRenamingId(null);
                              }}
                              className="w-36 px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-white/10 border border-violet-400/50 text-slate-800 dark:text-slate-200 outline-none"
                            />
                            <span className="text-xs text-slate-400">{ext(r.originalFilename)}</span>
                            <button
                              onClick={e => confirmDownload(e, r)}
                              className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 dark:text-violet-400 transition-all"
                              title="Download with this name"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setRenamingId(null); }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-all"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        /*  Normal buttons  */
                        <>
                          <span className="text-xs text-slate-400 max-w-[160px] truncate hidden lg:block">
                            {(r.transcription || "").slice(0, 60)}
                          </span>
                          <button
                            onClick={e => startRename(e, r)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-violet-500/20 hover:text-violet-600 dark:hover:text-violet-300 text-slate-400 transition-all"
                            title="Rename & download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingRecId(r.id); setEditDraft({ transcription: r.transcription || "", extractedData: r.extractedData || "" }); setOpenId(r.id); }}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-violet-500/20 hover:text-violet-500 dark:hover:text-violet-400 text-slate-400 transition-all"
                            title="Edit"
                          ><Pencil size={14} /></button>
                          <button
                            onClick={e => { e.stopPropagation(); remove(r.id); }}
                            disabled={isDel}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 text-slate-400 transition-all disabled:opacity-50"
                            title="Delete recording"
                          >
                            {isDel
                              ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </>
                      )}
                      {renamingId !== r.id && (
                        isOpen
                          ? <ChevronDown  size={15} className="text-slate-400" />
                          : <ChevronRight size={15} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 pt-4 border-t border-slate-200 dark:border-white/5">
                          {editingRecId === r.id ? (
                            <>
                              <textarea value={editDraft.transcription} onChange={e => setEditDraft(p => ({...p, transcription: e.target.value}))} rows={4} className="w-full text-sm bg-slate-100 dark:bg-black/20 rounded-xl p-3 outline-none border border-violet-400/50 resize-none mb-3 text-slate-700 dark:text-slate-300" />
                              <textarea value={editDraft.extractedData} onChange={e => setEditDraft(p => ({...p, extractedData: e.target.value}))} rows={5} className="w-full text-xs font-mono bg-slate-100 dark:bg-black/20 rounded-xl p-3 outline-none border border-violet-400/50 resize-none mb-3 text-slate-500 dark:text-slate-400" />
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 dark:text-violet-400 text-xs"><Check size={12}/>Save</button>
                                <button onClick={() => setEditingRecId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 text-xs"><X size={12}/>Cancel</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Transcription</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                {r.transcription || "(no transcription)"}
                              </p>
                              {r.extractedData && r.extractedData !== "{}" && (
                                <>
                                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Extracted Data</p>
                                  <pre className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-black/20 rounded-xl p-3 overflow-auto leading-relaxed">
                                    {r.extractedData}
                                  </pre>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
