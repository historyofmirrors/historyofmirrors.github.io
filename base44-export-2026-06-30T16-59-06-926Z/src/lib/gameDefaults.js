export const DEFAULT_SETTINGS = {
  grid_rows: 4,
  grid_cols: 4,
  starting_sequence_length: 1,
  fixed_sequence_length: false,
  max_sequence_length: 10,
  max_squares_shown: 1,
  multi_square_delay: 50,
  fail_threshold_enabled: false,
  fail_threshold: 0,
  text_enabled: false,
  text_capitals: false,
  text_length_min: 1,
  text_length_max: 1,
  text_numbers: false,
  text_numbers_only: false,
  colour_enabled: false,
  available_colours: ["#a855f7"],
  answer_type: "A",
  answer_type_c_depth_min: 1,
  answer_type_c_depth_max: 1,
  flash_time: 1000,
  waiting_time: 500,
};

export const COLOUR_PRESETS = [
  { name: "Green", hex: "#22c55e" },
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "White", hex: "#ffffff" },
];

export function getColourName(hex) {
  const preset = COLOUR_PRESETS.find(c => c.hex.toLowerCase() === String(hex).toLowerCase());
  return preset ? preset.name : hex;
}