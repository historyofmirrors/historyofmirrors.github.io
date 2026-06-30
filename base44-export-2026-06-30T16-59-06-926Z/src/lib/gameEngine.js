// Game engine: generates sequences, validates answers

export function generateRandomText(settings) {
  const { text_capitals, text_length_min, text_length_max, text_numbers, text_numbers_only } = settings;
  const len = text_length_min + Math.floor(Math.random() * (text_length_max - text_length_min + 1));

  let chars = "";
  if (text_numbers_only) {
    chars = "0123456789";
  } else {
    chars = "abcdefghijklmnopqrstuvwxyz";
    if (text_capitals) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (text_numbers) chars += "0123456789";
  }

  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateRandomColour(settings) {
  const { available_colours } = settings;
  if (!available_colours || available_colours.length === 0) return "#22c55e";
  return available_colours[Math.floor(Math.random() * available_colours.length)];
}

export function generateSequence(length, settings) {
  const { grid_rows, grid_cols, text_enabled, colour_enabled } = settings;
  const totalCells = grid_rows * grid_cols;
  const sequence = [];

  for (let i = 0; i < length; i++) {
    const cellIndex = Math.floor(Math.random() * totalCells);
    const row = Math.floor(cellIndex / grid_cols);
    const col = cellIndex % grid_cols;

    const item = { row, col, index: i };

    if (text_enabled) {
      item.text = generateRandomText(settings);
    }

    if (colour_enabled) {
      item.colour = generateRandomColour(settings);
    } else {
      item.colour = "#22c55e";
    }

    sequence.push(item);
  }

  return sequence;
}

export function generateAnswerTypeCPrompts(sequence, settings) {
  const len = sequence.length;
  if (len <= 1) {
    return [{ targetIndex: 0, askIndex: 0, direction: "this", depth: 0 }];
  }

  const { answer_type_c_depth_min, answer_type_c_depth_max } = settings;
  const prompts = [];
  const answered = new Set();
  const remaining = new Set(Array.from({ length: len }, (_, i) => i));

  // We need to eventually get answers for all squares
  // Strategy: show a square, ask about one that is T before/after
  while (remaining.size > 0) {
    // Pick a square to highlight (one we've already answered or any)
    const highlightCandidates = Array.from({ length: len }, (_, i) => i);
    
    let found = false;
    // Shuffle candidates
    for (let i = highlightCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [highlightCandidates[i], highlightCandidates[j]] = [highlightCandidates[j], highlightCandidates[i]];
    }

    for (const highlightIdx of highlightCandidates) {
      // Try random depths and directions
      const depthRange = [];
      for (let d = answer_type_c_depth_min; d <= answer_type_c_depth_max; d++) {
        depthRange.push(d);
      }
      // Shuffle depths
      for (let i = depthRange.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [depthRange[i], depthRange[j]] = [depthRange[j], depthRange[i]];
      }

      const directions = ["before", "after"];
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }

      for (const depth of depthRange) {
        for (const dir of directions) {
          const askIdx = dir === "before" ? highlightIdx - depth : highlightIdx + depth;
          if (askIdx >= 0 && askIdx < len && remaining.has(askIdx)) {
            prompts.push({
              targetIndex: highlightIdx,
              askIndex: askIdx,
              direction: dir,
              depth,
            });
            remaining.delete(askIdx);
            answered.add(askIdx);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    // Fallback: if no valid prompt found, just ask directly
    if (!found) {
      const nextIdx = remaining.values().next().value;
      prompts.push({
        targetIndex: nextIdx,
        askIndex: nextIdx,
        direction: "this",
        depth: 0,
      });
      remaining.delete(nextIdx);
      answered.add(nextIdx);
    }
  }

  return prompts;
}

export function generateAnswerTypeBOrder(sequenceLength) {
  const indices = Array.from({ length: sequenceLength }, (_, i) => i);
  // Shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}