import ContentstackAppSDK, { PluginBuilder } from "@contentstack/app-sdk";
import React from "react";
import ReactDOM from "react-dom";
import { LyticsAttribute, LyticsAttributesAppConfig } from "./common/types/types";

const ELEMENT_TYPE = "lytics-attribute";

function getServerBaseUrl(): string {
  const scripts = document.querySelectorAll("script[src*='json-rte.js']");
  for (let i = 0; i < scripts.length; i++) {
    const src = (scripts[i] as HTMLScriptElement).src;
    if (src) return new URL(src).origin;
  }
  return "";
}

const TRANSFORMS = [
  { value: "", label: "None" },
  { value: "lowercase", label: "lowercase" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "capitalize", label: "Capitalize First Letter" },
  { value: "titlecase", label: "Capitalize Each Word" },
];

const NUMBER_FORMATS = [
  { value: "", label: "None" },
  { value: "number", label: "1,234" },
  { value: "currency", label: "$1,234.00" },
  { value: "decimal2", label: "1234.00" },
  { value: "percent", label: "85%" },
];

const ToolbarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function getTokenParts(attrs: Record<string, string>): { slug: string; defaultValue: string } | null {
  const slug = attrs?.["lytics-slug"];
  if (!slug) return null;
  return { slug, defaultValue: attrs?.["lytics-default"] || "" };
}

