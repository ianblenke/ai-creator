import sys, os, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr_diff import norm, canon, join_letters, diff_issues

c = lambda t: canon(join_letters(norm(t)))


class T(unittest.TestCase):
    def test_numbers_equal_in_words_and_digits(self):
        self.assertEqual(c("thirty two thousand litres"), c("32,000 litres"))
        self.assertEqual(c("a hundred and ten"), c("110"))
        self.assertEqual(c("kettle three point eight twenty seven b"), c("Kettle 3.8 27B"))

    def test_and_a_half(self):
        self.assertEqual(c("about seven and a half seconds"), c("about 7.5 seconds"))
        self.assertEqual(c("about seven and a half seconds"), c("about 7 and a half seconds"))

    def test_catches_a_slipped_and_a_garbled_word(self):
        s = c("it's a trap past about thirty two thousand litres it breaks the circuit")
        h = c("it's a trap fast about 32 thousand litres it frixt the circuit")
        self.assertEqual({(d["script"], d["heard"]) for d in diff_issues(s, h)}, {("past", "fast"), ("breaks", "frixt")})

    def test_catches_a_dropped_number_in_a_range(self):
        s = c("boils in about three to four minutes from cold to the click")
        self.assertEqual([d["kind"] for d in diff_issues(s, c("boils in about 3 to minutes from cold to the click"))], ["number"])
        self.assertEqual([d["kind"] for d in diff_issues(s, c("boils in about 30 minutes from cold to the click"))], ["number"])
        self.assertEqual(diff_issues(s, c("boils in about 3 to 4 minutes from cold to the click")), [])

    def test_ordinals_and_plurals_match(self):
        self.assertEqual(c("on march third and fourth"), c("on March 3rd and 4th"))
        self.assertEqual(c("about seven"), c("about 7's".replace("7's", "7")))
        self.assertEqual(diff_issues(c("kettle mark two"), c("kettle mark ii")), [])


    def test_bare_hundred(self):
        self.assertEqual(c("about thirty of those hundred and seventy kettles"), c("about 30 of those 170 kettles"))

    def test_disk_and_disc_match(self):
        self.assertEqual(diff_issues(c("a small disc here"), c("a small disk here")), [])

    def test_clean_audio_passes(self):
        s = c("the file is twenty four gigabytes with about forty eight thousand frames")
        self.assertEqual(diff_issues(s, c("the file is 24 GB with about 48,000 frames")), [])

    def test_same_sound_spellings_pass(self):
        self.assertEqual(diff_issues(c("the colour dial"), c("the color dial")), [])

    def test_homophones_pass(self):
        self.assertEqual(diff_issues(c("the cache stays warm"), c("the cash stays warm")), [])
        self.assertEqual(diff_issues(c("only the cached frames are skipped"), c("only the cash frames are skipped")), [])

    def test_a_spoken_year_matches_its_digits(self):
        self.assertEqual(diff_issues(c("as of march third twenty twenty-six the kettle"), c("as of march 3rd 2026 the kettle")), [])
        self.assertTrue(diff_issues(c("as of march third twenty twenty-six"), c("as of march 3rd 2025")))

    def test_repeat_and_missing(self):
        kinds = {d["kind"] for d in diff_issues(c("this is about asking the right way and fitting it on a card"), c("this is about asking the right way and fitting it on a card and fitting it on a card"))}
        self.assertIn("repeated", kinds)
        self.assertIn("missing", {d["kind"] for d in diff_issues(c("red blue green yellow purple orange brown"), c("red blue brown"))})


if __name__ == "__main__":
    unittest.main()
