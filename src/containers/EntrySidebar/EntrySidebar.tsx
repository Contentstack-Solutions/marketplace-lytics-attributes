import React, { useMemo, useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { LyticsAttributesAppConfig } from "../../common/types/types";
import { buildAttributeToken } from "../../common/utils/functions";
import "./EntrySidebar.css";

const EntrySidebar: React.FC = () => {
  const appConfig = useAppConfig() as unknown as LyticsAttributesAppConfig | null;
  const apiToken = appConfig?.lyticsApiToken || null;
  const restrictAttributes = appConfig?.restrictAttributes || false;
  const allowedAttributes = appConfig?.allowedAttributes || [];
  const { attributes, loading, error } = useLyticsAttributes(apiToken);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
    const token = buildAttributeToken(slug);
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
    setCopied(slug);
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
        Click an attribute to copy its token to your clipboard.
      </p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search attributes..."
        className="sidebar-search"
      />

      {copied && (
        <div className="sidebar-copied">
          Copied <code>{buildAttributeToken(copied)}</code>
        </div>
      )}

      <div className="sidebar-attr-list">
        {visibleAttributes.length === 0 && (
          <div className="sidebar-no-results">No attributes match your search.</div>
        )}
        {visibleAttributes.map((attr) => (
          <div
            key={attr.slug}
            className={`sidebar-attr-item ${copied === attr.slug ? "sidebar-attr-copied" : ""}`}
            onClick={() => copyToken(attr.slug)}
          >
            <div className="sidebar-attr-slug">{attr.slug}</div>
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
