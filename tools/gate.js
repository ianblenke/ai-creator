import path from 'node:path';
import { scanEpisode, assertClean } from './safety/scan.js';

/** Run the content-safety scan for an episode; throws (blocking the step) on any finding. */
export function gate(episodeDir, step) {
  assertClean(scanEpisode(episodeDir, { denylistFile: path.resolve('safety/denylist.txt') }), step);
}
