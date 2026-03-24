import ContentstackAppSDK, { PluginBuilder } from "@contentstack/app-sdk";
import React from "react";
import ReactDOM from "react-dom";
import { AttributePicker } from "./components/AttributePicker";
import { LyticsAttribute, LyticsAttributesAppConfig } from "./common/types/types";

const ELEMENT_TYPE = "lytics-attribute";
const LYTICS_API_BASE = "https://api.lytics.io";

const ToolbarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** Parse token parts from an element's attrs */
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
            backgroundColor: "#e8f0fe",
            color: "#1a56db",
            border: "1px solid #bfdbfe",
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

    const handleInsert = (token: string) => {
      cleanup();

      // Parse the token to extract slug and default
      const match = /^\{\{([a-zA-Z_][a-zA-Z0-9_.]*?)(?:\|([^}]*))?\}\}$/.exec(token);
      if (!match) return;

      const slug = match[1];
      const defaultValue = match[2] || "";

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

    // Fetch attributes if API token is configured
    let config: LyticsAttributesAppConfig | null = null;
    try {
      config = rte.getConfig?.() as LyticsAttributesAppConfig | null;
    } catch {
      // Config not available
    }

    const apiToken = config?.lyticsApiToken || null;

    // Create modal DOM
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

    // If we have a token, fetch attributes and show picker; otherwise show manual input
    if (apiToken) {
      // Show loading state first
      ReactDOM.render(
        <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
          Loading attributes...
        </div>,
        modalContent
      );

      fetch(`${LYTICS_API_BASE}/api/schema/_user`, {
        headers: { Authorization: apiToken },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const fields = data?.data?.fields || data?.data?.by_field || {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const attrs: LyticsAttribute[] = Object.entries(fields).map(([slug, field]: [string, any]) => ({
            slug,
            display_name: field.shortname || field.as || slug,
            description: field.description || "",
            type: field.type || "string",
          }));
          attrs.sort((a, b) => a.slug.localeCompare(b.slug));

          if (modalContent) {
            ReactDOM.render(
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #eee",
                }}>
                  <span style={{ fontWeight: 600, fontSize: "15px" }}>Insert Lytics Attribute</span>
                  <button
                    type="button"
                    onClick={cleanup}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.25rem",
                      color: "#666",
                      padding: "0 4px",
                    }}
                  >
                    &times;
                  </button>
                </div>
                <AttributePicker
                  attributes={attrs}
                  loading={false}
                  error={null}
                  onInsert={handleInsert}
                  onCancel={cleanup}
                  inline
                />
              </div>,
              modalContent
            );
          }
        })
        .catch((err) => {
          if (modalContent) {
            ReactDOM.render(
              <RteManualInput onInsert={handleInsert} onCancel={cleanup} errorMsg={err.message} />,
              modalContent
            );
          }
        });
    } else {
      ReactDOM.render(
        <RteManualInput onInsert={handleInsert} onCancel={cleanup} />,
        modalContent
      );
    }
  })
  .build();

/** Fallback manual input component for when API is not available */
const RteManualInput: React.FC<{
  onInsert: (token: string) => void;
  onCancel: () => void;
  errorMsg?: string;
}> = ({ onInsert, onCancel, errorMsg }) => {
  const [slug, setSlug] = React.useState("");
  const [defaultValue, setDefaultValue] = React.useState("");

  const handleSubmit = () => {
    if (!slug) return;
    const token = defaultValue ? `{{${slug}|${defaultValue}}}` : `{{${slug}}}`;
    onInsert(token);
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #eee",
      }}>
        <span style={{ fontWeight: 600, fontSize: "15px" }}>Insert Lytics Attribute</span>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.25rem",
            color: "#666",
            padding: "0 4px",
          }}
        >
          &times;
        </button>
      </div>

      {errorMsg && (
        <div style={{
          padding: "8px 12px",
          marginBottom: "12px",
          background: "#fef2f2",
          color: "#dc2626",
          borderRadius: "4px",
          fontSize: "13px",
        }}>
          Could not load attributes: {errorMsg}. Enter the attribute slug manually.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
            Attribute Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. first_name"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
            Default Value (optional)
          </label>
          <input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Fallback if attribute is empty"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {slug && (
          <div style={{
            padding: "8px 12px",
            background: "#f9fafb",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#1a56db",
          }}>
            {defaultValue ? `{{${slug}|${defaultValue}}}` : `{{${slug}}}`}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!slug}
            style={{
              padding: "8px 16px",
              background: slug ? "#1a56db" : "#93c5fd",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: slug ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentstackAppSDK.registerRTEPlugins(LyticsAttributePlugin);
