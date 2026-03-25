import React, { useMemo, useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { LyticsAttributesAppConfig } from "../../common/types/types";
import "./EntrySidebar.css";

const TRANSFORMS = [
  { value: "", label: "None" },
  { value: "lowercase", label: "lowercase" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "capitalize", label: "Capitalize First Letter" },
  { value: "titlecase", label: "Capitalize Each Word" },
] as const;

const NUMBER_FORMATS = [
  { value: "", label: "None" },
  { value: "number", label: "1,234" },
  { value: "currency", label: "$1,234.00" },
  { value: "decimal2", label: "1234.00" },
  { value: "percent", label: "85%" },
] as const;

function buildToken(slug: string, transform: string, numberFormat: string, defaultValue: string): string {
  const parts = [slug];
  if (transform) parts.push(transform);
  if (numberFormat) parts.push(numberFormat);
  if (defaultValue) parts.push(defaultValue);
  return `{{${parts.join("|")}}}`;
}

const EntrySidebar: React.FC = () => {
  const appConfig = useAppConfig() as unknown as LyticsAttributesAppConfig | null;
  const apiToken = appConfig?.lyticsApiToken || null;
  const restrictAttributes = appConfig?.restrictAttributes || false;
  const allowedAttributes = appConfig?.allowedAttributes || [];
  const { attributes, loading, error } = useLyticsAttributes(apiToken);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [transform, setTransform] = useState(appConfig?.defaultTextTransform || "capitalize");
  const [numberFormat, setNumberFormat] = useState(appConfig?.defaultNumberFormat || "number");
  const [defaultValue, setDefaultValue] = useState("");

  const visibleAttributes = useMemo(() => {
    let attrs = attributes;
    if (restrictAttributes && allowedAttributes.length > 0) {
      const allowed = new Set(allowedAttributes);
      attrs = attrs.filter((a) => allowed.has(a.slug));
    }
    if (search) {
      const q = search.toLowerCase();
      attrs = attrs.filter(
        (a) => a.slug.toLowerCase().includes(q) || a.display_name.toLowerCase().includes(q)
      );
    }
    return attrs;
  }, [attributes, restrictAttributes, allowedAttributes, search]);

  const copyToken = async (slug: string) => {
    const token = buildToken(slug, transform, numberFormat, defaultValue);
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = token;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!apiToken) {
    return (
      <div className="sidebar-container">
        <div className="sidebar-header">Lytics Attributes</div>
        <div className="sidebar-empty">
          No Lytics API token configured. Go to App Configuration to set one up.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sidebar-container">
        <div className="sidebar-header">Lytics Attributes</div>
        <p className="sidebar-desc">Loading attributes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar-container">
        <div className="sidebar-header">Lytics Attributes</div>
        <div className="sidebar-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">Lytics Attributes</div>
      <p className="sidebar-desc">
        Set formatting options, then click an attribute to copy.
      </p>

      <div className="sidebar-options">
        <div className="sidebar-option-row">
          <label className="sidebar-option-label">Text</label>
          <select
            value={transform}
            onChange={(e) => setTransform(e.target.value)}
            className="sidebar-select"
          >
            {TRANSFORMS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="sidebar-option-row">
          <label className="sidebar-option-label">Number</label>
          <select
            value={numberFormat}
            onChange={(e) => setNumberFormat(e.target.value)}
            className="sidebar-select"
          >
            {NUMBER_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="sidebar-option-row">
          <label className="sidebar-option-label">Default</label>
          <input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Fallback value"
            className="sidebar-default-input"
          />
        </div>
      </div>

      {(transform || numberFormat || defaultValue) && (
        <div className="sidebar-preview-hint">
          Token format: <code>{buildToken("attribute", transform, numberFormat, defaultValue)}</code>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search attributes..."
        className="sidebar-search"
      />

      {copied && (
        <div className="sidebar-copied">
          Copied <code>{copied}</code>
        </div>
      )}

      <div className="sidebar-attr-list">
        {visibleAttributes.length === 0 && (
          <div className="sidebar-no-results">No attributes match your search.</div>
        )}
        {visibleAttributes.map((attr) => (
          <div
            key={attr.slug}
            className="sidebar-attr-item"
            onClick={() => copyToken(attr.slug)}
          >
            <div className="sidebar-attr-top">
              <div className="sidebar-attr-slug">{attr.slug}</div>
              <code className="sidebar-attr-token">{buildToken(attr.slug, transform, numberFormat, defaultValue)}</code>
            </div>
            {attr.display_name !== attr.slug && (
              <div className="sidebar-attr-name">{attr.display_name}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntrySidebar;
