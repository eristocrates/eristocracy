import type { APIRoute } from "astro";
import { readdir } from "fs/promises";
import { join } from "path";

export const GET: APIRoute = async ({ request }) => {
  try {
    const ontologyPath = join(process.cwd(), "public", "ontology");
    const files = await readdir(ontologyPath);

    // Filter for .ttl files and add metadata
    const ttlFiles = files
      .filter((file) => file.endsWith(".ttl"))
      .map((file) => ({
        filename: file,
        name: file.replace(".ttl", ""),
        path: `/ontology/${file}`,
        apiPath: `/api/graph-data/${file}`,
      }));

    return new Response(
      JSON.stringify({
        files: ttlFiles,
        count: ttlFiles.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error reading ontology directory:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to read ontology files",
        files: [],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
