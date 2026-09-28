import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../utils";
import { color, font } from "../theme";

type SearchResult = {
  track: string;
  artist: string;
  listeners: number;
};

type SearchBarProps = {
  loading: boolean;
  onSearch: (track: string, artist: string) => void;
  variant?: "hero" | "compact";
  placeholder?: string;
  selected?: { track: string; artist: string } | null;
  onClearSelected?: () => void;
};

function formatListeners(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/** SearchBar component for searching tracks and artists. **/
export default function SearchBar({
  loading,
  onSearch,
  variant = "compact",
  placeholder,
  selected = null,
  onClearSelected,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.results.length > 0) {
          setResults(data.results);
          setOpen(true);
          setHighlighted(-1);
        } else {
          setResults([]);
          setOpen(false);
        }
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectResult = (r: SearchResult) => {
    setQuery("");
    setOpen(false);
    setResults([]);
    onSearch(r.track, r.artist);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && results[highlighted]) {
        selectResult(results[highlighted]);
      } else if (results[0]) {
        selectResult(results[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isHero = variant === "hero";

  // Render the selected chip if a selection exists
  if (selected) {
    return (
      <div
        className="flex items-center justify-between gap-2 w-full"
        style={{
          background: color.surface,
          border: `1px solid ${color.violet}`,
          borderLeft: `3px solid ${color.violet}`,
          borderRadius: "2px",
          padding: isHero ? "12px 16px" : "8px 10px",
        }}
      >
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <span style={{ fontSize: isHero ? "15px" : "13px", fontWeight: 700, color: color.text }}>
            {selected.track}
          </span>
          <span style={{ fontFamily: font.mono, fontSize: isHero ? "12px" : "10px", color: color.violetBright, marginLeft: "8px" }}>
            {selected.artist}
          </span>
        </div>
        {onClearSelected && (
          <button
            onClick={onClearSelected}
            aria-label="Clear selection"
            style={{ background: "none", border: "none", color: color.textFaint, cursor: "pointer", fontSize: "16px", lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          className="w-full outline-none transition-all"
          style={{
            background: color.surface,
            color: color.text,
            border: `2px solid ${focused ? color.pink : color.line}`,
            borderRadius: "2px",
            padding: isHero ? "14px 20px" : "7px 10px",
            fontSize: isHero ? "16px" : "13px",
          }}
          placeholder={placeholder ?? 'Search a track — e.g. "Shut Down BLACKPINK"'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            results.length > 0 && setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          spellCheck={false}
        />

        {searching && (
          <span
            style={{
              position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
              fontSize: isHero ? "16px" : "13px", color: color.textFaint, animation: "spin 1s linear infinite",
            }}
          >⟳</span>
        )}

        {!searching && loading && (
          <span
            style={{
              position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
              fontSize: isHero ? "16px" : "13px", color: color.violetBright, animation: "spin 1s linear infinite",
            }}
          >⟳</span>
        )}

        {open && results.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: color.surface,
              border: `1px solid ${color.line}`,
              borderTop: `2px solid ${color.violet}`,
              borderRadius: "2px",
              boxShadow: "0 12px 28px rgba(0,0,0,0.6)",
              zIndex: 100,
              overflow: "hidden",
              textAlign: "left",
            }}
          >
            {results.map((r, i) => (
              <div
                key={`${r.track}-${r.artist}-${i}`}
                onMouseDown={() => selectResult(r)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  cursor: "pointer",
                  background: i === highlighted ? color.surfaceRaised : "transparent",
                  borderBottom: i < results.length - 1 ? `1px solid ${color.line}` : "none",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ fontSize: "13px", color: color.textFaint, flexShrink: 0 }}>♪</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: color.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.track}
                  </div>
                  <div style={{ fontSize: "11px", color: color.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.artist}
                  </div>
                </div>

                {r.listeners > 0 && (
                  <div style={{ fontFamily: font.mono, fontSize: "10px", color: color.textFaint, flexShrink: 0 }}>
                    {formatListeners(r.listeners)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
