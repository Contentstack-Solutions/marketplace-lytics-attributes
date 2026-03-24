import { MarketplaceAppContext, MarketplaceAppContextType } from "../contexts/marketplaceContext";
import { useContext } from "react";

export const useAppSdk = () => {
  const { appSdk } = useContext(MarketplaceAppContext) as MarketplaceAppContextType;
  return appSdk;
};
