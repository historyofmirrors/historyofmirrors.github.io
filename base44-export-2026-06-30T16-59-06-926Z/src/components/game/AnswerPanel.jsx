import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ColourPicker from "@/components/game/ColourPicker";
import { getColourName } from "@/lib/gameDefaults";
import { Send, RotateCcw } from "lucide-react";

export default function AnswerPanel({
  settings,
  answerType,
  sequence,
  currentPrompt,
  selectedSquares,
  onSubmitAnswer,
  onUndoLastSquare,
  errorsRemaining,
}) {
  const [textInput, setTextInput] = useState("");
  const [selectedColour, setSelectedColour] = useState(
    settings.colour_enabled ? (settings.available_colours[0] || "#22c55e") : "#22c55e"
  );

  const handleSubmit = () => {
    onSubmitAnswer({
      text: settings.text_enabled ? textInput : undefined,
      colour: settings.colour_enabled ? selectedColour : "#22c55e",
    });
    setTextInput("");
    if (settings.colour_enabled) {
      setSelectedColour(settings.available_colours[0] || "#22c55e");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // For type A, show how many squares selected so far
  // For type B, show which square we're asking about
  // For type C, show the prompt

  const renderPromptInfo = () => {
    if (answerType === "A") {
      return (
        <div className="text-zinc-400 text-sm">
          Select squares in the order they appeared
          {selectedSquares.length > 0 && (
            <span className="text-emerald-400 ml-2">
              ({selectedSquares.length} / {sequence.length} selected)
            </span>
          )}
        </div>
      );
    }

    if (answerType === "B" && currentPrompt !== null) {
      const seqItem = sequence[currentPrompt];
      return (
        <div className="text-zinc-400 text-sm">
          What appeared on{" "}
          <span className="text-amber-400 font-medium">
            square #{currentPrompt + 1}
          </span>{" "}
          in the sequence? (row {seqItem.row + 1}, col {seqItem.col + 1})
        </div>
      );
    }

    if (answerType === "C" && currentPrompt) {
      if (currentPrompt.direction === "this") {
        return (
          <div className="text-zinc-400 text-sm">
            <span className="text-amber-400 font-medium">
              Provide details for the highlighted square
            </span>
          </div>
        );
      }
      return (
        <div className="text-zinc-400 text-sm">
          The highlighted square appeared at position{" "}
          <span className="text-amber-400 font-medium">#{currentPrompt.targetIndex + 1}</span>.
          {" "}Select & provide details for the square that was{" "}
          <span className="text-amber-400 font-medium">
            {currentPrompt.depth} {currentPrompt.depth === 1 ? "step" : "steps"} {currentPrompt.direction}
          </span>{" "}
          it in the sequence.
        </div>
      );
    }

    return null;
  };

  const needsSquareSelection = answerType === "A" || answerType === "C";
  const showTextInput = settings.text_enabled;
  const showColourPicker = settings.colour_enabled;

  // For type A, submit only available after selecting a square
  // For type B, submit is available immediately (no square selection)
  // For type C, submit after selecting a square
  const canSubmit =
    answerType === "B"
      ? true
      : answerType === "C"
      ? selectedSquares.length === 1
      : selectedSquares.length > 0;

  return (
    <div className="space-y-3 w-full max-w-lg">
      {renderPromptInfo()}

      {settings.fail_threshold_enabled && errorsRemaining !== null && (
        <div className="text-sm">
          <span className="text-zinc-500">Errors remaining: </span>
          <span className={errorsRemaining <= 1 ? "text-red-400 font-bold" : "text-zinc-300"}>
            {errorsRemaining}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {showColourPicker && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Colour</label>
            <ColourPicker
              colours={settings.available_colours}
              selected={selectedColour}
              onSelect={setSelectedColour}
            />
          </div>
        )}

        {showTextInput && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Text</label>
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter the text shown..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2">
          {needsSquareSelection && selectedSquares.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUndoLastSquare}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Undo
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
          >
            <Send className="w-4 h-4 mr-1" /> Submit
          </Button>
        </div>
      </div>
    </div>
  );
}