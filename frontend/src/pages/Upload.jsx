import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload as UploadIcon, Zap, ShieldCheck, Sparkles, CheckCircle } from "lucide-react";

const stats = [
  { icon: Zap,         label: "Lightning Fast",   desc: "Transcription delivered in seconds"    },
  { icon: Sparkles,    label: "High Accuracy",     desc: "State-of-the-art Whisper AI models"    },
  { icon: ShieldCheck, label: "Secure & Private",  desc: "Your audio never leaves your server"   },
];

export default function Upload({ setPage }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file, file.name);
    try {
      const res = await fetch("/api/recordings", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed — " + res.status);
      setDone(true);
      setTimeout(() => setPage("history"), 1800);
    } catch (e) {
      const msg = e.message.includes("Failed to fetch")
        ? "Cannot reach backend. Make sure Spring Boot is running on port 8080."
        : e.message;
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-2xl flex flex-col gap-8"
      >
        {/* Hero text */}
        <div className="text-center">
          <h1 className="text-4xl font-bold leading-tight mb-3">
            Extract Audio.<br />
            <span className="text-violet-400">Transcribe Instantly.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            From videos, audio or links — get accurate transcriptions and extracted data in seconds.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && !done && fileRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200
            ${done    ? "border-emerald-500/50 bg-emerald-500/5"  : ""}
            ${error   ? "border-red-500/50 bg-red-500/5"          : ""}
            ${dragging && !done && !error ? "border-violet-500 bg-violet-500/10"       : ""}
            ${!dragging && !done && !error ? "border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-[#141E33] hover:border-violet-500/40 hover:bg-violet-500/5" : ""}
          `}
        >
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/*,.mp3,.mp4,.wav,.webm,.ogg,.m4a"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center transition-all
            ${done    ? "bg-emerald-500/20"  : ""}
            ${error   ? "bg-red-500/20"      : ""}
            ${dragging && !done && !error ? "bg-violet-600"      : ""}
            ${!dragging && !done && !error ? "bg-slate-300 dark:bg-[#1A2540]" : ""}
          `}>
            {uploading ? (
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            ) : done ? (
              <CheckCircle size={26} className="text-emerald-400" />
            ) : (
              <UploadIcon size={24} className={dragging ? "text-white" : "text-violet-400"} />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {uploading ? "Uploading…"
                : done    ? "Done! Redirecting to history…"
                : error   ? error
                : dragging ? "Drop it!"
                : "Drag & drop a file here"}
            </p>
            {!uploading && !done && !error && (
              <p className="text-xs text-slate-600 mt-1">Supports MP3, MP4, WAV, WebM, OGG, M4A</p>
            )}
          </div>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || done}
          className="self-center px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-900/30"
        >
          {uploading ? "Uploading…" : done ? "Done!" : "Upload File"}
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white dark:bg-[#141E33] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col gap-2">
              <Icon size={16} className="text-violet-500 dark:text-violet-400" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
