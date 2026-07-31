"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Pause, Play } from "lucide-react";

export function QuestionTimer({
  secondsPerQuestion,
  onExpired,
  isActive,
}: {
  secondsPerQuestion: number;
  onExpired: () => void;
  isActive: boolean;
}) {
  const [remaining, setRemaining] = useState(secondsPerQuestion);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isActive || isPaused) return;
    if (remaining <= 0) {
      onExpired();
      return;
    }
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onExpired();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, isPaused, remaining, onExpired]);

  const pct = Math.max(0, Math.min(100, (remaining / secondsPerQuestion) * 100));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining <= 10 && remaining > 0;
  const isZero = remaining <= 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setIsPaused((p) => !p)}
        disabled={isZero}
        className="rounded-lg p-1.5 text-slate-400 hover:text-white transition disabled:opacity-30"
        title={isPaused ? "Resume timer" : "Pause timer"}
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>

      <div className="relative h-7 w-28 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isUrgent ? "bg-rose-500" : isZero ? "bg-rose-700" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-[11px] font-bold tabular-nums ${
              isUrgent ? "text-rose-400 animate-pulse" : "text-slate-200"
            }`}
          >
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SessionTimer({ isRunning }: { isRunning: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-300">
      <Clock className="h-3.5 w-3.5 text-slate-500" />
      {hrs > 0 && <span>{hrs}h</span>}
      <span>{remMins}m</span>
      <span>{secs.toString().padStart(2, "0")}s</span>
    </div>
  );
}
