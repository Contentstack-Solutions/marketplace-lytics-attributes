import React, { useEffect, useRef, useState } from "react";
import { useAppLocation } from "../../common/hooks/useAppLocation";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { LyticsAttributesAppConfig } from "../../common/types/types";
import localeTexts from "../../common/locales/en-us";
import "./AppConfiguration.css";

const DEFAULT_CONFIG: LyticsAttributesAppConfig = {
  lyticsApiToken: "",
  defaultValue: "",
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

  // Test the connection with current token
  const { attributes, loading: attrsLoading, error: attrsError } = useLyticsAttributes(
    config.lyticsApiToken || null
  );

  // Load existing config on mount
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

  // Sync config to the platform whenever it changes
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
    return <div className="app-config">Loading...</div>;
  }

  const t = localeTexts.ConfigScreen;

  return (
    <div className="app-config">
      <h2>{t.title}</h2>
      <p className="app-config-description">{t.description}</p>

      {/* Lytics API Connection */}
      <div className="app-config-section">
        <h3>{t.lyticsSection.title}</h3>

        <div className="app-config-field">
          <label className="app-config-field-label">{t.lyticsSection.apiTokenLabel}</label>
          <input
            type="password"
            value={config.lyticsApiToken}
            onChange={(e) => setConfig((prev) => ({ ...prev, lyticsApiToken: e.target.value }))}
            placeholder={t.lyticsSection.apiTokenPlaceholder}
            className="app-config-input"
          />
          <p className="app-config-field-help">{t.lyticsSection.apiTokenHelp}</p>
        </div>

        {/* Connection status */}
        {config.lyticsApiToken && (
          <div className="app-config-connection-status">
            {attrsLoading && (
              <span className="app-config-status-testing">{t.lyticsSection.connectionTesting}</span>
            )}
            {!attrsLoading && !attrsError && attributes.length > 0 && (
              <span className="app-config-status-success">
                {t.lyticsSection.connectionSuccess.replace("{count}", String(attributes.length))}
              </span>
            )}
            {!attrsLoading && attrsError && (
              <span className="app-config-status-error">
                {t.lyticsSection.connectionError.replace("{error}", attrsError)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Default Values */}
      <div className="app-config-section">
        <h3>{t.defaultsSection.title}</h3>

        <div className="app-config-field">
          <label className="app-config-field-label">{t.defaultsSection.globalDefaultLabel}</label>
          <input
            type="text"
            value={config.defaultValue}
            onChange={(e) => setConfig((prev) => ({ ...prev, defaultValue: e.target.value }))}
            placeholder={t.defaultsSection.globalDefaultPlaceholder}
            className="app-config-input"
          />
          <p className="app-config-field-help">{t.defaultsSection.globalDefaultHelp}</p>
        </div>
      </div>

      {/* Attribute Preview */}
      {config.lyticsApiToken && !attrsLoading && !attrsError && attributes.length > 0 && (
        <div className="app-config-section">
          <h3>Available Attributes ({attributes.length})</h3>
          <div className="app-config-attr-list">
            {attributes.slice(0, 50).map((attr) => (
              <div key={attr.slug} className="app-config-attr-item">
                <span className="app-config-attr-slug">{attr.slug}</span>
                {attr.display_name !== attr.slug && (
                  <span className="app-config-attr-name">{attr.display_name}</span>
                )}
                <span className="app-config-attr-type">{attr.type}</span>
              </div>
            ))}
            {attributes.length > 50 && (
              <div className="app-config-attr-more">
                ...and {attributes.length - 50} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="app-config-actions">
        <p className="app-config-save-hint">{t.saveHint}</p>
      </div>
    </div>
  );
};

export default AppConfiguration;
