const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { getColourName } from "@/lib/gameDefaults";
import { Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import moment from "moment";

function pct(correct, total) {
  if (!total) return "—";
  return `${Math.round((correct / total) * 100)}%`;
}

function msFormat(ms) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function SessionCard({ session, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const s = session.settings || {};

  const times = session.answer_times || [];
  const minTime = times.length ? Math.min(...times) : null;
  const maxTime = times.length ? Math.max(...times) : null;
  const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;

  const seqLens = session.sequence_lengths_reached || [];
  const minSeq = seqLens.length ? Math.min(...seqLens) : null;
  const maxSeq = seqLens.length ? Math.max(...seqLens) : null;
  const avgSeq = seqLens.length ? (seqLens.reduce((a, b) => a + b, 0) / seqLens.length).toFixed(1) : null;

  const reasonLabel = {
    completed: "Completed",
    failed: "Failed",
    quit: "Quit",
  };

  const reasonColor = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    quit: "text-zinc-400",
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div>
            <div className="text-sm text-white font-medium">
              {moment(session.started_at).format("MMM D, YYYY · h:mm A")}
            </div>
            <div className="text-xs text-zinc-500">
              {s.grid_rows}×{s.grid_cols} grid · Type {s.answer_type} ·{" "}
              <span className={reasonColor[session.game_over_reason] || "text-zinc-400"}>
                {reasonLabel[session.game_over_reason] || "Unknown"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{session.sequences_completed || 0} seq</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <Separator className="bg-zinc-800" />

          {/* Settings used */}
          <div>
            <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Settings</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <span className="text-zinc-400">Grid</span>
              <span className="text-zinc-200">{s.grid_rows}×{s.grid_cols}</span>
              <span className="text-zinc-400">Start Length</span>
              <span className="text-zinc-200">{s.starting_sequence_length}</span>
              <span className="text-zinc-400">Fixed Length</span>
              <span className="text-zinc-200">{s.fixed_sequence_length ? "Yes" : "No"}</span>
              <span className="text-zinc-400">Max Shown</span>
              <span className="text-zinc-200">{s.max_squares_shown}</span>
              <span className="text-zinc-400">Answer Type</span>
              <span className="text-zinc-200">{s.answer_type}</span>
              <span className="text-zinc-400">Text</span>
              <span className="text-zinc-200">{s.text_enabled ? "On" : "Off"}</span>
              <span className="text-zinc-400">Colour</span>
              <span className="text-zinc-200">{s.colour_enabled ? "On" : "Off"}</span>
              <span className="text-zinc-400">Flash / Wait</span>
              <span className="text-zinc-200">{s.flash_time}ms / {s.waiting_time}ms</span>
              {s.fail_threshold_enabled && (
                <>
                  <span className="text-zinc-400">Fail Threshold</span>
                  <span className="text-zinc-200">{s.fail_threshold}</span>
                </>
              )}
            </div>
          </div>

          {/* Answer Times */}
          <div>
            <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Answer Time Per Square</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-zinc-500">Shortest</div>
                <div className="text-sm text-white font-medium">{msFormat(minTime)}</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-zinc-500">Average</div>
                <div className="text-sm text-white font-medium">{msFormat(avgTime)}</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-zinc-500">Longest</div>
                <div className="text-sm text-white font-medium">{msFormat(maxTime)}</div>
              </div>
            </div>
          </div>

          {/* Sequence Lengths */}
          {!s.fixed_sequence_length && (
            <div>
              <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Sequence Length</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-500">Shortest</div>
                  <div className="text-sm text-white font-medium">{minSeq ?? "—"}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-500">Average</div>
                  <div className="text-sm text-white font-medium">{avgSeq ?? "—"}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-500">Longest</div>
                  <div className="text-sm text-white font-medium">{maxSeq ?? "—"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Correctness */}
          <div>
            <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Correctness</h4>
            <div className="grid grid-cols-3 gap-3">
              {s.answer_type !== "B" && (
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-500">Location</div>
                  <div className="text-sm text-white font-medium">
                    {pct(session.location_correct, session.location_total)}
                  </div>
                </div>
              )}
              {s.colour_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-500">Colour</div>
                  <div className="text-sm text-white font-medium">
                    {pct(session.colour_correct, session.colour_total)}
                  </div>
                </div>
              )}
              {s.text_enabled && (
                <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-500">Text</div>
                  <div className="text-sm text-white font-medium">
                    {pct(session.text_correct, session.text_total)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Correctness by position */}
          {session.correctness_by_position && Object.keys(session.correctness_by_position).length > 0 && (
            <div>
              <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">
                Correctness By Position
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(session.correctness_by_position)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([pos, data]) => (
                    <div key={pos} className="bg-zinc-800/50 rounded-lg px-3 py-1.5 text-center">
                      <div className="text-xs text-zinc-500">#{Number(pos) + 1}</div>
                      <div className="text-sm text-white font-medium">
                        {pct(data.correct, data.total)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(session.id)}
              className="text-zinc-500 hover:text-red-400 hover:bg-red-900/20 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete Session
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await db.entities.GameSession.list("-created_date", 50);
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    try {
      await db.entities.GameSession.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-4">
      <h2 className="text-xl font-semibold text-white">Session History</h2>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Play a game to see your stats here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}