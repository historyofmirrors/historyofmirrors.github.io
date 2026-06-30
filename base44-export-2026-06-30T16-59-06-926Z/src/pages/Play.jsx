const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef, useCallback } from "react";

import GameGrid from "@/components/game/GameGrid";
import AnswerPanel from "@/components/game/AnswerPanel";
import { DEFAULT_SETTINGS } from "@/lib/gameDefaults";
import {
  generateSequence,
  generateAnswerTypeBOrder,
  generateAnswerTypeCPrompts,
} from "@/lib/gameEngine";
import { Button } from "@/components/ui/button";
import { Play as PlayIcon, Pause, Square, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const GAME_STATES = {
  IDLE: "idle",
  SHOWING: "showing",
  ANSWERING: "answering",
  PAUSED: "paused",
  GAME_OVER: "game_over",
  BETWEEN: "between",
};

export default function PlayPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [sequence, setSequence] = useState([]);
  const [currentSequenceLength, setCurrentSequenceLength] = useState(1);
  const [activeSquares, setActiveSquares] = useState([]);
  const [selectedSquares, setSelectedSquares] = useState([]);
  const [showIndex, setShowIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState(null);

  // Answer type B/C state
  const [typeBOrder, setTypeBOrder] = useState([]);
  const [typeBCurrentIdx, setTypeBCurrentIdx] = useState(0);
  const [typeCPrompts, setTypeCPrompts] = useState([]);
  const [typeCCurrentIdx, setTypeCCurrentIdx] = useState(0);

  // Stats tracking
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [answerStartTime, setAnswerStartTime] = useState(null);
  const [answerTimes, setAnswerTimes] = useState([]);
  const [sequenceLengthsReached, setSequenceLengthsReached] = useState([]);
  const [locationCorrect, setLocationCorrect] = useState(0);
  const [locationTotal, setLocationTotal] = useState(0);
  const [colourCorrect, setColourCorrect] = useState(0);
  const [colourTotal, setColourTotal] = useState(0);
  const [textCorrect, setTextCorrect] = useState(0);
  const [textTotal, setTextTotal] = useState(0);
  const [correctnessByPosition, setCorrectnessByPosition] = useState({});
  const [errorsRemaining, setErrorsRemaining] = useState(null);
  const [sequencesCompleted, setSequencesCompleted] = useState(0);

  const timeoutsRef = useRef([]);
  const pausedRef = useRef(false);
  const gameStateRef = useRef(gameState);

  const scheduleTimeout = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  };

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Load settings — re-load when component mounts (tab switch)
  const loadSettings = useCallback(async () => {
    try {
      const saved = await db.entities.GameSettings.list();
      if (saved.length > 0) {
        const merged = { ...DEFAULT_SETTINGS, ...saved[0] };
        setSettings(merged);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    setLoadingSettings(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const resetStats = () => {
    setAnswerTimes([]);
    setSequenceLengthsReached([]);
    setLocationCorrect(0);
    setLocationTotal(0);
    setColourCorrect(0);
    setColourTotal(0);
    setTextCorrect(0);
    setTextTotal(0);
    setCorrectnessByPosition({});
    setSequencesCompleted(0);
  };

  const startGame = () => {
    const startLen = settings.starting_sequence_length || 1;
    setCurrentSequenceLength(startLen);
    setErrors(0);
    setErrorsRemaining(
      settings.fail_threshold_enabled ? settings.fail_threshold : null
    );
    setGameState(GAME_STATES.BETWEEN);
    setSessionStartTime(new Date().toISOString());
    resetStats();
    setTimeout(() => startSequence(startLen), 500);
  };

  const startSequence = (length) => {
    const seq = generateSequence(length, settings);
    setSequence(seq);
    setSelectedSquares([]);
    setShowIndex(0);
    setHighlightedCell(null);
    setGameState(GAME_STATES.SHOWING);
    showSequence(seq, 0);
  };

  const showSequence = (seq, startIdx) => {
    if (startIdx >= seq.length) {
      // Done showing, move to answering
      setActiveSquares([]);
      setGameState(GAME_STATES.ANSWERING);
      setAnswerStartTime(Date.now());

      // Setup answer type specifics
      if (settings.answer_type === "B") {
        const order = generateAnswerTypeBOrder(seq.length);
        setTypeBOrder(order);
        setTypeBCurrentIdx(0);
      } else if (settings.answer_type === "C") {
        const prompts = generateAnswerTypeCPrompts(seq, settings);
        setTypeCPrompts(prompts);
        setTypeCCurrentIdx(0);
        if (prompts.length > 0) {
          setHighlightedCell(seq[prompts[0].targetIndex]);
        }
      }
      return;
    }

    // Show current batch of squares — stagger them with multi_square_delay
    // so the order is visible when more than one is shown at once.
    const batchEnd = Math.min(startIdx + settings.max_squares_shown, seq.length);
    const batch = seq.slice(startIdx, batchEnd);
    setShowIndex(startIdx);
    setActiveSquares([]);

    const delay = settings.multi_square_delay || 0;
    batch.forEach((sq, i) => {
      const t = setTimeout(() => {
        if (pausedRef.current) return;
        setActiveSquares((prev) => [...prev, sq]);
      }, i * delay);
      timeoutsRef.current.push(t);
    });

    // Keep them lit for flash_time, then turn off and wait before next batch
    const offTime = Math.max(settings.flash_time, (batch.length - 1) * delay + 50);
    const tOff = setTimeout(() => {
      if (pausedRef.current) return;
      setActiveSquares([]);

      const tNext = setTimeout(() => {
        if (pausedRef.current) return;
        showSequence(seq, batchEnd);
      }, settings.waiting_time);
      timeoutsRef.current.push(tNext);
    }, offTime);
    timeoutsRef.current.push(tOff);
  };

  const pauseGame = () => {
    pausedRef.current = true;
    clearTimeouts();
    setGameState(GAME_STATES.PAUSED);
  };

  const resumeGame = () => {
    pausedRef.current = false;
    if (gameStateRef.current === GAME_STATES.PAUSED) {
      // Resume from showing
      setGameState(GAME_STATES.SHOWING);
      showSequence(sequence, showIndex + settings.max_squares_shown);
    }
  };

  const endGame = async (reason = "quit") => {
    pausedRef.current = false;
    clearTimeouts();
    setActiveSquares([]);
    setHighlightedCell(null);
    setGameState(GAME_STATES.GAME_OVER);

    // Save session
    if (sessionStartTime) {
      try {
        await db.entities.GameSession.create({
          settings: { ...settings },
          started_at: sessionStartTime,
          ended_at: new Date().toISOString(),
          sequences_completed: sequencesCompleted,
          max_sequence_length: Math.max(...(sequenceLengthsReached.length ? sequenceLengthsReached : [currentSequenceLength])),
          min_sequence_length: Math.min(...(sequenceLengthsReached.length ? sequenceLengthsReached : [currentSequenceLength])),
          answer_times: answerTimes,
          sequence_lengths_reached: sequenceLengthsReached.length ? sequenceLengthsReached : [currentSequenceLength],
          location_correct: locationCorrect,
          location_total: locationTotal,
          colour_correct: colourCorrect,
          colour_total: colourTotal,
          text_correct: textCorrect,
          text_total: textTotal,
          correctness_by_position: correctnessByPosition,
          game_over_reason: reason,
        });
      } catch (e) {
        console.error("Failed to save session", e);
      }
    }
  };

  const handleCellClick = (row, col) => {
    if (gameState !== GAME_STATES.ANSWERING) return;

    if (settings.answer_type === "A") {
      // Add square to selection
      setSelectedSquares((prev) => [...prev, { row, col }]);
    } else if (settings.answer_type === "C") {
      // Select the answer square for current prompt
      setSelectedSquares([{ row, col }]);
    }
    // Type B doesn't need cell clicks
  };

  const handleUndoLastSquare = () => {
    setSelectedSquares((prev) => prev.slice(0, -1));
  };

  const recordAnswerTime = () => {
    if (answerStartTime) {
      const elapsed = Date.now() - answerStartTime;
      setAnswerTimes((prev) => [...prev, elapsed]);
      setAnswerStartTime(Date.now());
    }
  };

  const recordPositionCorrectness = (position, correct) => {
    setCorrectnessByPosition((prev) => {
      const key = String(position);
      const existing = prev[key] || { correct: 0, total: 0 };
      return {
        ...prev,
        [key]: {
          correct: existing.correct + (correct ? 1 : 0),
          total: existing.total + 1,
        },
      };
    });
  };

  const handleSubmitAnswer = ({ text, colour }) => {
    recordAnswerTime();

    if (settings.answer_type === "A") {
      handleTypeASubmit(text, colour);
    } else if (settings.answer_type === "B") {
      handleTypeBSubmit(text, colour);
    } else if (settings.answer_type === "C") {
      handleTypeCSubmit(text, colour);
    }
  };

  const handleTypeASubmit = (text, colour) => {
    const currentIdx = selectedSquares.length - 1;
    if (currentIdx < 0 || currentIdx >= sequence.length) return;

    const expected = sequence[currentIdx];
    const submitted = selectedSquares[currentIdx];

    let correct = true;
    let locationOk = submitted.row === expected.row && submitted.col === expected.col;

    setLocationTotal((p) => p + 1);
    if (locationOk) setLocationCorrect((p) => p + 1);
    if (!locationOk) correct = false;

    if (settings.colour_enabled) {
      setColourTotal((p) => p + 1);
      if (colour === expected.colour) setColourCorrect((p) => p + 1);
      else correct = false;
    }

    if (settings.text_enabled) {
      setTextTotal((p) => p + 1);
      if (text === expected.text) setTextCorrect((p) => p + 1);
      else correct = false;
    }

    recordPositionCorrectness(currentIdx, correct);

    if (!correct) {
      handleError();
      return;
    }

    // Check if sequence complete
    if (selectedSquares.length >= sequence.length) {
      handleSequenceComplete();
    }
  };

  const handleTypeBSubmit = (text, colour) => {
    const askIdx = typeBOrder[typeBCurrentIdx];
    const expected = sequence[askIdx];

    let correct = true;

    // No location check for type B
    if (settings.colour_enabled) {
      setColourTotal((p) => p + 1);
      if (colour === expected.colour) setColourCorrect((p) => p + 1);
      else correct = false;
    }

    if (settings.text_enabled) {
      setTextTotal((p) => p + 1);
      if (text === expected.text) setTextCorrect((p) => p + 1);
      else correct = false;
    }

    recordPositionCorrectness(askIdx, correct);

    if (!correct) {
      handleError();
      return;
    }

    const nextIdx = typeBCurrentIdx + 1;
    if (nextIdx >= typeBOrder.length) {
      handleSequenceComplete();
    } else {
      setTypeBCurrentIdx(nextIdx);
    }
  };

  const handleTypeCSubmit = (text, colour) => {
    const prompt = typeCPrompts[typeCCurrentIdx];
    if (!prompt) return;

    const expected = sequence[prompt.askIndex];
    const submitted = selectedSquares[0];

    let correct = true;

    if (prompt.direction !== "this") {
      // Check location
      let locationOk =
        submitted && submitted.row === expected.row && submitted.col === expected.col;
      setLocationTotal((p) => p + 1);
      if (locationOk) setLocationCorrect((p) => p + 1);
      else correct = false;
    }

    if (settings.colour_enabled) {
      setColourTotal((p) => p + 1);
      if (colour === expected.colour) setColourCorrect((p) => p + 1);
      else correct = false;
    }

    if (settings.text_enabled) {
      setTextTotal((p) => p + 1);
      if (text === expected.text) setTextCorrect((p) => p + 1);
      else correct = false;
    }

    recordPositionCorrectness(prompt.askIndex, correct);

    if (!correct) {
      handleError();
      return;
    }

    const nextIdx = typeCCurrentIdx + 1;
    if (nextIdx >= typeCPrompts.length) {
      handleSequenceComplete();
    } else {
      setTypeCCurrentIdx(nextIdx);
      setSelectedSquares([]);
      setHighlightedCell(sequence[typeCPrompts[nextIdx].targetIndex]);
    }
  };

  const handleError = () => {
    if (settings.fail_threshold_enabled) {
      const remaining = (errorsRemaining ?? settings.fail_threshold) - 1;
      setErrorsRemaining(remaining);
      if (remaining <= 0) {
        toast({ title: "Game Over", description: "Too many errors!", variant: "destructive" });
        endGame("failed");
        return;
      }
      toast({ title: "Incorrect!", description: `${remaining} error${remaining !== 1 ? "s" : ""} remaining — restarting sequence`, variant: "destructive" });
      // Restart the same sequence immediately
      clearTimeouts();
      setSelectedSquares([]);
      setHighlightedCell(null);
      setTypeBCurrentIdx(0);
      setTypeCCurrentIdx(0);
      setGameState(GAME_STATES.SHOWING);
      showSequence(sequence, 0);
    } else {
      toast({ title: "Game Over", description: "Incorrect answer!", variant: "destructive" });
      endGame("failed");
    }
  };

  const handleSequenceComplete = () => {
    setSequencesCompleted((p) => p + 1);
    const reached = currentSequenceLength;
    setSequenceLengthsReached((prev) => [...prev, reached]);

    toast({ title: "Correct!", description: `Sequence of ${reached} completed!` });

    let nextLength;
    if (settings.fixed_sequence_length) {
      nextLength = settings.starting_sequence_length;
    } else {
      nextLength = reached + 1;
      if (nextLength > settings.max_sequence_length) {
        toast({ title: "You Win!", description: "Maximum sequence length reached!" });
        endGame("completed");
        return;
      }
    }

    setCurrentSequenceLength(nextLength);
    setSelectedSquares([]);
    setHighlightedCell(null);
    setErrors(0);
    if (settings.fail_threshold_enabled) {
      setErrorsRemaining(settings.fail_threshold);
    }

    setGameState(GAME_STATES.BETWEEN);
    setTimeout(() => startSequence(nextLength), 1200);
  };

  const currentBPrompt =
    settings.answer_type === "B" && typeBOrder.length > 0
      ? typeBOrder[typeBCurrentIdx]
      : null;

  const currentCPrompt =
    settings.answer_type === "C" && typeCPrompts.length > 0
      ? typeCPrompts[typeCCurrentIdx]
      : null;

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 min-h-full">
      {/* Status bar */}
      <div className="flex items-center gap-4 text-sm text-zinc-400">
        {gameState !== GAME_STATES.IDLE && gameState !== GAME_STATES.GAME_OVER && (
          <>
            <span>
              Sequence: <span className="text-white font-semibold">{currentSequenceLength}</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              Type: <span className="text-white font-semibold">{settings.answer_type}</span>
            </span>
          </>
        )}
        {gameState === GAME_STATES.GAME_OVER && (
          <span className="text-red-400 font-medium">Game Over</span>
        )}
      </div>

      {/* Game grid */}
      <div className="flex-1 flex items-center justify-center">
        <GameGrid
          rows={settings.grid_rows}
          cols={settings.grid_cols}
          activeSquares={activeSquares}
          selectedSquares={selectedSquares}
          onCellClick={handleCellClick}
          clickable={
            gameState === GAME_STATES.ANSWERING &&
            settings.answer_type !== "B"
          }
          highlightedCell={
            highlightedCell ||
            (gameState === GAME_STATES.ANSWERING &&
              settings.answer_type === "B" &&
              typeBOrder.length > 0
              ? sequence[typeBOrder[typeBCurrentIdx]]
              : null)
          }
        />
      </div>

      {/* Showing phase indicator */}
      {gameState === GAME_STATES.SHOWING && (
        <div className="text-zinc-400 text-sm animate-pulse">Watch the sequence...</div>
      )}

      {gameState === GAME_STATES.BETWEEN && (
        <div className="text-zinc-400 text-sm animate-pulse">
          Get ready — sequence of {currentSequenceLength}...
        </div>
      )}

      {/* Answer panel */}
      {gameState === GAME_STATES.ANSWERING && (
        <AnswerPanel
          settings={settings}
          answerType={settings.answer_type}
          sequence={sequence}
          currentPrompt={
            settings.answer_type === "B"
              ? currentBPrompt
              : settings.answer_type === "C"
              ? currentCPrompt
              : null
          }
          selectedSquares={selectedSquares}
          onSubmitAnswer={handleSubmitAnswer}
          onUndoLastSquare={handleUndoLastSquare}
          errorsRemaining={errorsRemaining}
        />
      )}

      {/* Controls */}
      <div className="flex gap-3 pb-4">
        {gameState === GAME_STATES.IDLE || gameState === GAME_STATES.GAME_OVER ? (
          <Button
            onClick={startGame}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            {gameState === GAME_STATES.GAME_OVER ? "Play Again" : "Start Game"}
          </Button>
        ) : (
          <>
            {gameState === GAME_STATES.PAUSED ? (
              <Button
                onClick={resumeGame}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <PlayIcon className="w-4 h-4 mr-2" /> Resume
              </Button>
            ) : gameState === GAME_STATES.SHOWING ? (
              <Button
                onClick={pauseGame}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Pause className="w-4 h-4 mr-2" /> Pause
              </Button>
            ) : null}
            <Button
              onClick={() => endGame("quit")}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-900/30"
            >
              <Square className="w-4 h-4 mr-2" /> End Game
            </Button>
          </>
        )}
      </div>
    </div>
  );
}