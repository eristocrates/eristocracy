// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

// Removed db import since not using it yet
// import db from '@astrojs/db';

import markdoc from '@astrojs/markdoc';

import mdx from '@astrojs/mdx';

import partytown from '@astrojs/partytown';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  // Focus on React for 3D Force Graph and Rete.js
  integrations: [react(), /* db(), */ markdoc(), mdx(), /* partytown(), */ sitemap()],
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
        // Internal semantic library files (key entry points)
        '/src/lib/semantic/SemanticGraphViewerInit.js',
        '/src/lib/semantic/composer/SemanticGraphComposer.js',
        '/src/lib/semantic/performance/D3PerformanceControls.js',
        '/src/lib/semantic/performance/PerformanceState.js',
        '/src/lib/semantic/affordances/AffordanceManifest.js',
        // Internal performance profiling files
        '/src/lib/performance/FiddlePerformanceProfiler.js',
        '/src/lib/performance/AdvancedMetrics.js',
        '/src/lib/performance/MaterialComplexityAnalyzer.js',
        '/src/lib/performance/InstancingAnalyzer.js',
        '/src/lib/performance/InteractionProfiler.js',
        '/src/lib/performance/NetworkAssetProfiler.js',
        // Internal utility files
        '/src/lib/fiddle.js',
        '/src/lib/vasturiano/Basic.js'
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
        // Internal semantic library files
        '/src/lib/semantic/SemanticGraphViewerInit.js',
        '/src/lib/semantic/composer/SemanticGraphComposer.js',
        '/src/lib/semantic/performance/D3PerformanceControls.js',
        '/src/lib/semantic/performance/PerformanceState.js',
        '/src/lib/semantic/affordances/AffordanceManifest.js',
        // Internal performance profiling files
        '/src/lib/performance/FiddlePerformanceProfiler.js',
        '/src/lib/performance/AdvancedMetrics.js',
        '/src/lib/performance/MaterialComplexityAnalyzer.js',
        '/src/lib/performance/InstancingAnalyzer.js',
        '/src/lib/performance/InteractionProfiler.js',
        '/src/lib/performance/NetworkAssetProfiler.js',
        // Internal utility files
        '/src/lib/fiddle.js',
        '/src/lib/vasturiano/Basic.js'
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