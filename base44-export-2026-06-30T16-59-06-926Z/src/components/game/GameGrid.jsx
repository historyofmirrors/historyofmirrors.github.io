import React from "react";

export default function GameGrid({
  rows,
  cols,
  activeSquares,
  selectedSquares,
  onCellClick,
  clickable,
  highlightedCell,
}) {
  const getCellState = (r, c) => {
    // Check if this cell is actively flashing
    const active = activeSquares.find((s) => s.row === r && s.col === c);
    if (active) return { type: "active", colour: active.colour, text: active.text };

    // Check if highlighted (Answer Type C)
    if (highlightedCell && highlightedCell.row === r && highlightedCell.col === c) {
      return { type: "highlighted" };
    }

    // Check if already selected by player
    const selectedIdx = selectedSquares.findIndex((s) => s.row === r && s.col === c);
    if (selectedIdx >= 0) {
      return { type: "selected", order: selectedIdx + 1 };
    }

    return { type: "idle" };
  };

  // Calculate cell size based on grid dimensions
  const maxWidth = Math.min(600, typeof window !== "undefined" ? window.innerWidth - 48 : 600);
  const cellSize = Math.floor(Math.min(maxWidth / cols, 400 / rows, 80));

  return (
    <div
      className="inline-grid gap-1.5 select-none"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const state = getCellState(r, c);

        let bg = "bg-zinc-800/60";
        let border = "border-zinc-700/50";
        let textColor = "text-white";
        let content = null;
        let shadow = "";

        if (state.type === "active") {
          bg = "";
          border = "border-transparent";
          textColor = "text-white font-bold";
          content = state.text || null;
          shadow = "shadow-lg shadow-purple-500/20";
        } else if (state.type === "highlighted") {
          bg = "bg-amber-500/80";
          border = "border-amber-400";
          shadow = "shadow-lg shadow-amber-500/30";
        } else if (state.type === "selected") {
          bg = "bg-purple-600/40";
          border = "border-purple-500/60";
          content = state.order;
        }

        return (
          <button
            key={`${r}-${c}`}
            disabled={!clickable}
            onClick={() => clickable && onCellClick(r, c)}
            className={`relative rounded-lg border-2 ${border} ${bg} 
              flex items-center justify-center text-sm font-mono
              transition-all duration-150 ${shadow}
              ${clickable ? "cursor-pointer hover:bg-zinc-700/80 hover:border-zinc-500 active:scale-95" : "cursor-default"}
            `}
            style={
              state.type === "active"
                ? { backgroundColor: state.colour || "#22c55e" }
                : undefined
            }
          >
            {content && (
              <span className={`${textColor} text-xs leading-tight text-center break-all`} style={{ fontSize: Math.max(9, cellSize / 6) }}>
                {content}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}