import React, { useEffect, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";
import { isNull } from "lodash";

import { KeyValueObj } from "../types/types";
import { AppFailed } from "../../components/AppFailed";
import { MarketplaceAppContext } from "../contexts/marketplaceContext";
import { useVerifyAppToken } from "../hooks/useVerifyAppToken";
import { getTokenFromUrl } from "../utils/functions";

type ProviderProps = {
  children?: React.ReactNode;
};

export const MarketplaceAppProvider: React.FC<ProviderProps> = ({ children }) => {
  const [failed, setFailed] = useState<boolean>(false);
  const [appSdk, setAppSdk] = useState<UiLocation | null>(null);
  const [appConfig, setConfig] = useState<KeyValueObj | null>(null);
  const token = getTokenFromUrl();
  const { isValidAppToken } = useVerifyAppToken(token);

  useEffect(() => {
    ContentstackAppSDK.init()
      .then(async (appSdk) => {
        setAppSdk(appSdk);
        appSdk.location.CustomField?.frame?.enableAutoResizing?.();
        const appConfig = await appSdk.getConfig();
        setConfig(appConfig);
      })
      .catch(() => {
        setFailed(true);
      });
  }, []);

  if (!failed && isNull(appSdk)) {
    return <div>Loading...</div>;
  }

  if (isValidAppToken === false || failed) {
    if (import.meta.env.DEV) {
      return <MarketplaceAppContext.Provider value={{ appSdk: null, appConfig: null }}>{children}</MarketplaceAppContext.Provider>;
    }
    return <AppFailed />;
  }

  return <MarketplaceAppContext.Provider value={{ appSdk, appConfig }}>{children}</MarketplaceAppContext.Provider>;
};
