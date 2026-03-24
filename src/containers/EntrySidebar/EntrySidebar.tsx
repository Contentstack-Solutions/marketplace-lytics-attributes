import React, { useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { AttributePicker } from "../../components/AttributePicker";
import { LyticsAttributesAppConfig } from "../../common/types/types";
import "./EntrySidebar.css";

const EntrySidebar: React.FC = () => {
  const appConfig = useAppConfig() as unknown as LyticsAttributesAppConfig | null;
  const apiToken = appConfig?.lyticsApiToken || null;
  const { attributes, loading, error } = useLyticsAttributes(apiToken);
  const [copied, setCopied] = useState<string | null>(null);

  const handleInsert = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = token;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (!apiToken) {
    return (
      <div className="sidebar-container">
        <div className="sidebar-header">Lytics Attributes</div>
        <div className="sidebar-empty">
          No Lytics API token configured. Go to App Configuration to set one up.
        </div>
        <div className="sidebar-manual">
          <p className="sidebar-manual-label">Manual entry:</p>
          <ManualTokenCopy onCopy={handleInsert} copied={copied} />
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">Lytics Attributes</div>
      <p className="sidebar-desc">
        Select an attribute to copy its token to your clipboard, then paste it into any field.
      </p>

      {copied && (
        <div className="sidebar-copied">
          Copied <code>{copied}</code>
        </div>
      )}

      <AttributePicker
        attributes={attributes}
        loading={loading}
        error={error}
        onInsert={handleInsert}
      />
    </div>
  );
};

interface ManualTokenCopyProps {
  onCopy: (token: string) => void;
  copied: string | null;
}

const ManualTokenCopy: React.FC<ManualTokenCopyProps> = ({ onCopy, copied }) => {
  const [slug, setSlug] = useState("");
  const [defaultValue, setDefaultValue] = useState("");

  const token = defaultValue
    ? `{{${slug}|${defaultValue}}}`
    : `{{${slug}}}`;

  return (
    <div className="sidebar-manual-form">
      <input
        type="text"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Attribute slug (e.g. first_name)"
        className="sidebar-input"
      />
      <input
        type="text"
        value={defaultValue}
        onChange={(e) => setDefaultValue(e.target.value)}
        placeholder="Default value (optional)"
        className="sidebar-input"
      />
      {slug && (
        <div className="sidebar-manual-preview">
          <code className="sidebar-token-preview">{token}</code>
          <button
            type="button"
            className="sidebar-copy-btn"
            onClick={() => onCopy(token)}
          >
            {copied === token ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
};

export default EntrySidebar;
