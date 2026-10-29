// Attention-pacing check: no gap longer than maxGap seconds between visual changes (declared cues).
export function pacingGaps(cueTimes, duration, maxGap = 4) {
  const ts = [0, ...cueTimes.filter((t) => t >= 0 && t <= duration), duration].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > maxGap + 1e-9) gaps.push({ from: +ts[i - 1].toFixed(2), to: +ts[i].toFixed(2) });
  return gaps;
}