function buildDisplayLabel(attrs: Record<string, string>): string {
  const slug = attrs?.["lytics-slug"] || "";
  const parts = [slug];
  const t = attrs?.["lytics-transform"];
  const f = attrs?.["lytics-format"];
  const d = attrs?.["lytics-default"];
  if (t) parts.push(t);
  if (f) parts.push(f);
  if (d) parts.push(d);
  return `{{${parts.join("|")}}}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LyticsAttributePlugin = new PluginBuilder(ELEMENT_TYPE)
  .title("Lytics Attribute")
  .icon(<ToolbarIcon />)
  .display(["toolbar"])
  .elementType(["inline", "void"])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .render((props: any) => {
    try {
      const parts = getTokenParts(props?.element?.attrs || {});
      if (!parts) return <span {...props.attributes}>{props.children}</span>;

      const label = buildDisplayLabel(props.element.attrs);

      return (
        <span
          {...props.attributes}
          contentEditable={false}
          style={{
            display: "inline",
            backgroundColor: "#f0edfc",
            color: "#6c5ce7",
            border: "1px solid #d5cff5",
            borderRadius: "4px",
            padding: "1px 6px",
            fontSize: "0.85em",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            cursor: "default",
          }}
        >
          {label}
          {props.children}
        </span>
      );
    } catch (err) {
      console.error("[lytics-attribute] RTE render error:", err);
      return <span {...props.attributes}>{props.children}</span>;
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .on("exec", (rte: any) => {
    const savedSelection = rte.selection.get();

    let modalRoot: HTMLDivElement | null = null;
    let modalContent: HTMLDivElement | null = null;

    const cleanup = () => {
      if (modalContent) {
        ReactDOM.unmountComponentAtNode(modalContent);
        modalContent = null;
      }
      if (modalRoot) {
        modalRoot.remove();
        modalRoot = null;
      }
    };

    const insertAttribute = (slug: string, transform: string, numberFormat: string, defaultValue: string) => {
      cleanup();

      if (savedSelection) {
        rte.selection.set(savedSelection);
      }

      const uid = Math.random().toString(36).slice(2, 11);
      const node = {
        uid,
        type: ELEMENT_TYPE,
        attrs: {
          "lytics-slug": slug,
          "lytics-transform": transform || undefined,
          "lytics-format": numberFormat || undefined,
          "lytics-default": defaultValue || undefined,
        },
        children: [{ text: "" }],
      };

      const editor = rte._adv?.editor;
      const Transforms = rte._adv?.Transforms;
      if (editor && Transforms) {
        Transforms.insertNodes(editor, node, { select: true });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rte.insertNode(node as any, { select: true });
      }
    };

    let config: LyticsAttributesAppConfig | null = null;
    try {
      config = rte.getConfig?.() as LyticsAttributesAppConfig | null;
    } catch {
      // Config not available
    }

    const apiToken = config?.lyticsApiToken || null;
    const baseUrl = getServerBaseUrl();

    modalRoot = document.createElement("div");
    Object.assign(modalRoot.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      zIndex: "10000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.4)",
    });

    modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
      background: "white",
      borderRadius: "8px",
      width: "480px",
      maxHeight: "80vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
    });

    modalRoot.appendChild(modalContent);
    modalRoot.addEventListener("click", (e) => {
      if (e.target === modalRoot) cleanup();
    });

    document.body.appendChild(modalRoot);

    if (apiToken && baseUrl) {
      ReactDOM.render(
        <div style={{ padding: "16px", textAlign: "center", color: "#647696" }}>Loading attributes...</div>,
        modalContent
      );

      fetch(`${baseUrl}/api/lytics/schema`, {
        headers: { Authorization: apiToken },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const columns = data?.data?.columns || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let attrs: LyticsAttribute[] = columns.filter((col: any) => !col.hidden).map((col: any) => ({
            slug: col.as,
            display_name: col.shortdesc || col.as,
            description: col.longdesc || "",
            type: col.type || "string",
          }));
          attrs.sort((a, b) => a.slug.localeCompare(b.slug));

          if (config?.restrictAttributes && config.allowedAttributes?.length > 0) {
            const allowed = new Set(config.allowedAttributes);
            attrs = attrs.filter((a) => allowed.has(a.slug));
          }

          if (modalContent) {
            ReactDOM.render(
              <RteAttributePicker
                attributes={attrs}
                onInsert={insertAttribute}
                onCancel={cleanup}
                defaultTransform={config?.defaultTextTransform || "capitalize"}
                defaultNumberFormat={config?.defaultNumberFormat || "number"}
              />,
              modalContent
            );
          }
        })
        .catch((err) => {
          if (modalContent) {
            ReactDOM.render(
              <div style={{ padding: "16px", color: "#d83a52", fontSize: "13px" }}>
                Failed to load attributes: {err.message}
                <br />
                <button onClick={cleanup} style={{ marginTop: "8px", padding: "6px 12px", border: "1px solid #c1c9d2", borderRadius: "4px", background: "#fff", cursor: "pointer" }}>Close</button>
              </div>,
              modalContent
            );
          }
        });
    } else {
      ReactDOM.render(
        <div style={{ padding: "16px", color: "#647696", fontSize: "13px" }}>
          No Lytics API token configured. Set one up in App Configuration.
          <br />
          <button onClick={cleanup} style={{ marginTop: "8px", padding: "6px 12px", border: "1px solid #c1c9d2", borderRadius: "4px", background: "#fff", cursor: "pointer" }}>Close</button>
        </div>,
        modalContent
      );
    }
  })
  .build();

const font = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const mono = "'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace";

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  border: "1px solid #c1c9d2",
  borderRadius: "4px",
  fontSize: "12px",
  fontFamily: font,
  color: "#222",
  background: "#fff",
};

const RteAttributePicker: React.FC<{
  attributes: LyticsAttribute[];
  onInsert: (slug: string, transform: string, numberFormat: string, defaultValue: string) => void;
  onCancel: () => void;
  defaultTransform: string;
  defaultNumberFormat: string;
}> = ({ attributes, onInsert, onCancel, defaultTransform, defaultNumberFormat }) => {
  const [search, setSearch] = React.useState("");
  const [transform, setTransform] = React.useState(defaultTransform);
  const [numberFormat, setNumberFormat] = React.useState(defaultNumberFormat);
  const [defaultValue, setDefaultValue] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search) return attributes;
    const q = search.toLowerCase();
    return attributes.filter(
      (a) => a.slug.toLowerCase().includes(q) || a.display_name.toLowerCase().includes(q)
    );
  }, [attributes, search]);

  return (
    <div style={{ fontFamily: font, display: "flex", flexDirection: "column", height: "100%", maxHeight: "80vh" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #edf0f5",
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "#222" }}>Insert Lytics Attribute</span>
        <button type="button" onClick={onCancel}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#647696", padding: "0 4px" }}>
          &times;
        </button>
      </div>

      {/* Formatting options */}
      <div style={{
        padding: "10px 16px",
        background: "#f4f6f9",
        borderBottom: "1px solid #edf0f5",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#647696", width: "52px" }}>Text</span>
          <select value={transform} onChange={(e) => setTransform(e.target.value)} style={selectStyle}>
            {TRANSFORMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#647696", width: "52px" }}>Number</span>
          <select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} style={selectStyle}>
            {NUMBER_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#647696", width: "52px" }}>Default</span>
          <input type="text" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Fallback value"
            style={{ ...selectStyle, padding: "4px 8px" }}
          />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 16px 8px", flexShrink: 0 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search attributes..."
          autoFocus
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #c1c9d2",
            borderRadius: "4px",
            fontSize: "13px",
            boxSizing: "border-box",
            fontFamily: font,
          }}
        />
      </div>

      {/* Attribute list */}
      <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid #edf0f5" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", color: "#8e96a3", fontSize: "13px" }}>
            No attributes match your search.
          </div>
        )}
        {filtered.map((attr) => (
          <div
            key={attr.slug}
            onClick={() => onInsert(attr.slug, transform, numberFormat, defaultValue)}
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid #f4f6f9",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0edfc"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            <div style={{ fontFamily: mono, fontWeight: 600, color: "#6c5ce7", fontSize: "13px" }}>
              {attr.slug}
            </div>
            {attr.display_name !== attr.slug && (
              <div style={{ fontSize: "11px", color: "#8e96a3", marginTop: "1px" }}>
                {attr.display_name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentstackAppSDK.registerRTEPlugins(LyticsAttributePlugin);
