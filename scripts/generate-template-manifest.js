import { acquisitionGoals } from '../src/config/template-sources.config.js';
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

/**
 * The "Planning Agent" for file acquisition.
 * This script runs at build-time (via an npm script) to generate a
 * static manifest of all available templates. This manifest can then be
 * safely and statically imported by the application.
 */
function generateTemplateManifest() {
  console.log('Generating template manifest...');

  const projectRoot = path.resolve('.');
  const manifest = {};

  for (const goal of acquisitionGoals) {
    if (goal.anchor !== 'repo-root') continue;

    const basePath = path.join(projectRoot, goal.origin).replace(/\\/g, '/');
    const extensions = goal.filter.criteria.length > 1 ? `{${goal.filter.criteria.join(',')}}` : goal.filter.criteria[0];

    let pattern;
    if (goal.scope === 'terminal') {
      pattern = `${basePath}/*.${extensions}`;
    } else if (goal.scope === 'exhaustive') {
      pattern = `${basePath}/**/*.${extensions}`;
    } else {
      continue;
    }

    const files = globSync(pattern);
    for (const file of files) {
      // Use a relative path from the project root as the key
      const relativePath = `/${path.relative(projectRoot, file).replace(/\\/g, '/')}`;
      manifest[relativePath] = null; // Value will be loaded dynamically later
    }
  }

  const manifestPath = path.join(projectRoot, 'src/config/template-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(Object.keys(manifest), null, 2));

  console.log(`Template manifest generated at ${manifestPath} with ${Object.keys(manifest).length} entries.`);
}

generateTemplateManifest(); 