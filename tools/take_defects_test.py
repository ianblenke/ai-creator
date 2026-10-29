import unittest

import numpy as np

from take_defects import find

SR = 24000


def tone(sec, amp):
    t = np.arange(int(sec * SR)) / SR
    return (amp * np.sin(2 * np.pi * 200 * t)).astype(np.float32)


def scene(parts):
    """parts: (seconds, amplitude) in order; returns audio."""
    return np.concatenate([tone(s, a) for s, a in parts])


WORDS = [{"text": "a", "start": 0.5, "end": 1.0}, {"text": "b", "start": 1.5, "end": 2.0}, {"text": "c", "start": 2.5, "end": 3.0}]
LOUD, QUIET, ROOM = 0.1, 0.0002, 0.0


class TakeDefects(unittest.TestCase):
    def test_clean_scene_has_no_findings(self):
        y = scene([(0.5, ROOM), (0.5, LOUD), (0.5, ROOM), (0.5, LOUD), (0.5, ROOM), (0.5, LOUD), (0.5, ROOM)])
        self.assertEqual(find(y, SR, WORDS), [])

    def test_quiet_word_is_a_dropout(self):
        y = scene([(0.5, ROOM), (0.5, LOUD), (0.5, ROOM), (0.5, QUIET), (0.5, ROOM), (0.5, LOUD), (0.5, ROOM)])
        kinds = [f["kind"] for f in find(y, SR, WORDS)]
        self.assertEqual(kinds, ["dropout"])

    def test_speech_level_sound_in_a_gap_is_an_extra_syllable(self):
        y = scene([(0.5, ROOM), (0.5, LOUD), (0.1, ROOM), (0.3, LOUD), (0.1, ROOM), (0.5, LOUD), (0.5, ROOM), (0.5, LOUD), (0.5, ROOM)])
        self.assertIn("extra-syllable", [f["kind"] for f in find(y, SR, WORDS)])

    def test_sound_before_the_first_word_is_not_this_detectors_job(self):
        y = scene([(0.2, LOUD), (0.3, ROOM), (0.5, LOUD), (0.5, ROOM), (0.5, LOUD), (0.5, ROOM), (0.5, LOUD), (0.5, ROOM)])
        self.assertEqual(find(y, SR, WORDS), [])


if __name__ == "__main__":
    unittest.main()
