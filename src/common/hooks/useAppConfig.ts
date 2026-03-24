import { MarketplaceAppContext, MarketplaceAppContextType } from "../contexts/marketplaceContext";
import { useContext } from "react";

export const useAppConfig = () => {
  const { appConfig } = useContext(MarketplaceAppContext) as MarketplaceAppContextType;
  return appConfig;
};
