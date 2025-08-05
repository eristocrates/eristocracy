// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

// Removed db import since not using it yet
// import db from '@astrojs/db';

import markdoc from '@astrojs/markdoc';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  integrations: [ /* db(), */ markdoc(), mdx(), /* partytown(), */ sitemap()],
  vite: {
    optimizeDeps: {
      include: [
        // External npm packages
        '@babylonjs/core',
        'three',
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
      exclude: ['@babylonjs/core/Legacy/legacy']
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
        'codemirror',
        '@codemirror/lang-javascript',
        '@codemirror/theme-one-dark',
        '@codemirror/view',

      ]
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
    resolve: {
      // Ensure proper resolution of internal modules
      alias: {
        // Add aliases if needed for complex import paths
      }
    },
    server: {
      // Development server configuration
      fs: {
        // Allow serving files from project root
        allow: ['..']
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