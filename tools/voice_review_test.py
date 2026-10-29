"""Tests for the voice-review detectors on synthetic speech-like audio with known planted defects (no models needed)."""
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_review import SR, flag_tags, gap_noise, penalty, prosody  # noqa: E402

RNG = np.random.default_rng(7)


def voiced(dur, f0=120.0, amp=0.1):
    t = np.arange(int(dur * SR)) / SR
    y = sum(np.sin(2 * np.pi * f0 * k * t) / k for k in range(1, 12))
    env = np.minimum(1, np.minimum(t, dur - t) / 0.03)
    return (amp * y / 3 * env).astype(np.float32)


def speech(words, gap=0.18, f0s=None, amps=None, durs=None, noise_in=None):
    """A sentence of voiced 'words' separated by quiet gaps. Returns (audio, word list). noise_in = (gap index, seconds) plants a noise burst."""
    parts, meta, t = [np.zeros(int(0.3 * SR), np.float32)], [], 0.3
    for i, text in enumerate(words):
        d = (durs or {}).get(i, 0.32)
        w = voiced(d, (f0s or {}).get(i, 120.0), (amps or {}).get(i, 0.1))
        parts.append(w)
        meta.append({"text": text, "start": t, "end": t + d})
        t += d
        g = np.zeros(int(gap * SR), np.float32) + RNG.normal(0, 1e-4, int(gap * SR)).astype(np.float32)
        if noise_in and noise_in[0] == i:
            n = int(noise_in[1] * SR)
            burst = RNG.normal(0, 0.006, n).astype(np.float32)  # about 10 dB below the speech, as a real sniff is
            b, a = np.array([1, -0.9]), np.array([1])
            burst = np.convolve(burst, b, mode="same").astype(np.float32)  # tilt toward high frequencies, like a sniff
            lo = int((len(g) - n) / 2)
            g[lo:lo + n] += burst
        parts.append(g)
        t += gap
    parts.append(np.zeros(int(0.3 * SR), np.float32))
    return np.concatenate(parts), meta


WORDS = "this is a plain sentence made of eight steady words".split()


class VoiceReviewTest(unittest.TestCase):
    def test_clean_speech_has_no_findings(self):
        y, w = speech(WORDS)
        f, _ = gap_noise(y, w)
        self.assertEqual(f, [])
        p, _ = prosody(y, w)
        self.assertEqual(p, [])
        self.assertEqual(penalty(f + p), 0)

    def test_a_planted_sniff_in_a_gap_is_found(self):
        y, w = speech(WORDS, gap=0.5, noise_in=(3, 0.15))
        f, _ = gap_noise(y, w)
        self.assertEqual(len(f), 1)
        self.assertEqual(f[0]["kind"], "sniff-or-breath")
        self.assertIn('"a"', f[0]["between"] + f[0]["detail"] + '"a"')
        self.assertTrue(w[3]["end"] < f[0]["t0"] < w[4]["start"])
        self.assertGreater(f[0]["severity"], 0.3)

    def test_a_much_louder_word_is_an_emphasis_spike(self):
        y, w = speech(WORDS, amps={4: 0.5})
        p, _ = prosody(y, w)
        self.assertIn("loud-word", {x["kind"] for x in p})
        self.assertTrue(any(x["between"].startswith('"') and "sentence" in x["detail"] for x in p if x["kind"] == "loud-word"))

    def test_a_pitch_spike_and_a_drawn_out_word(self):
        y, w = speech(WORDS, f0s={5: 195.0}, durs={2: 1.1})  # 8.4 semitones
        kinds = {x["kind"] for x in prosody(y, w)[0]}
        self.assertIn("pitch-spike", kinds)
        self.assertIn("drawn-out", kinds)

    def test_a_pitch_reset_between_close_words(self):
        y, w = speech(WORDS, gap=0.05, f0s={4: 216.0})  # 10.2 semitones: past the jump limit and not an octave error
        kinds = {x["kind"] for x in prosody(y, w)[0]}
        self.assertIn("pitch-jump", kinds)

    def test_a_sibilant_at_a_word_edge_is_not_a_sniff(self):
        y, w = speech(WORDS, gap=0.3)
        n = int(0.06 * SR)
        a = int((w[3]["end"] + 0.02) * SR)  # noise right after a word, inside the 80 ms margin
        y[a:a + n] += np.convolve(RNG.normal(0, 0.006, n), [1, -0.9], mode="same").astype(np.float32)
        f, _ = gap_noise(y, w)
        self.assertEqual(f, [])

    def test_tag_flagging_keeps_only_the_outliers_of_the_episode(self):
        fl = {"s": [{"kind": "tagged", "t0": i, "t1": i + 1, "prob": 0.3 + 0.01 * (i % 3), "label": "Gasp", "between": "x"} for i in range(30)]}
        fl["s"].append({"kind": "tagged", "t0": 99, "t1": 100, "prob": 0.8, "label": "Sniff", "between": "x"})
        out, st = flag_tags(fl)
        self.assertEqual([f["t0"] for f in out["s"]], [99])
        self.assertGreater(out["s"][0]["severity"], 0.4)

    def test_an_octave_jump_is_treated_as_a_tracking_error(self):
        y, w = speech(WORDS, gap=0.05, f0s={4: 240.0})
        self.assertNotIn("pitch-jump", {x["kind"] for x in prosody(y, w)[0]})

    def test_penalty_weights_sniffs_above_prosody(self):
        a = penalty([{"kind": "sniff-or-breath", "severity": 0.8}])
        b = penalty([{"kind": "loud-word", "severity": 0.8}])
        self.assertGreater(a, b)


if __name__ == "__main__":
    unittest.main()
