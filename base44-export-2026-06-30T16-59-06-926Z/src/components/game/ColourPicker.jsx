import React from "react";
import { getColourName } from "@/lib/gameDefaults";
import { Check } from "lucide-react";

export default function ColourPicker({ colours, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colours.map((hex) => (
        <button
          key={hex}
          onClick={() => onSelect(hex)}
          className={`relative w-10 h-10 rounded-lg border-2 transition-all duration-150 flex items-center justify-center
            ${selected === hex ? "border-white scale-110 shadow-lg" : "border-zinc-600 hover:border-zinc-400 hover:scale-105"}
          `}
          style={{ backgroundColor: hex }}
          title={getColourName(hex)}
        >
          {selected === hex && (
            <Check className="w-5 h-5" style={{ color: hex === "#ffffff" ? "#000" : "#fff" }} />
          )}
        </button>
      ))}
    </div>
  );
}