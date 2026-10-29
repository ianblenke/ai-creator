// best-of-N takes for named scenes (tools/besttake.js): media besttake <episode-dir> <scene-number...> [--takes 8]
import { main } from '../besttake.js';

export default (episodeDir, args = []) => main([episodeDir, ...args]);
