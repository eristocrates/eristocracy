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
        '@codemirror/view'
      ],
      exclude: ['@babylonjs/core/Legacy/legacy']
    },
    ssr: {
      noExternal: [
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
        '@codemirror/view'
      ]
    }
  }
});