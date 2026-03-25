import ContentstackAppSDK, { PluginBuilder } from "@contentstack/app-sdk";
import React from "react";
import ReactDOM from "react-dom";
import { LyticsAttribute, LyticsAttributesAppConfig } from "./common/types/types";

const ELEMENT_TYPE = "lytics-attribute";

/** Get the base URL of our server from the script tag that loaded this plugin */
function getServerBaseUrl(): string {
  const scripts = document.querySelectorAll("script[src*='json-rte.js']");
  for (let i = 0; i < scripts.length; i++) {
    const src = (scripts[i] as HTMLScriptElement).src;
    if (src) {
      const url = new URL(src);
      return url.origin;
    }
  }
  return "";
}

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
      if (!parts) {
        return <span {...props.attributes}>{props.children}</span>;
      }

      const label = parts.defaultValue
        ? `{{${parts.slug}|${parts.defaultValue}}}`
        : `{{${parts.slug}}}`;

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

    const insertAttribute = (slug: string, defaultValue: string) => {
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
          "lytics-default": defaultValue,
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

    // Get config for API token and allowed attributes
    let config: LyticsAttributesAppConfig | null = null;
    try {
      config = rte.getConfig?.() as LyticsAttributesAppConfig | null;
    } catch {
      // Config not available
    }

    const apiToken = config?.lyticsApiToken || null;
    const baseUrl = getServerBaseUrl();

    // Create modal
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
      overflow: "auto",
      padding: "1rem",
      boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
    });

    modalRoot.appendChild(modalContent);
    modalRoot.addEventListener("click", (e) => {
      if (e.target === modalRoot) cleanup();
    });

    document.body.appendChild(modalRoot);

    if (apiToken && baseUrl) {
      ReactDOM.render(
        <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
          Loading attributes...
        </div>,
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

          // Filter by allowed attributes if configured
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
              />,
              modalContent
            );
          }
        })
        .catch((err) => {
          if (modalContent) {
            ReactDOM.render(
              <RteManualInput onInsert={insertAttribute} onCancel={cleanup} errorMsg={err.message} />,
              modalContent
            );
          }
        });
    } else {
      ReactDOM.render(
        <RteManualInput onInsert={insertAttribute} onCancel={cleanup} />,
        modalContent
      );
    }
  })
  .build();

/** Attribute picker for RTE modal — search + click to insert */
const RteAttributePicker: React.FC<{
  attributes: LyticsAttribute[];
  onInsert: (slug: string, defaultValue: string) => void;
  onCancel: () => void;
}> = ({ attributes, onInsert, onCancel }) => {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search) return attributes;
    const q = search.toLowerCase();
    return attributes.filter(
      (a) => a.slug.toLowerCase().includes(q) || a.display_name.toLowerCase().includes(q)
    );
  }, [attributes, search]);

  const handleClick = (slug: string) => {
    onInsert(slug, "");
  };

  const font = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const mono = "'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  return (
    <div style={{ fontFamily: font }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #edf0f5",
      }}>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "#222" }}>Insert Lytics Attribute</span>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#666", padding: "0 4px" }}
        >
          &times;
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search attributes..."
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #c1c9d2",
          borderRadius: "4px",
          fontSize: "14px",
          boxSizing: "border-box",
          fontFamily: font,
          marginBottom: "8px",
        }}
        autoFocus
      />

      <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #edf0f5", borderRadius: "4px" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", color: "#8e96a3", fontSize: "13px" }}>
            No attributes match your search.
          </div>
        )}
        {filtered.map((attr) => (
          <div
            key={attr.slug}
            onClick={() => handleClick(attr.slug)}
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #f4f6f9",
              cursor: "pointer",
              transition: "background 0.1s",
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

/** Fallback manual input when API is not available */
const RteManualInput: React.FC<{
  onInsert: (slug: string, defaultValue: string) => void;
  onCancel: () => void;
  errorMsg?: string;
}> = ({ onInsert, onCancel, errorMsg }) => {
  const [slug, setSlug] = React.useState("");
  const [defaultValue, setDefaultValue] = React.useState("");

  const handleSubmit = () => {
    if (!slug) return;
    onInsert(slug, defaultValue);
  };

  return (
    <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #edf0f5",
      }}>
        <span style={{ fontWeight: 600, fontSize: "15px" }}>Insert Lytics Attribute</span>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#666", padding: "0 4px" }}>
          &times;
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", background: "#fef2f2", color: "#d83a52", borderRadius: "4px", fontSize: "13px" }}>
          Could not load attributes: {errorMsg}. Enter the slug manually.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#222", marginBottom: "4px" }}>
            Attribute Slug
          </label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. first_name"
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #c1c9d2", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#222", marginBottom: "4px" }}>
            Default Value (optional)
          </label>
          <input type="text" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} placeholder="Fallback if empty"
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #c1c9d2", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
          />
        </div>

        {slug && (
          <div style={{ padding: "8px 12px", background: "#f4f6f9", borderRadius: "4px", fontFamily: "monospace", fontSize: "14px", color: "#6c5ce7" }}>
            {defaultValue ? `{{${slug}|${defaultValue}}}` : `{{${slug}}}`}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel}
            style={{ padding: "8px 16px", background: "#f4f6f9", color: "#222", border: "1px solid #c1c9d2", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!slug}
            style={{ padding: "8px 16px", background: slug ? "#6c5ce7" : "#d5cff5", color: "#fff", border: "none", borderRadius: "4px", cursor: slug ? "pointer" : "not-allowed", fontSize: "14px", fontWeight: 500 }}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentstackAppSDK.registerRTEPlugins(LyticsAttributePlugin);
