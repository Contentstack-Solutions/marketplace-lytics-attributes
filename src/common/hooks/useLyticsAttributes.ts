import { useEffect, useState } from "react";
import { LyticsAttribute } from "../types/types";

const LYTICS_API_BASE = "https://api.lytics.io";

export const useLyticsAttributes = (apiToken: string | null) => {
  const [attributes, setAttributes] = useState<LyticsAttribute[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setAttributes([]);
      setError(null);
      return;
    }

    const fetchAttributes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${LYTICS_API_BASE}/api/schema/_user`, {
          headers: {
            Authorization: apiToken,
          },
        });

        if (!res.ok) {
          throw new Error(`Lytics API returned ${res.status}`);
        }

        const data = await res.json();
        const fields = data?.data?.fields || data?.data?.by_field || {};

        const attrs: LyticsAttribute[] = Object.entries(fields).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ([slug, field]: [string, any]) => ({
            slug,
            display_name: field.shortname || field.as || slug,
            description: field.description || "",
            type: field.type || "string",
          })
        );

        attrs.sort((a, b) => a.slug.localeCompare(b.slug));
        setAttributes(attrs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch attributes");
        setAttributes([]);
      }
      setLoading(false);
    };

    fetchAttributes();
  }, [apiToken]);

  return { attributes, loading, error };
};
