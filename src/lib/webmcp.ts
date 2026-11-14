/**
 * WebMCP (Web Model Context Protocol) Integration
 * Registers browser-native tools for AI agents when `document.modelContext`
 * or `navigator.modelContext` is available in supporting browsers (Chrome 150+).
 */
export function initWebMcp() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const modelContext = (document as any).modelContext || (navigator as any).modelContext;
  if (!modelContext || typeof modelContext.registerTool !== "function") return;

  try {
    modelContext.registerTool({
      name: "search_articles",
      description: "Search published Bengali stories, poems, memoirs, and essays by author Alam M.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Keyword or title to search for",
          },
        },
        required: ["query"],
      },
      execute: async ({ query }: { query: string }) => {
        window.location.href = `/articles?q=${encodeURIComponent(query)}`;
        return { success: true, message: `Searching articles for: ${query}` };
      },
    });

    modelContext.registerTool({
      name: "subscribe_newsletter",
      description: "Subscribe an email address to author Alam M's literary newsletter.",
      inputSchema: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "Email address to subscribe",
          },
        },
        required: ["email"],
      },
      execute: async ({ email }: { email: string }) => {
        try {
          const res = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          return data;
        } catch (err: any) {
          return { error: err.message || "Failed to subscribe" };
        }
      },
    });
  } catch (err) {
    console.debug("WebMCP registration note:", err);
  }
}
