// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  // Focus on React for 3D Force Graph and Rete.js
  integrations: [react({
    include: ['**/react/*'],
  })
    , markdoc(), mdx(), sitemap()],
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
        // Internal modules - ensure they're pre-bundled
        'src/lib/fiddle.js',
        'src/lib/semantic/SemanticGraphViewerInit.js',
        'src/lib/performance/FiddlePerformanceProfiler.js',
        'src/lib/semantic/performance/D3PerformanceControls.js',
        'src/lib/semantic/performance/PerformanceState.js',
        'src/lib/semantic/performance/PerformanceParameterSchema.js',
        'src/lib/semantic/composer/SemanticGraphComposer.js',
        'src/lib/semantic/graph/function/createForceGraphInstance.js',
        'src/lib/vasturiano/Basic.js',
        'src/lib/vasturiano/Kapsule/KapsuleConfigsClient.js',
        'src/hooks/useStats.ts',
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
        'three-render-objects',
        'codemirror',
        '@codemirror/lang-javascript',
        '@codemirror/theme-one-dark',
        '@codemirror/view',
        // Internal modules - ensure they're bundled for SSR
        'src/lib/fiddle.js',
        'src/lib/semantic/SemanticGraphViewerInit.js',
        'src/lib/performance/FiddlePerformanceProfiler.js',
        'src/lib/semantic/performance/D3PerformanceControls.js',
        'src/lib/semantic/performance/PerformanceState.js',
        'src/lib/semantic/performance/PerformanceParameterSchema.js',
        'src/lib/semantic/composer/SemanticGraphComposer.js',
        'src/lib/semantic/graph/function/createForceGraphInstance.js',
        'src/lib/vasturiano/Basic.js',
        'src/lib/vasturiano/Kapsule/KapsuleConfigsClient.js',
        'src/hooks/useStats.ts',
      ]
    },
    resolve: {
      // Add aliases for better module resolution
      alias: {
        '@lib': path.resolve('./src/lib'),
        '@semantic': path.resolve('./src/lib/semantic'),
        '@performance': path.resolve('./src/lib/performance'),
        '@vasturiano': path.resolve('./src/lib/vasturiano'),
        '@hooks': path.resolve('./src/hooks'),
        '@entrypoints': path.resolve('./src/entrypoints'),
      }
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