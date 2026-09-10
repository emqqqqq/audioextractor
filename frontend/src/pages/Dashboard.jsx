import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { VoicePoweredOrb } from "../components/ui/voice-powered-orb";

export default function Dashboard() {
  const [state, setState]     = useState("idle");
  const [lines, setLines]     = useState([]);
  const [live, setLive]       = useState("");
  const [result, setResult]   = useState(null);
  const [copied, setCopied]   = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError]     = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const recognitionRef   = useRef(null);
  const startTimeRef     = useRef(null);
  const timerRef         = useRef(null);

  const getLang = () => localStorage.getItem("vezilka_lang") || "mk-MK";

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang           = getLang();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const ts  = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
          setLines(prev => [...prev, { time: ts, text: e.results[i][0].transcript.trim() }]);
          setLive("");
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      setLive(interim);
    };
    rec.onerror = () => {};
    recognitionRef.current = rec;
  }, []);

  const startRecording = async () => {
    setError("");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
      return;
    }

    chunksRef.current    = [];
    startTimeRef.current = Date.now();
    setLines([]);
    setLive("");
    setResult(null);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    const CODEC_PRIORITY = [
      { mime: "audio/webm;codecs=opus", ext: ".webm" },
      { mime: "audio/webm",             ext: ".webm" },
      { mime: "audio/mp4",              ext: ".mp4"  },
      { mime: "audio/ogg;codecs=opus",  ext: ".ogg"  },
    ];
    const codec = CODEC_PRIORITY.find(c => MediaRecorder.isTypeSupported(c.mime))
      || { mime: "", ext: ".webm" };

    const mr = new MediaRecorder(stream, codec.mime ? { mimeType: codec.mime } : {});
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      clearInterval(timerRef.current);
      stream.getTracks().forEach(t => t.stop());
      setState("processing");

      if (chunksRef.current.length === 0) {
        setError("No audio data was captured. Please try again.");
        setState("idle");
        return;
      }

      const blobMime = codec.mime || mr.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: blobMime });
      const fd   = new FormData();
      fd.append("file", blob, `recording${codec.ext}`);

      // Prefer the browser's live transcript over Whisper (better testing results)
      const liveText = lines.map(l => l.text).join(" ").trim();
      if (liveText) fd.append("transcript", liveText);

      try {
        const res = await fetch("/api/recordings", { method: "POST", body: fd });
        if (!res.ok) {
          let detail = `HTTP ${res.status}`;
          try {
            const body = await res.json();
            detail = body.error || body.message || JSON.stringify(body);
          } catch {
            detail = await res.text().catch(() => `HTTP ${res.status}`);
          }
          throw new Error(detail);
        }
        const data = await res.json();
        setResult(data);
        setState("done");
      } catch (e) {
        const msg = e.message.includes("Failed to fetch")
          ? "Cannot reach the backend server. Make sure Spring Boot is running on port 8080."
          : e.message;
        setError(msg);
        setState("idle");
      }
    };

    mr.start(1000);
    try { recognitionRef.current.lang = getLang(); recognitionRef.current?.start(); } catch {}
    setState("recording");
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
  };

  const copy = async () => {
    const text = result?.transcription || lines.map(l => l.text).join(" ");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const reset = () => { setState("idle"); setLines([]); setLive(""); setResult(null); setError(""); };

  const fmtSec = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const stateLabel = {
    idle:       "Ready to record",
    recording:  `Listening… ${fmtSec(elapsed)}`,
    processing: "Processing audio…",
    done:       "Recording complete",
  }[state];

  const hasTranscript = lines.length > 0 || (state === "done" && result?.transcription);

  return (
    <div className="flex flex-col h-screen">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-white/5 shrink-0">
        <div>
          <h1 className="font-display font-bold text-slate-900 dark:text-slate-100">Real-time Transcription</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={state}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-slate-400 dark:text-slate-500 mt-0.5"
            >
              {stateLabel}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {hasTranscript && (
              <motion.button
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onClick={copy}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-all"
              >
                {copied
                  ? <><Check size={13} className="text-emerald-500" /> Copied</>
                  : <><Copy size={13} /> Copy text</>}
              </motion.button>
            )}
          </AnimatePresence>

          {state === "done" && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-all"
            >
              <RefreshCw size={13} /> New recording
            </button>
          )}

          {state === "recording" ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-500 dark:text-red-400 rounded-xl text-sm font-medium transition-all"
            >
              <Square size={13} /> Stop
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={state === "processing"}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-900/30"
            >
              <Mic size={13} />
              {state === "processing" ? "Processing…" : "Start Recording"}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center px-8 pt-10 pb-8 gap-6">

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full max-w-2xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orb */}
          <div className="relative flex items-center justify-center">
            <AnimatePresence>
              {state === "recording" && (
                <>
                  <motion.div
                    key="ring1"
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.35, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-72 h-72 rounded-full border border-violet-500/40"
                  />
                  <motion.div
                    key="ring2"
                    initial={{ scale: 1, opacity: 0.25 }}
                    animate={{ scale: 1.55, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                    className="absolute w-72 h-72 rounded-full border border-violet-400/30"
                  />
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {state === "processing" && (
                <motion.div
                  key="proc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute w-80 h-80 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={{ scale: state === "recording" ? 1.06 : 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-72 h-72"
            >
              <VoicePoweredOrb
                enableVoiceControl={false}
                hue={0}
                className="rounded-full overflow-hidden"
              />
            </motion.div>
          </div>

          {/* Live transcript */}
          <AnimatePresence>
            {(lines.length > 0 || live) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="w-full max-w-2xl bg-slate-200 dark:bg-[#141E33] border border-slate-300 dark:border-white/5 rounded-2xl p-6"
              >
                <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-wider font-medium mb-4">Live Transcription</p>
                <div className="flex flex-col gap-3 max-h-56 overflow-auto pr-1">
                  {lines.map((l, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-4 text-sm"
                    >
                      <span className="text-violet-500 dark:text-violet-400 font-mono text-xs shrink-0 mt-0.5">{l.time}</span>
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{l.text}</span>
                    </motion.div>
                  ))}
                  {live && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-400 font-mono text-xs shrink-0 mt-0.5">live</span>
                      <span className="text-slate-400 italic leading-relaxed">{live}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* server result */}
          <AnimatePresence>
            {state === "done" && result && lines.length === 0 && result.transcription && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-slate-200 dark:bg-[#141E33] border border-slate-300 dark:border-white/5 rounded-2xl p-6"
              >
                <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-wider font-medium mb-4">Transcription</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.transcription}</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
