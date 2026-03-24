import { useEffect, useState } from "react";
import { LyticsAttribute } from "../types/types";

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
        const res = await fetch("/api/lytics/schema", {
          headers: {
            Authorization: apiToken,
          },
        });

        if (!res.ok) {
          throw new Error(`Lytics API returned ${res.status}`);
        }

        const data = await res.json();
        const columns = data?.data?.columns || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attrs: LyticsAttribute[] = columns
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((col: any) => !col.hidden)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((col: any) => ({
            slug: col.as,
            display_name: col.shortdesc || col.as,
            description: col.longdesc || "",
            type: col.type || "string",
          }));

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
