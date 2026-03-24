import { useAppSdk } from "./useAppSdk";
import { get } from "lodash";

export const useSdkDataByPath = (path: string, defaultValue: unknown): unknown => {
  const appSdk = useAppSdk();
  return get(appSdk, path, defaultValue);
};
