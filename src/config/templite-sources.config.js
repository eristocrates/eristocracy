// src/config/template-sources.config.js

/**
 * Plan Artifact for the File Acquisition Agent.
 *
 * This configuration defines a set of "Acquisition Goals." Each goal instructs
 * the agent on how to traverse a part of the filesystem and what criteria
 * to use for acquiring template artifacts.
 *
 * This file acts as the primary declarative interface between the User Agent (developer)
 * and the system's templating capabilities.
 *
 * Each object in the array represents a single, composable instruction set.
 *
 * @see The agent's reasoning is based on the principles of Location Semantics,
 *      Traversal Scope, and Acquisition Filters.
 */

/**
 * Proposed Future Goal (Example): A "Depth-Limited Metadata Crawl"
 *
 * This demonstrates the extensibility of the architecture. It instructs the
 * agent to perform a bounded search and filter by file metadata.
 * (This is not yet implemented, but the structure allows for it).
 */
// {
//   origin: 'src/templates/experimental',
//   anchor: 'repo-root',
//
//   // 'depth-limited' is an expandable scope.
//   scope: {
//     type: 'depth-limited',
//     depth: 2
//   },
//
//   // The filter can be expanded to handle different criteria.
//   filter: {
//     by: 'metadata',
//     criteria: {
//       size: { lessThan: '10KB' }
//     }
//   }
// }

export const acquisitionGoals = [

  /**
   * Goal 1: A "Terminal Extension Sweep" for curated, original templates.
   *
   * This instructs the agent to perform a shallow search in a specific directory
   * for files of a particular type.
   */
  {
    // Origin: The conceptual starting point for the traversal.
    origin: 'src/templates/original',

    // AnchorType: Defines the referential context for the origin path.
    // 'repo-root' is the most stable and traceable anchor for this system.
    anchor: 'repo-root',

    // TraversalScope: Defines the spatial extent of the agent's movement.
    // 'terminal' means the agent will only look inside the 'origin' directory
    // and will not descend into subdirectories.
    scope: 'terminal',

    // AcquisitionFilter: Defines the selection criteria for what counts as a match.
    // Here, we are filtering by file extension.
    filter: {
      by: 'extension',
      criteria: ['js', 'html']
    }
  },

  /**
   * Goal 2: An "Exhaustive Pattern Search" for a large, nested repository of examples.
   *
   * This instructs the agent to perform a deep, recursive search for files
   * that match a specific file type.
   */
  {
    origin: 'src/templates/repos/three.js/examples',
    anchor: 'repo-root',

    // 'exhaustive' instructs the agent to descend into all subdirectories
    // until no more are found, collecting matches at any depth.
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
