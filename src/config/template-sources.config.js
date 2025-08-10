/**
 * Plan Artifact for the File Acquisition Agent.
 *
 * This configuration defines a set of "Acquisition Goals." Each goal instructs
 * the agent on how to traverse a part of the filesystem and what criteria
 * to use for acquiring template artifacts.
 *
 * This file acts as the primary declarative interface between the User Agent (developer)
 * and the system's templating capabilities.
 */
export const acquisitionGoals = [
  {
    origin: 'src/templates/original',
    anchor: 'repo-root',
    scope: 'terminal',
    filter: {
      by: 'extension',
      criteria: ['js', 'html']
    }
  },
  {
    origin: 'src/templates/repos/three.js/examples',
    anchor: 'repo-root',
    scope: 'exhaustive',
    filter: {
      by: 'extension',
      criteria: ['html']
    }
  },
  {
    origin: 'src/templates/websites',
    anchor: 'repo-root',
    scope: 'exhaustive',
    filter: {
      by: 'extension',
      criteria: ['js']
    }
  },
]; 