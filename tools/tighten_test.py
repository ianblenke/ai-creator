"""Tests for tighten: odd mid-phrase pauses are capped, deliberate sentence pauses are kept, the audio around a cut is untouched."""
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tighten import apply_cuts, plan_cuts  # noqa: E402


def w(text, s, e):
    return {"text": text, "start": s, "end": e}


class TightenTest(unittest.TestCase):
    def test_caps_by_kind_and_keeps_sentence_gaps(self):
        words = [w("built", 0, .3), w("to", 1.2, 1.4), w("go,", 1.5, 1.8), w("and", 2.9, 3.1), w("so", 4.0, 4.2),
                 w("end.", 4.25, 4.5), w("Next", 6.0, 6.3)]
        cuts = plan_cuts(words)
        self.assertEqual([(c["after"], c["before"]) for c in cuts], [("built", "to"), ("go,", "and"), ("and", "so")])
        gaps = {c["after"]: 1.2 - 0.3 - c["removed"] for c in cuts if c["after"] == "built"}
        self.assertAlmostEqual(gaps["built"], 0.25, places=2)

    def test_small_gaps_and_missing_cuts(self):
        self.assertEqual(plan_cuts([w("a", 0, .2), w("b", .4, .6)]), [])

    def test_audio_length_drops_by_the_removed_time_and_speech_is_kept(self):
        sr = 16000
        y = np.zeros(sr * 3, np.float32)
        y[:sr // 2] = 0.3
        y[2 * sr:2 * sr + sr // 2] = 0.3
        words = [w("one", 0, .5), w("two", 2.0, 2.5)]
        cuts = plan_cuts(words)
        out = apply_cuts(y, sr, cuts)
        self.assertAlmostEqual((len(y) - len(out)) / sr, cuts[0]["removed"], places=1)
        self.assertEqual(int((np.abs(out) > 0.2).sum()), int((np.abs(y) > 0.2).sum()))


if __name__ == "__main__":
    unittest.main()
