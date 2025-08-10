import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import generateColors from './src/integrations/generateColors.js';
import { acquisitionGoals } from './src/config/template-sources.config.js';
import { globSync } from 'glob';
import path from 'path';

/**
 * The "Planning Agent" for file acquisition.
 * This Vite plugin resolves template paths at build time and creates a virtual module.
 */
function templateResolverPlugin() {
  const virtualModuleId = 'virtual:templates';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vite-plugin-template-resolver',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const projectRoot = path.resolve('.');
        const allFiles = acquisitionGoals.flatMap(goal => {
          if (goal.anchor !== 'repo-root') return [];
          const basePath = path.join(projectRoot, goal.origin).replace(/\\/g, '/');
          const extensions = goal.filter.criteria.length > 1 ? `{${goal.filter.criteria.join(',')}}` : goal.filter.criteria[0];
          let pattern;
          if (goal.scope === 'terminal') {
            pattern = `${basePath}/*.${extensions}`;
          } else if (goal.scope === 'exhaustive') {
            pattern = `${basePath}/**/*.${extensions}`;
          } else {
            return [];
          }
          return globSync(pattern);
        });

        // Create entries for template text (HTML/JS) using repo-relative paths
        const entries = allFiles.map(abs => {
          const rel = '/' + path.relative(projectRoot, abs).replace(/\\/g, '/');
          const dir = '/' + path.relative(projectRoot, path.dirname(abs)).replace(/\\/g, '/');
          return { rel, dir };
        });

        // Asset extensions we want to expose as URLs for production-safe loading
        const assetExts = [
          'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tga', 'ktx', 'ktx2', 'hdr', 'exr', 'dds', 'bin', 'glb', 'gltf',
          'mp3', 'ogg', 'wav', 'mp4', 'webm', 'json', 'css', 'js'
        ];

        // Derive a list of asset files within the same origins as templates
        const assetRoots = Array.from(new Set(acquisitionGoals
          .filter(g => g.anchor === 'repo-root')
          .map(g => path.join(projectRoot, g.origin).replace(/\\/g, '/'))));

        const assetFiles = assetRoots.flatMap(root => {
          const pattern = `${root}/**/*.{${assetExts.join(',')}}`;
          return globSync(pattern);
        });

        const assetRelList = Array.from(new Set(assetFiles.map(abs => '/' + path.relative(projectRoot, abs).replace(/\\/g, '/'))));

        const importList = entries.map(e => `'${e.rel}'`).join(', ');
        const templateDirObject = entries.map(e => `  '${e.rel}': '${e.dir}'`).join(',\n');
        const assetImportList = assetRelList.map(p => `'${p}'`).join(', ');

        const moduleContent = `
          // Text content of templates (HTML/JS) as raw strings
          const textModules = import.meta.glob([${importList}], { query: '?raw', import: 'default' });
          export const templateModules = textModules;

          // Production-safe asset URL modules (images, media, css/js referenced by templates)
          export const templateAssetModules = import.meta.glob([${assetImportList}], { query: '?url', import: 'default' });

          // Map of template file -> its repo-relative directory (no dev-only /@fs)
          export const templateDirs = {\n${templateDirObject}\n          };
        `;

        return moduleContent;
      }
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://eristocrates.dev/',   // needed for absolute asset URLs, sitemaps, etc.
  base: '/',                     // set if deploying under a subpath
  output: "server",
  adapter: netlify(),
  integrations: [
    react({ include: ['**/react/*'], }),
    markdoc(),
    mdx(),
    sitemap(),
    generateColors(),
  ],
  vite: {
    plugins: [
      vanillaExtractPlugin(),
      templateResolverPlugin(), // Add our new plugin here
    ],
    optimizeDeps: {
      include: [
        // External npm packages
        '@babylonjs/core',
        'three-forcegraph',
        'kapsule',
        'three-perf',
        'valtio',
        'd3',
        '3d-force-graph',
        'codemirror',
        '@codemirror/lang-javascript',
        '@codemirror/theme-one-dark',
        '@codemirror/view',
      ],
      exclude: [
        'pixi.js',
        'three',
        '@babylonjs/core/Legacy/legacy'
      ]
    },
    ssr: {
      noExternal: [
        // External npm packages
        '@babylonjs/core',
        'three-forcegraph',
        'kapsule',
        'three-perf',
        'valtio',
        'd3',
        '3d-force-graph',
        'three-render-objects',
        'codemirror',
        '@codemirror/lang-javascript',
        '@codemirror/theme-one-dark',
        '@codemirror/view',
      ]
    },
    resolve: {
    },
    build: {
      rollupOptions: {
        // Ensure internal modules are treated as external when needed
        external: [],
        // Force bundling of internal semantic library
        input: {
          // Let Astro handle the main entries, but ensure these are discoverable
        }
      }
    },
    server: {
      // Development server configuration
      fs: {
        // Allow serving files from project root
        allow: ['..']
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    },
    // Ensure client-side imports are properly bundled
    define: {
      // Add any global definitions if needed
    },
    assetsInclude: [
      // Include any additional asset patterns if needed
    ]
  }
});