# Replacing Praat (GPL) with `tools/pitch.py`, measured 2026-10-28

`voice_review.py` used `praat-parselmouth` (GPL-3.0-or-later) for a pitch track and a loudness contour. Both now come from
`tools/pitch.py`: a YIN pitch tracker with a Viterbi path and an intensity contour, numpy only. The comparison below was run
against Praat with the same settings the project used (75 to 300 Hz, 10 ms step). Praat is a reference, not the truth, so the
first two rows use signals whose pitch is known.

| Test | Praat | `pitch.py` |
|---|---|---|
| Synthetic voiced signals (flat, glide, high, vibrato; two noise levels), frames voiced | 0.97 to 1.00 | 0.97 to 1.00 |
| the same, silent gaps wrongly voiced | at most 0.04 | at most 0.04 |
| the same, median pitch error (semitones) | 0.01 to 0.05 | 0.02 to 0.05 |
| Real narration, in-word frames voiced (4,965 for Praat) | 1.00 | 1.00 |
| Real narration, frames within 1 semitone of Praat (both voiced) | n/a | about 95 % |
| Per-word loudness, difference to Praat on words both flag | n/a | mean 0.01 dB, SD 0.17 dB |
| Planted defects (2 sets, 18 clips each): sniffs caught | 5 of 8 | 5 of 8 |
| Planted defects: planted loud words caught | 7 of 8 | 7 of 8 |
| Planted defects: loud-word false alarms | 2 of 28 | 3 of 28 |
| Unit tests (`pitch_test.py`, `voice_review_test.py`) | | 14 pass |

## What differs
- **Marginal loud words.** Of 77 loud-word calls on a 9-scene example, 60 are shared. The 17 that differ (12 only Praat, 5 only
  `pitch.py`) are all within 0.6 dB of the 5.5 dB cutoff. One extra false alarm in the planted sets is the same kind of case
  (5.6 dB against the cutoff, in a clip with a planted sniff).
- **Creaky low pitch.** Praat voices some frames below 100 Hz that `pitch.py` leaves unvoiced, so its median pitch for a scene is
  about 4 % higher (for example 124 Hz against 119 Hz). The detectors compare words with their own phrase, so this does not move them.
- **Octave slips.** Weak frames at the end of a word sometimes came out at double the pitch. A pass that halves such frames inside
  a voiced stretch fixed the one case found in the planted clips; a lone frame with no neighbours is not corrected.
- **Speed.** 0.16 s for a 31 s scene against 0.03 s for Praat (measured). Not a problem for episode-length audio.

## What it cost to get here
The first version was too cautious (42 % of Praat's voiced frames); the unvoiced cost was the lever. The first intensity window (32 ms)
was too sharp; 55 ms matched best. A second attempt to stop octave slips (a lower-octave candidate and a stiffer penalty) changed
nothing and was removed. The parameters were tuned on one episode's narration and checked on two others plus the planted sets.

## Not checked
- Other speakers: the real narration and both planted sets come from ONE voice (the author's). Tune the detectors on your
  own voice before trusting them (`docs/narration-quality.md`, "Tune the checks on your own voice").
- Women's voices and children (the range is 75 to 300 Hz, as before), and noisy recordings.
- Whether the listening verdict on flagged words changes: this compares detectors, not ears.
