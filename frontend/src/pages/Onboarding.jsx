import { motion } from "framer-motion";

export default function Onboarding({ setPage }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">

      <div className="w-full max-w-xl text-center flex flex-col items-center gap-8">

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="tracking-[0.4em] text-sm opacity-70"
        >
          VEZILKA
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
        >
          <h2 className="text-xl mb-3">Voice intelligence app</h2>

          <p className="text-sm text-white/60">
            Record voice → get transcription → save history → search everything
          </p>

          <div className="mt-6 flex flex-col gap-2 text-left text-white/70 text-sm">
            <div>🎤 Record audio</div>
            <div>🧠 Speech-to-text</div>
            <div>📚 Stored history</div>
            <div>🔍 Search everything</div>
          </div>
        </motion.div>

        <button
          onClick={() => setPage("dashboard")}
          className="px-8 py-3 bg-indigo-600 rounded-full text-sm hover:bg-indigo-500 transition"
        >
          Start Recording
        </button>

      </div>
    </div>
  );
}