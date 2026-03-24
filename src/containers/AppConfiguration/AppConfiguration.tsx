import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppLocation } from "../../common/hooks/useAppLocation";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { LyticsAttributesAppConfig } from "../../common/types/types";
import localeTexts from "../../common/locales/en-us";
import "./AppConfiguration.css";

const DEFAULT_CONFIG: LyticsAttributesAppConfig = {
  lyticsApiToken: "",
  enableDefaults: true,
  restrictAttributes: false,
  allowedAttributes: [],
};

interface InstallationData {
  configuration: LyticsAttributesAppConfig;
  serverConfiguration: Record<string, unknown>;
}

interface AppConfigLocation {
  installation: {
    getInstallationData: () => Promise<InstallationData>;
    setInstallationData: (data: InstallationData) => Promise<unknown>;
    setValidity: (isValid: boolean, options?: { message?: string }) => void;
  };
}

const AppConfiguration: React.FC = () => {
  const { location } = useAppLocation();
  const [config, setConfig] = useState<LyticsAttributesAppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const installationRef = useRef<AppConfigLocation["installation"] | null>(null);

  const { attributes, loading: attrsLoading, error: attrsError } = useLyticsAttributes(
    config.lyticsApiToken || null
  );

  useEffect(() => {
    (async () => {
      try {
        if (location && "installation" in location) {
          const loc = location as AppConfigLocation;
          installationRef.current = loc.installation;
          const installationData = await loc.installation.getInstallationData();
          const existingConfig = installationData?.configuration;
          if (existingConfig && typeof existingConfig.lyticsApiToken === "string") {
            setConfig({ ...DEFAULT_CONFIG, ...existingConfig });
          }
        }
      } catch {
        // No existing config, use defaults
      }
      setLoading(false);
    })();
  }, [location]);

  useEffect(() => {
    const installation = installationRef.current;
    if (!installation || loading) return;
    installation.setInstallationData({
      configuration: config,
      serverConfiguration: {},
    });
    installation.setValidity(true);
  }, [config, loading]);

  if (loading) {
    return <div className="app-config"><p>Loading...</p></div>;
  }

  const t = localeTexts.ConfigScreen;

  return (
    <div className="app-config">
      <h2 className="app-config-title">{t.title}</h2>
      <p className="app-config-description">{t.description}</p>

      <div className="app-config-section">
        <h3 className="app-config-section-title">{t.lyticsSection.title}</h3>

        <div className="app-config-field">
          <label className="app-config-label">{t.lyticsSection.apiTokenLabel}</label>
          <input
            type="password"
            value={config.lyticsApiToken}
            onChange={(e) => setConfig((prev) => ({ ...prev, lyticsApiToken: e.target.value }))}
            placeholder={t.lyticsSection.apiTokenPlaceholder}
            className="app-config-input"
          />
          <p className="app-config-help">{t.lyticsSection.apiTokenHelp}</p>
        </div>

        {config.lyticsApiToken && (
          <div className="app-config-status">
            {attrsLoading && (
              <span className="status-testing">{t.lyticsSection.connectionTesting}</span>
            )}
            {!attrsLoading && !attrsError && attributes.length > 0 && (
              <span className="status-success">
                {t.lyticsSection.connectionSuccess.replace("{count}", String(attributes.length))}
              </span>
            )}
            {!attrsLoading && attrsError && (
              <span className="status-error">
                {t.lyticsSection.connectionError.replace("{error}", attrsError)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="app-config-section">
        <h3 className="app-config-section-title">{t.defaultsSection.title}</h3>
        <label className="app-config-toggle">
          <input
            type="checkbox"
            checked={config.enableDefaults}
            onChange={(e) => setConfig((prev) => ({ ...prev, enableDefaults: e.target.checked }))}
          />
          <span className="app-config-toggle-label">{t.defaultsSection.enableDefaultsLabel}</span>
        </label>
        <p className="app-config-help">{t.defaultsSection.enableDefaultsHelp}</p>
      </div>

      {config.lyticsApiToken && !attrsLoading && !attrsError && attributes.length > 0 && (
        <AllowedAttributesSection
          attributes={attributes}
          config={config}
          setConfig={setConfig}
        />
      )}

      <p className="app-config-save-hint">{t.saveHint}</p>
    </div>
  );
};

interface AllowedAttributesSectionProps {
  attributes: { slug: string; display_name: string; type: string }[];
  config: LyticsAttributesAppConfig;
  setConfig: React.Dispatch<React.SetStateAction<LyticsAttributesAppConfig>>;
}

const AllowedAttributesSection: React.FC<AllowedAttributesSectionProps> = ({
  attributes,
  config,
  setConfig,
}) => {
  const [search, setSearch] = useState("");
  const t = localeTexts.ConfigScreen;

  const filtered = useMemo(() => {
    if (!search) return attributes;
    const q = search.toLowerCase();
    return attributes.filter(
      (a) => a.slug.toLowerCase().includes(q) || a.display_name.toLowerCase().includes(q)
    );
  }, [attributes, search]);

  const toggleAttribute = (slug: string) => {
    setConfig((prev) => {
      const allowed = new Set(prev.allowedAttributes);
      if (allowed.has(slug)) {
        allowed.delete(slug);
      } else {
        allowed.add(slug);
      }
      return { ...prev, allowedAttributes: Array.from(allowed) };
    });
  };

  const selectAll = () => {
    setConfig((prev) => ({
      ...prev,
      allowedAttributes: filtered.map((a) => a.slug),
    }));
  };

  const clearAll = () => {
    setConfig((prev) => ({ ...prev, allowedAttributes: [] }));
  };

  return (
    <div className="app-config-section">
      <h3 className="app-config-section-title">{t.allowedSection.title}</h3>

      <label className="app-config-toggle">
        <input
          type="checkbox"
          checked={config.restrictAttributes}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, restrictAttributes: e.target.checked }))
          }
        />
        <span className="app-config-toggle-label">{t.allowedSection.enableLabel}</span>
      </label>
      <p className="app-config-help">{t.allowedSection.enableHelp}</p>

      {config.restrictAttributes && (
        <div className="app-config-allowed">
          <div className="app-config-allowed-header">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.allowedSection.searchPlaceholder}
              className="app-config-input app-config-search"
            />
            <div className="app-config-allowed-actions">
              <button type="button" className="app-config-link-btn" onClick={selectAll}>
                Select all
              </button>
              <button type="button" className="app-config-link-btn" onClick={clearAll}>
                Clear all
              </button>
            </div>
          </div>
          <div className="app-config-allowed-count">
            {config.allowedAttributes.length} of {attributes.length} selected
          </div>
          <div className="app-config-attr-list">
            <table className="app-config-attr-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Slug</th>
                  <th>Name</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((attr) => (
                  <tr
                    key={attr.slug}
                    className={config.allowedAttributes.includes(attr.slug) ? "attr-row-selected" : ""}
                    onClick={() => toggleAttribute(attr.slug)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={config.allowedAttributes.includes(attr.slug)}
                        onChange={() => toggleAttribute(attr.slug)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="attr-slug">{attr.slug}</td>
                    <td className="attr-name">
                      {attr.display_name !== attr.slug ? attr.display_name : ""}
                    </td>
                    <td className="attr-type">{attr.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppConfiguration;
