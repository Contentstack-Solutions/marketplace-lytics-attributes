import React, { useEffect, useRef, useState } from "react";
import { useAppLocation } from "../../common/hooks/useAppLocation";
import { useLyticsAttributes } from "../../common/hooks/useLyticsAttributes";
import { LyticsAttributesAppConfig } from "../../common/types/types";
import localeTexts from "../../common/locales/en-us";
import { FieldLabel, TextInput, Checkbox, HelpText, InstructionText } from "@contentstack/venus-components";

const DEFAULT_CONFIG: LyticsAttributesAppConfig = {
  lyticsApiToken: "",
  enableDefaults: true,
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
      <div className="app-config-header">
        <h2>{t.title}</h2>
        <InstructionText>{t.description}</InstructionText>
      </div>

      <div className="app-config-section">
        <FieldLabel htmlFor="lytics-token">{t.lyticsSection.title}</FieldLabel>
        <div className="app-config-field">
          <TextInput
            id="lytics-token"
            type="password"
            value={config.lyticsApiToken}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig((prev) => ({ ...prev, lyticsApiToken: e.target.value }))
            }
            placeholder={t.lyticsSection.apiTokenPlaceholder}
            name="lyticsApiToken"
          />
          <HelpText>{t.lyticsSection.apiTokenHelp}</HelpText>
        </div>

        {config.lyticsApiToken && (
          <div className="app-config-connection-status">
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
        <FieldLabel htmlFor="defaults-toggle">{t.defaultsSection.title}</FieldLabel>
        <Checkbox
          label={t.defaultsSection.enableDefaultsLabel}
          checked={config.enableDefaults}
          onClick={() => setConfig((prev) => ({ ...prev, enableDefaults: !prev.enableDefaults }))}
        />
        <HelpText>{t.defaultsSection.enableDefaultsHelp}</HelpText>
      </div>

      {config.lyticsApiToken && !attrsLoading && !attrsError && attributes.length > 0 && (
        <div className="app-config-section">
          <FieldLabel htmlFor="attr-list">Available Attributes ({attributes.length})</FieldLabel>
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

      <InstructionText className="app-config-save-hint">{t.saveHint}</InstructionText>
    </div>
  );
};

export default AppConfiguration;
