import unittest

import numpy as np

from pitch import _fix_octaves, intensity, pitch

SR = 16000


def voiced(f_hz, sec=0.6, amp=0.1):
    t = np.arange(int(sec * SR)) / SR
    f = np.broadcast_to(np.asarray(f_hz, dtype=float), t.shape) if np.ndim(f_hz) == 0 else np.interp(t, np.linspace(0, sec, len(f_hz)), f_hz)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(h * ph) / h for h in range(1, 12))
    return amp * x / np.abs(x).max()


class Pitch(unittest.TestCase):
    def test_a_steady_tone_is_tracked_within_a_quarter_semitone(self):
        for f in (100, 140, 220):
            t, f0 = pitch(voiced(f), SR)
            v = f0[f0 > 0]
            self.assertGreater(len(v), 0.9 * len(f0) - 6)
            self.assertLess(abs(12 * np.log2(np.median(v) / f)), 0.25)

    def test_a_rising_glide_is_followed(self):
        t, f0 = pitch(voiced([100, 200], sec=1.0), SR)
        mid = f0[(t > 0.4) & (t < 0.6)]
        self.assertTrue(((mid > 130) & (mid < 170)).all())

    def test_silence_and_quiet_noise_are_unvoiced(self):
        rng = np.random.default_rng(0)
        t, f0 = pitch(0.003 * rng.standard_normal(SR), SR)
        self.assertLess((f0 > 0).mean(), 0.05)

    def test_a_frame_at_double_the_stretch_pitch_is_halved(self):
        f0 = np.array([0, 125, 126, 124, 127, 0, 252, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200, 0], dtype=float)
        out = _fix_octaves(f0)
        self.assertAlmostEqual(out[6], 126, delta=1)
        self.assertEqual(out[17], 200)   # a lone frame far away has no stretch to be judged against

    def test_intensity_follows_amplitude_in_db(self):
        t, db = intensity(np.concatenate([voiced(120, 0.5, 0.1), voiced(120, 0.5, 0.05)]), SR)
        self.assertAlmostEqual(db[t < 0.4].mean() - db[t > 0.6].mean(), 6.0, delta=0.5)


if __name__ == "__main__":
    unittest.main()
