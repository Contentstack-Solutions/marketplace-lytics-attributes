export interface KeyValueObj {
  [key: string]: string;
}

export type ChildProp = {
  children: string | JSX.Element | JSX.Element[];
};

export interface LyticsAttribute {
  slug: string;
  display_name: string;
  description: string;
  type: string;
}

export interface LyticsAttributesAppConfig {
  lyticsApiToken: string;
  restrictAttributes: boolean;
  allowedAttributes: string[];
}

export interface AttributeFieldData {
  text: string;
}
