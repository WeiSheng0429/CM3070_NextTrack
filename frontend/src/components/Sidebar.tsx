// This file contains the Sidebar component, which provides settings for filtering and ranking song recommendations based on user preferences.
import { useEffect, useState } from "react";
import type { GenreOption, RecommendPreferences } from "../types";
import { color, font } from "../theme";
import { fetchGenreOptions } from "../api";

type SidebarProps = {
  preferences: RecommendPreferences;
  onPreferencesChange: (p: RecommendPreferences) => void;
  appliedPreferences: RecommendPreferences;
  onApply: () => void;
  canApply: boolean;
  applying: boolean;
  seedTags?: string[];
  seedYear?: number | null;
  seedArtist?: string | null;
};

function decadeLabel(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s (${decade}–${decade + 9})`;
}

// Slider-style toggle, redrawn with sharp corners to match the poster styling.
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: "relative",
        flexShrink: 0,
        width: "38px",
        height: "20px",
        borderRadius: "2px",
        border: "1px solid " + (checked ? color.violet : color.line),
        background: checked ? "rgba(124,58,237,0.25)" : color.surfaceRaised,
        cursor: "pointer",
        padding: 0,
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "19px" : "2px",
          width: "15px",
          height: "15px",
          borderRadius: "1px",
          background: checked ? color.violetBright : color.textFaint,
          transition: "left 0.2s ease, background 0.2s ease",
        }}
      />
    </button>
  );
}

// Multi-select genre chip. Unlike the toggle rows, several of these can be
// active at once — picking "K-Pop" + "Hip-Hop" narrows AND ranks matches
// of both genres higher, rather than just widening the filter.
function GenreChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        fontFamily: font.mono,
        fontSize: "11px",
        fontWeight: 600,
        padding: "5px 10px",
        borderRadius: "2px",
        border: `1px solid ${selected ? color.violet : color.line}`,
        background: selected ? "rgba(124,58,237,0.22)" : "transparent",
        color: selected ? color.violetBright : color.textMuted,
        cursor: "pointer",
        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

// Sidebar component for filtering and ranking song recommendations based on user preferences.
function SettingRow({
  label,
  checked,
  onToggle,
  children,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-2"
      style={{
        background: checked ? "rgba(124,58,237,0.08)" : color.surface,
        border: `1px solid ${checked ? "rgba(124,58,237,0.4)" : color.line}`,
        borderRadius: "2px",
        padding: "10px 12px",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold select-none"
          style={{ color: checked ? color.text : color.textMuted, cursor: "pointer" }}
          onClick={onToggle}
        >
          {label}
        </span>
        <Toggle checked={checked} onChange={onToggle} />
      </div>
      <div className="mt-1.5 text-xs leading-relaxed" style={{ color: color.textFaint }}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar({
  preferences,
  onPreferencesChange,
  appliedPreferences,
  onApply,
  canApply,
  applying,
  seedTags,
  seedYear,
  seedArtist,
}: SidebarProps) {
  const [genreOptions, setGenreOptions] = useState<GenreOption[]>([]);

  useEffect(() => {
    fetchGenreOptions()
      .then(setGenreOptions)
      .catch((err: unknown) => console.error("Failed to load genre options:", err));
  }, []);

  const toggle = (key: "sameDecade" | "sameArtist") => {
    onPreferencesChange({ ...preferences, [key]: !preferences[key] });
  };

  const toggleGenre = (id: string) => {
    const selected = preferences.genres.includes(id)
      ? preferences.genres.filter((g) => g !== id)
      : [...preferences.genres, id];
    onPreferencesChange({ ...preferences, genres: selected });
  };

  const visibleTags = seedTags?.slice(0, 5) ?? [];
  const selectedGenreLabels = genreOptions
    .filter((g) => preferences.genres.includes(g.id))
    .map((g) => g.label);

  const sameGenres = (a: string[], b: string[]) =>
    a.length === b.length && a.every((id) => b.includes(id));

  const isDirty =
    !sameGenres(preferences.genres, appliedPreferences.genres) ||
    preferences.sameDecade !== appliedPreferences.sameDecade ||
    preferences.sameArtist !== appliedPreferences.sameArtist;

  return (
    <aside
      className="flex flex-col gap-0 overflow-y-auto"
      style={{
        width: "240px",
        minWidth: "200px",
        background: color.surface,
        borderRight: `1px solid ${color.line}`,
        padding: "20px 16px",
        height: "100%",
      }}
    >
      <div
        style={{
          fontFamily: font.display,
          color: color.text,
          fontSize: "18px",
          letterSpacing: "0.02em",
          marginBottom: "4px",
        }}
      >
        SETTINGS
      </div>
      <div
        style={{
          width: "32px",
          height: "3px",
          background: color.pink,
          marginBottom: "16px",
        }}
      />

      <div
        style={{
          fontFamily: font.mono,
          color: color.textMuted,
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Genre, era &amp; artist
      </div>

      <div
        className="mb-2"
        style={{
          background: preferences.genres.length > 0 ? "rgba(124,58,237,0.08)" : color.surface,
          border: `1px solid ${preferences.genres.length > 0 ? "rgba(124,58,237,0.4)" : color.line}`,
          borderRadius: "2px",
          padding: "10px 12px",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
      >
        <span
          className="text-xs font-semibold select-none"
          style={{ color: preferences.genres.length > 0 ? color.text : color.textMuted }}
        >
          Genres
        </span>

        <div className="flex flex-wrap gap-1.5 mt-2 mb-1.5">
          {genreOptions.length === 0 ? (
            <span className="text-xs" style={{ color: color.textFaint }}>Loading genres…</span>
          ) : (
            genreOptions.map((g) => (
              <GenreChip
                key={g.id}
                label={g.label}
                selected={preferences.genres.includes(g.id)}
                onClick={() => toggleGenre(g.id)}
              />
            ))
          )}
        </div>

        <div className="text-xs leading-relaxed" style={{ color: color.textFaint }}>
          {preferences.genres.length === 0 ? (
            "Pick one or more genres to filter and rank recommendations. Selecting several (e.g. K-Pop + Hip-Hop) ranks songs matching more of them higher — not just a wider net."
          ) : (
            <>
              Only showing songs matching{" "}
              <span style={{ color: color.violetBright, fontWeight: 600 }}>
                {selectedGenreLabels.join(" and/or ")}
              </span>
              {preferences.genres.length > 1 && " — matching more of these ranks a song higher."}
            </>
          )}
        </div>

        {visibleTags.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${color.line}` }}>
            <div className="text-xs mb-1" style={{ color: color.textFaint }}>Seed track's own tags:</div>
            <div className="flex flex-wrap gap-1">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5"
                  style={{ background: "rgba(124,58,237,0.14)", color: color.violetBright, borderRadius: "2px" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <SettingRow label="Same decade" checked={preferences.sameDecade} onToggle={() => toggle("sameDecade")}>
        {preferences.sameDecade && seedYear ? (
          <>
            Only showing songs from the{" "}
            <span style={{ color: color.pink, fontWeight: 600 }}>{decadeLabel(seedYear)}</span>
          </>
        ) : preferences.sameDecade ? (
          "Search a song to see which decade will be used."
        ) : (
          "Filters to songs released in the same 10-year period (e.g. 2000–2009)."
        )}
      </SettingRow>

      <SettingRow label="Same artist" checked={preferences.sameArtist} onToggle={() => toggle("sameArtist")}>
        {preferences.sameArtist && seedArtist ? (
          <>
            Only showing songs by <span style={{ color: color.violetBright, fontWeight: 600 }}>{seedArtist}</span>
          </>
        ) : preferences.sameArtist ? (
          "Search a song to see which artist will be used."
        ) : (
          "Filters to songs from the same artist as your seed track."
        )}
      </SettingRow>

      <button
        type="button"
        onClick={onApply}
        disabled={!canApply || applying}
        style={{
          marginTop: "6px",
          width: "100%",
          padding: "9px 12px",
          borderRadius: "2px",
          fontFamily: font.display,
          fontSize: "13px",
          letterSpacing: "0.03em",
          border: `2px solid ${!canApply || applying ? color.line : isDirty ? color.pink : color.line}`,
          background: !canApply || applying ? "transparent" : isDirty ? color.pink : "transparent",
          color: !canApply || applying ? color.textFaint : isDirty ? color.ink : color.textMuted,
          cursor: !canApply || applying ? "not-allowed" : "pointer",
          transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
        }}
        title={
          !canApply
            ? "Search a track or start a session first"
            : isDirty
            ? "Apply your setting changes to update recommendations"
            : "Recommendations already match these settings"
        }
      >
        {applying ? "APPLYING…" : isDirty ? "APPLY SETTINGS" : "SETTINGS APPLIED"}
      </button>
      {isDirty && canApply && !applying && (
        <div className="mt-1.5 text-xs" style={{ color: color.pink }}>
          Unapplied changes — press Apply to update the list.
        </div>
      )}

      <div style={{ height: "1px", background: color.line, margin: "14px 0" }} />

      <div
        className="p-3 text-xs leading-relaxed"
        style={{ background: color.ink, border: `1px solid ${color.line}`, borderRadius: "2px", color: color.textMuted }}
      >
        <div className="font-semibold mb-1" style={{ color: color.textMuted }}>How it works</div>
        Recommendations compare Last.fm tags, MusicBrainz metadata, and collaborative similarity scoring across thousands of tracks.
      </div>
    </aside>
  );
}
