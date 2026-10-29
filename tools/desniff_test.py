"""Tests for desniff: a planted sniff is removed, speech samples stay bit-identical, the length never changes, and a sound next to a word is left alone."""
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desniff import EDGE, _gain, plan  # noqa: E402
from voice_review import SR, gap_noise  # noqa: E402
from voice_review_test import WORDS, speech  # noqa: E402


class DesniffTest(unittest.TestCase):
    def test_a_planted_sniff_is_planned_inside_its_gap_and_removed(self):
        y, w = speech(WORDS, gap=0.5, noise_in=(3, 0.15))
        regions = plan(y, w, use_tags=False)
        self.assertEqual(len(regions), 1)
        r = regions[0]
        self.assertGreater(r["t0"], w[3]["end"] + EDGE - 1e-6)
        self.assertLess(r["t1"], w[4]["start"] - EDGE + 1e-6)
        out = y * _gain(len(y), SR, [(r["t0"], r["t1"])])
        self.assertEqual([f for f in gap_noise(out, w)[0] if f["kind"] == "sniff-or-breath"], [])

    def test_speech_samples_and_length_are_untouched(self):
        y, w = speech(WORDS, gap=0.5, noise_in=(3, 0.15))
        regions = plan(y, w, use_tags=False)
        out = y * _gain(len(y), SR, [(r["t0"], r["t1"]) for r in regions])
        self.assertEqual(len(out), len(y))
        for x in w:
            a, b = int((x["start"] + 0.01) * SR), int((x["end"] - 0.01) * SR)
            self.assertTrue(np.array_equal(out[a:b], y[a:b]))

    def test_clean_audio_plans_nothing(self):
        y, w = speech(WORDS, gap=0.4)
        self.assertEqual(plan(y, w, use_tags=False), [])

    def test_a_region_is_clipped_away_from_a_word_edge(self):
        y, w = speech(WORDS, gap=0.5, noise_in=(3, 0.15))
        r = plan(y, w, use_tags=False)[0]
        for x in w:
            self.assertFalse(r["t0"] < x["end"] + EDGE - 1e-6 and r["t1"] > x["start"] - EDGE + 1e-6)


if __name__ == "__main__":
    unittest.main()


class LeadAndTail(unittest.TestCase):
    def test_noise_before_the_first_word_and_after_the_last_is_planned(self):
        import numpy as np
        from desniff import plan
        sr = 16000
        rng = np.random.default_rng(1)
        y = np.concatenate([0.0005 * rng.standard_normal(sr // 2), 0.05 * rng.standard_normal(sr // 4), 0.0005 * rng.standard_normal(sr // 2),
                            0.2 * np.sin(2 * np.pi * 200 * np.arange(sr) / sr), 0.0005 * rng.standard_normal(sr // 2),
                            0.05 * rng.standard_normal(sr // 4), 0.0005 * rng.standard_normal(sr // 2)]).astype(np.float32)
        words = [{"text": "w", "start": 1.25, "end": 2.25}]
        kinds = [r["kind"] for r in plan(y, words, False)]
        self.assertEqual(kinds.count("lead-or-tail-noise"), 2)
