import React from "react";

interface AttributeTagProps {
  slug: string;
  defaultValue?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an attribute token as a styled inline tag.
 * Used in the custom field preview and RTE plugin.
 */
export const AttributeTag: React.FC<AttributeTagProps> = ({ slug, defaultValue, style }) => {
  const label = defaultValue ? `${slug}|${defaultValue}` : slug;

  return (
    <span
      style={{
        display: "inline",
        backgroundColor: "#e8f0fe",
        color: "#1a56db",
        border: "1px solid #bfdbfe",
        borderRadius: "4px",
        padding: "1px 6px",
        fontSize: "0.85em",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {"{{"}
      {label}
      {"}}"}
    </span>
  );
};
