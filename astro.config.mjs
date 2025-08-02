// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

import db from '@astrojs/db';

import markdoc from '@astrojs/markdoc';

import mdx from '@astrojs/mdx';

import partytown from '@astrojs/partytown';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  // Focus on React for 3D Force Graph and Rete.js
  integrations: [react({
    include: ['**/react/*'],
  }), db(), markdoc(), mdx(), /* partytown(), */ sitemap()],
  vite: {
    optimizeDeps: {
      include: ['@babylonjs/core'],
      exclude: ['@babylonjs/core/Legacy/legacy']
    },
    ssr: {
      noExternal: ['@babylonjs/core']
    }
  }
});