import type { APIRoute } from "astro";
import { readdir } from "fs/promises";
import { join } from "path";

export const GET: APIRoute = async () => {
  try {
    // Path to the ontology directory
    const ontologyDir = join(process.cwd(), "public", "ontology");

    // Read the directory contents
    const files = await readdir(ontologyDir);

    // Filter for .ttl files and create ontology objects
    const ontologies = files
      .filter((file) => file.endsWith(".ttl"))
      .map((filename) => {
        // Create a friendly name from the filename
        const name = filename
          .replace(".ttl", "")
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return {
          name: name + " Ontology",
          path: `/ontology/${filename}`,
          filename: filename,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({
        success: true,
        ontologies: ontologies,
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
        success: false,
        error: "Failed to read ontology directory",
        ontologies: [
          {
            name: "Example Ontology (fallback)",
            path: "/ontology/example.ttl",
            filename: "example.ttl",
          },
        ],
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
