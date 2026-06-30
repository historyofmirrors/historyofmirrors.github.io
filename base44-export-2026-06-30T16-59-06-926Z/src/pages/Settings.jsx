const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { DEFAULT_SETTINGS, COLOUR_PRESETS, getColourName } from "@/lib/gameDefaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Save, Loader2, Plus, X, RotateCcw } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [customColour, setCustomColour] = useState("#ff0000");

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await db.entities.GameSettings.list();
        if (saved.length > 0) {
          setSettings({ ...DEFAULT_SETTINGS, ...saved[0] });
          setSettingsId(saved[0].id);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        await db.entities.GameSettings.update(settingsId, settings);
      } else {
        const created = await db.entities.GameSettings.create(settings);
        setSettingsId(created.id);
      }
      toast({ title: "Settings saved" });
    } catch (e) {
      toast({ title: "Error saving settings", variant: "destructive" });
    }
    setSaving(false);
  };

  const resetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const addColour = (hex) => {
    if (!settings.available_colours.includes(hex)) {
      update("available_colours", [...settings.available_colours, hex]);
    }
  };

  const removeColour = (hex) => {
    if (settings.available_colours.length <= 1) return;
    update(
      "available_colours",
      settings.available_colours.filter((c) => c !== hex)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const NumberInput = ({ label, value, onChange, min = 1, max = 100 }) => (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-zinc-300 text-sm shrink-0">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="w-20 bg-zinc-800 border-zinc-700 text-white text-center"
      />
    </div>
  );

  const ToggleRow = ({ label, checked, onChange, description }) => (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label className="text-zinc-300 text-sm">{label}</Label>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetDefaults}
            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {/* Grid */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Grid</h3>
        <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-zinc-800">
          <NumberInput label="Rows" value={settings.grid_rows} onChange={(v) => update("grid_rows", v)} min={2} max={10} />
          <NumberInput label="Columns" value={settings.grid_cols} onChange={(v) => update("grid_cols", v)} min={2} max={10} />
        </div>
      </section>

      {/* Sequence */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Sequence</h3>
        <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-zinc-800">
          <NumberInput
            label="Starting Length"
            value={settings.starting_sequence_length}
            onChange={(v) => update("starting_sequence_length", v)}
            min={1}
            max={10}
          />
          <ToggleRow
            label="Fixed Sequence Length"
            description="Sequence stays at starting length instead of increasing"
            checked={settings.fixed_sequence_length}
            onChange={(v) => update("fixed_sequence_length", v)}
          />
          <NumberInput
            label="Maximum Sequence Length"
            value={settings.max_sequence_length}
            onChange={(v) => update("max_sequence_length", v)}
            min={1}
            max={50}
          />
          <NumberInput
            label="Max Squares Shown At Once"
            value={settings.max_squares_shown}
            onChange={(v) => update("max_squares_shown", v)}
            min={1}
            max={10}
          />
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-zinc-300 text-sm shrink-0">Multi Square Delay</Label>
              <p className="text-xs text-zinc-500">Stagger between simultaneous squares (ms)</p>
            </div>
            <Input
              type="number"
              min={0}
              max={2000}
              step={10}
              value={settings.multi_square_delay}
              onChange={(e) => update("multi_square_delay", parseInt(e.target.value) || 0)}
              className="w-24 bg-zinc-800 border-zinc-700 text-white text-center"
            />
          </div>
          <Separator className="bg-zinc-800" />
          <ToggleRow
            label="Fail Threshold"
            description="Allow a set number of errors before game over"
            checked={settings.fail_threshold_enabled}
            onChange={(v) => update("fail_threshold_enabled", v)}
          />
          {settings.fail_threshold_enabled && (
            <NumberInput
              label="Errors Allowed"
              value={settings.fail_threshold}
              onChange={(v) => update("fail_threshold", v)}
              min={1}
              max={20}
            />
          )}
        </div>
      </section>

      {/* Text */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Text</h3>
        <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-zinc-800">
          <ToggleRow
            label="Enable Text"
            description="Random text appears on flashing squares"
            checked={settings.text_enabled}
            onChange={(v) => update("text_enabled", v)}
          />
          {settings.text_enabled && (
            <>
              <ToggleRow
                label="Allow Capitals"
                checked={settings.text_capitals}
                onChange={(v) => update("text_capitals", v)}
              />
              <div className="flex items-center gap-3">
                <Label className="text-zinc-300 text-sm shrink-0">Length Range</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.text_length_min}
                  onChange={(e) => update("text_length_min", parseInt(e.target.value) || 1)}
                  className="w-16 bg-zinc-800 border-zinc-700 text-white text-center"
                />
                <span className="text-zinc-500">to</span>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.text_length_max}
                  onChange={(e) => update("text_length_max", parseInt(e.target.value) || 1)}
                  className="w-16 bg-zinc-800 border-zinc-700 text-white text-center"
                />
              </div>
              <ToggleRow
                label="Include Numbers"
                checked={settings.text_numbers}
                onChange={(v) => update("text_numbers", v)}
              />
              <ToggleRow
                label="Numbers Only"
                checked={settings.text_numbers_only}
                onChange={(v) => update("text_numbers_only", v)}
              />
            </>
          )}
        </div>
      </section>

      {/* Colour */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Colour</h3>
        <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-zinc-800">
          <ToggleRow
            label="Enable Colours"
            description="Squares flash in different colours to remember"
            checked={settings.colour_enabled}
            onChange={(v) => update("colour_enabled", v)}
          />
          {settings.colour_enabled && (
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Available Colours</Label>
              <div className="flex flex-wrap gap-2">
                {settings.available_colours.map((hex) => (
                  <div key={hex} className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1">
                    <div
                      className="w-5 h-5 rounded border border-zinc-600"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs text-zinc-300">{getColourName(hex)}</span>
                    {settings.available_colours.length > 1 && (
                      <button onClick={() => removeColour(hex)} className="text-zinc-500 hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Label className="text-zinc-500 text-xs w-full">Quick add:</Label>
                {COLOUR_PRESETS.filter(
                  (p) => !settings.available_colours.includes(p.hex)
                ).map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => addColour(preset.hex)}
                    className="flex items-center gap-1 text-xs bg-zinc-800/60 border border-zinc-700 rounded px-2 py-1 hover:bg-zinc-700 text-zinc-400"
                  >
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: preset.hex }} />
                    {preset.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  value={customColour}
                  onChange={(e) => setCustomColour(e.target.value)}
                  className="w-10 h-8 p-0 border-zinc-700 bg-transparent cursor-pointer"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addColour(customColour)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Plus className="w-3 h-3 mr-1" /> Custom
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Answer Type */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Answer Type</h3>
        <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-zinc-800">
          <RadioGroup
            value={settings.answer_type}
            onValueChange={(v) => update("answer_type", v)}
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="A" id="type-a" className="mt-0.5" />
              <div>
                <Label htmlFor="type-a" className="text-zinc-300 text-sm font-medium cursor-pointer">
                  Type A — Sequential
                </Label>
                <p className="text-xs text-zinc-500">
                  Select squares in the order they appeared and provide text/colour info
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="B" id="type-b" className="mt-0.5" />
              <div>
                <Label htmlFor="type-b" className="text-zinc-300 text-sm font-medium cursor-pointer">
                  Type B — Random Recall
                </Label>
                <p className="text-xs text-zinc-500">
                  A random square is chosen — provide its text/colour details (no location)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="C" id="type-c" className="mt-0.5" />
              <div>
                <Label htmlFor="type-c" className="text-zinc-300 text-sm font-medium cursor-pointer">
                  Type C — Relative Recall
                </Label>
                <p className="text-xs text-zinc-500">
                  A square is highlighted — select & describe the square T steps before/after it
                </p>
              </div>
            </div>
          </RadioGroup>

          {settings.answer_type === "C" && (
            <div className="mt-3 space-y-2 pl-6">
              <Label className="text-zinc-400 text-xs">Depth (T) Range</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={9}
                  value={settings.answer_type_c_depth_min}
                  onChange={(e) => update("answer_type_c_depth_min", parseInt(e.target.value) || 1)}
                  className="w-16 bg-zinc-800 border-zinc-700 text-white text-center"
                />
                <span className="text-zinc-500">to</span>
                <Input
                  type="number"
                  min={1}
                  max={9}
                  value={settings.answer_type_c_depth_max}
                  onChange={(e) => update("answer_type_c_depth_max", parseInt(e.target.value) || 1)}
                  className="w-16 bg-zinc-800 border-zinc-700 text-white text-center"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Timing */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Timing</h3>
        <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-zinc-300 text-sm">Flash Time</Label>
              <p className="text-xs text-zinc-500">How long each square is visible (ms)</p>
            </div>
            <Input
              type="number"
              min={100}
              max={10000}
              step={100}
              value={settings.flash_time}
              onChange={(e) => update("flash_time", parseInt(e.target.value) || 1000)}
              className="w-24 bg-zinc-800 border-zinc-700 text-white text-center"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-zinc-300 text-sm">Wait Time</Label>
              <p className="text-xs text-zinc-500">Gap between squares (ms)</p>
            </div>
            <Input
              type="number"
              min={0}
              max={5000}
              step={100}
              value={settings.waiting_time}
              onChange={(e) => update("waiting_time", parseInt(e.target.value) || 500)}
              className="w-24 bg-zinc-800 border-zinc-700 text-white text-center"
            />
          </div>
        </div>
      </section>

      {/* Bottom save */}
      <div className="pt-2 pb-8">
        <Button
          onClick={save}
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}