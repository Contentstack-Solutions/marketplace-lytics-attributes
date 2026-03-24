import React, { useState, useMemo } from "react";
import { LyticsAttribute } from "../common/types/types";
import { buildAttributeToken } from "../common/utils/functions";
import localeTexts from "../common/locales/en-us";

interface AttributePickerProps {
  attributes: LyticsAttribute[];
  loading: boolean;
  error: string | null;
  onInsert: (token: string) => void;
  onCancel?: () => void;
  /** Use inline styles only (for RTE modal compatibility) */
  inline?: boolean;
}

export const AttributePicker: React.FC<AttributePickerProps> = ({
  attributes,
  loading,
  error,
  onInsert,
  onCancel,
  inline,
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [defaultValue, setDefaultValue] = useState("");

  const t = localeTexts.AttributePicker;

  const filtered = useMemo(() => {
    if (!search) return attributes;
    const q = search.toLowerCase();
    return attributes.filter(
      (a) =>
        a.slug.toLowerCase().includes(q) ||
        a.display_name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [attributes, search]);

  const handleInsert = () => {
    if (!selected) return;
    const token = buildAttributeToken(selected, defaultValue || undefined);
    onInsert(token);
  };

  const baseStyles: Record<string, React.CSSProperties> = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: "14px",
    },
    searchInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    list: {
      maxHeight: "280px",
      overflowY: "auto",
      border: "1px solid #eee",
      borderRadius: "4px",
    },
    item: {
      padding: "8px 12px",
      cursor: "pointer",
      borderBottom: "1px solid #f5f5f5",
      transition: "background 0.1s",
    },
    itemSelected: {
      padding: "8px 12px",
      cursor: "pointer",
      borderBottom: "1px solid #f5f5f5",
      backgroundColor: "#e8f0fe",
    },
    slug: {
      fontFamily: "monospace",
      fontWeight: 600,
      fontSize: "13px",
      color: "#1a56db",
    },
    meta: {
      fontSize: "12px",
      color: "#666",
      marginTop: "2px",
    },
    footer: {
      display: "flex",
      gap: "8px",
      alignItems: "flex-end",
    },
    defaultInput: {
      flex: 1,
      padding: "8px 12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
    },
    btnPrimary: {
      padding: "8px 16px",
      backgroundColor: "#1a56db",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 500,
    },
    btnSecondary: {
      padding: "8px 16px",
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    },
    message: {
      padding: "16px",
      textAlign: "center",
      color: "#666",
    },
    errorMsg: {
      padding: "8px 12px",
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      borderRadius: "4px",
      fontSize: "13px",
    },
  };

  // If not inline mode, we can use classNames (but for now keep styles consistent)
  const s = inline ? baseStyles : baseStyles;

  if (loading) {
    return <div style={s.message}>{t.loading}</div>;
  }

  if (error) {
    return <div style={s.errorMsg}>{error}</div>;
  }

  if (attributes.length === 0) {
    return <div style={s.message}>{t.noAttributes}</div>;
  }

  return (
    <div style={s.container}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.search}
        style={s.searchInput}
      />

      <div style={s.list}>
        {filtered.length === 0 && (
          <div style={s.message}>{t.noResults}</div>
        )}
        {filtered.map((attr) => (
          <div
            key={attr.slug}
            style={selected === attr.slug ? s.itemSelected : s.item}
            onClick={() => setSelected(attr.slug)}
            onMouseEnter={(e) => {
              if (selected !== attr.slug) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb";
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== attr.slug) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
              }
            }}
          >
            <div style={s.slug}>{attr.slug}</div>
            {(attr.display_name !== attr.slug || attr.description) && (
              <div style={s.meta}>
                {attr.display_name !== attr.slug && <span>{attr.display_name}</span>}
                {attr.display_name !== attr.slug && attr.description && <span> — </span>}
                {attr.description && <span>{attr.description}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
            {t.defaultValueLabel}
          </label>
          <input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder={t.defaultValuePlaceholder}
            style={s.defaultInput}
          />
        </div>
      )}

      <div style={s.footer}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={s.btnSecondary}>
            {t.cancel}
          </button>
        )}
        <button
          type="button"
          onClick={handleInsert}
          disabled={!selected}
          style={{
            ...s.btnPrimary,
            opacity: selected ? 1 : 0.5,
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          {t.insert}
        </button>
      </div>
    </div>
  );
};
