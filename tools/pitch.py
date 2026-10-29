"""Fundamental-frequency (pitch) track and intensity contour from numpy only (YIN with a Viterbi path), replacing Praat/parselmouth (GPL).

pitch(y, sr, hop, fmin, fmax) -> (times, f0)   f0 in Hz, 0 where unvoiced; frame centres, `hop` seconds apart
intensity(y, sr, hop)         -> (times, db)   dB re full scale, 55 ms Hann window (matches Praat per-word loudness to 0.25 dB)
"""
import numpy as np

VOICED_MAX = 0.5     # a frame is voiced only if its normalized difference dips below this
SILENCE_DB = -55.0   # frames quieter than this are never voiced
OCTAVE_COST = 0.35   # Viterbi penalty per octave of jump between neighbouring voiced frames
UNVOICED_COST = 0.55  # tuned on real narration so voiced coverage matches Praat's (0.45 gave 0.89x, 0.55 gives 1.00x)


def _cmndf(frame, tmax):
    """YIN cumulative-mean-normalized difference of one windowed frame, lags 0..tmax (via FFT autocorrelation)."""
    n = len(frame)
    f = np.fft.rfft(frame, 2 * n)
    ac = np.fft.irfft(f * np.conj(f))[: tmax + 1]
    c = np.concatenate(([0.0], np.cumsum(frame ** 2)))
    taus = np.arange(tmax + 1)
    # d(tau) = sum_{j<n-tau} (x_j - x_{j+tau})^2 over the first n-tmax samples would be exact; this tail-inclusive form is the usual fast approximation
    d = (c[n - taus] + (c[n] - c[taus])) - 2 * ac
    d[0] = 0.0
    out = np.ones(tmax + 1)
    run = np.cumsum(d[1:])
    out[1:] = d[1:] * np.arange(1, tmax + 1) / np.maximum(run, 1e-12)
    return out


def _fix_octaves(f0, gap=3, lo=1.8, hi=2.2):
    """Halve frames near double the median of their voiced stretch (stretches are bridged over gaps of up to `gap` frames):
    a weak frame at the end of a word often dips at half the period, and the path cannot see across the unvoiced frame before it."""
    v = np.flatnonzero(f0 > 0)
    if len(v) < 4:
        return f0
    f0 = f0.copy()
    cuts = np.flatnonzero(np.diff(v) > gap + 1) + 1
    for run in np.split(v, cuts):
        if len(run) < 4:
            continue
        ref = float(np.median(f0[run]))
        r = f0[run] / ref
        hit = run[(r > lo) & (r < hi)]
        f0[hit] = f0[hit] / 2
    return f0


def pitch(y, sr=16000, hop=0.01, fmin=75.0, fmax=300.0, voiced_max=VOICED_MAX, unvoiced_cost=UNVOICED_COST, octave_cost=OCTAVE_COST, win_s=0.04):
    y = np.asarray(y, dtype=np.float64)
    tmin, tmax = int(sr / fmax), int(sr / fmin)
    win = int(win_s * sr)
    h = int(hop * sr)
    n = max(1, 1 + (len(y) - win) // h) if len(y) >= win else 1
    pad = np.pad(y, (0, max(0, win - len(y))))
    hann = np.hanning(win)
    cands, costs = [], []
    for i in range(n):
        fr = pad[i * h: i * h + win]
        if 20 * np.log10(np.sqrt(np.mean(fr ** 2)) + 1e-12) < SILENCE_DB:
            cands.append([]); costs.append([]); continue
        cm = _cmndf((fr - fr.mean()) * hann, tmax)
        seg = cm[tmin: tmax]
        loc = [t for t in range(1, len(seg) - 1) if seg[t] <= seg[t - 1] and seg[t] < seg[t + 1] and seg[t] < voiced_max]
        if not loc:
            cands.append([]); costs.append([]); continue
        taus, cs = [], []
        for t in loc:
            a, b, c = seg[t - 1], seg[t], seg[t + 1]
            den = a - 2 * b + c
            taus.append(tmin + t + (0.5 * (a - c) / den if den > 1e-12 else 0.0))
            cs.append(b)
        cands.append([sr / t for t in taus]); costs.append(cs)
    # Viterbi: state 0 = unvoiced, k>0 = voiced candidate k-1 of that frame
    best = [np.array([unvoiced_cost] + list(cs)) for cs in costs]
    score = [b.copy() for b in best]
    back = [np.zeros(len(b), int) for b in best]
    for i in range(1, n):
        for k in range(len(best[i])):
            prev = score[i - 1]
            tr = np.empty(len(prev))
            for j in range(len(prev)):
                if k == 0 or j == 0:
                    tr[j] = 0.0 if k == j else 0.1
                else:
                    tr[j] = octave_cost * abs(np.log2(cands[i][k - 1] / cands[i - 1][j - 1]))
            tot = prev + tr
            back[i][k] = int(np.argmin(tot))
            score[i][k] = best[i][k] + tot[back[i][k]]
    path = [0] * n
    path[-1] = int(np.argmin(score[-1]))
    for i in range(n - 1, 0, -1):
        path[i - 1] = back[i][path[i]]
    f0 = np.array([0.0 if path[i] == 0 else cands[i][path[i] - 1] for i in range(n)])
    return (np.arange(n) * h + win / 2) / sr, _fix_octaves(f0)


def intensity(y, sr=16000, hop=0.01, win=0.055):
    y = np.asarray(y, dtype=np.float64)
    w = int(win * sr)
    h = int(hop * sr)
    n = max(1, 1 + (len(y) - w) // h) if len(y) >= w else 1
    pad = np.pad(y, (0, max(0, w - len(y))))
    hann = np.hanning(w)
    db = np.array([10 * np.log10(np.sum((pad[i * h: i * h + w] * hann) ** 2) / np.sum(hann ** 2) + 1e-12) for i in range(n)])
    return (np.arange(n) * h + w / 2) / sr, db
