import UILocation from "@contentstack/app-sdk/dist/src/uiLocation";
import { get, isEmpty, keys } from "lodash";

export function getAppLocation(sdk: UILocation): string {
  const locations = keys(sdk?.location);
  let locationName = "";
  for (let i = 0; i <= locations.length; i++) {
    if (!isEmpty(get(sdk, `location.${locations[i]}`, undefined))) {
      locationName = locations[i];
      break;
    }
  }
  return locationName;
}

export const getTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("app-token");
};

/** Regex to match attribute tokens: {{slug}} or {{slug|default}} */
export const ATTRIBUTE_TOKEN_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_.]*?)(?:\|([^}]*))?\}\}/g;

/** Parse a token string like "{{slug|default}}" into its parts */
export function parseAttributeToken(token: string): { slug: string; defaultValue: string } | null {
  const match = /^\{\{([a-zA-Z_][a-zA-Z0-9_.]*?)(?:\|([^}]*))?\}\}$/.exec(token);
  if (!match) return null;
  return {
    slug: match[1],
    defaultValue: match[2] ?? "",
  };
}

/** Build a token string from slug and optional default */
export function buildAttributeToken(slug: string, defaultValue?: string): string {
  if (defaultValue) {
    return `{{${slug}|${defaultValue}}}`;
  }
  return `{{${slug}}}`;
}
