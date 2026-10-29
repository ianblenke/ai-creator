"""Diff a script against what a recognizer heard. Pure logic (no model), so it can be tested offline.

Numbers are canonicalized first ("thirty two thousand" == "32,000"), so the words AROUND a number are still checked.
"""
import difflib
import re


def norm(s):
    s = s.lower().replace("-", " ").replace("—", " ")
    s = re.sub(r"(?<=\d),(?=\d{3}\b)", "", s)  # 48,000 -> 48000
    s = re.sub(r"(\d)([a-z]+)", r"\1 \2", s)  # 27b -> 27 b
    s = re.sub(r"(?<=\d)\.(?=\d)", "dot", s)  # 3.8 -> 3dot8 (after the split above, so the marker is not torn apart)
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    return s.split()


def join_letters(toks):
    """Spelled-out acronyms: "u s b" and "usb" are the same thing. Merge runs of 2+ single letters into one token."""
    res, run = [], []
    for t in toks + [""]:
        if len(t) == 1 and t.isalpha():
            run.append(t)
            continue
        res.append("".join(run)) if len(run) >= 2 else res.extend(run)
        run = []
        if t:
            res.append(t)
    return res


ONES = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split())}
TENS = {w: 10 * i for i, w in enumerate("_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()) if w != "_"}
SCALES = {"thousand": 10**3, "million": 10**6, "billion": 10**9}
UNITS = {"gb": "gigabytes", "gigabyte": "gigabytes", "mb": "megabytes", "ms": "milliseconds", "sec": "seconds"}
NUMWORD = set(ONES) | set(TENS) | set(SCALES) | {"hundred"}


def _fmt(v):
    return "#" + (str(int(v)) if float(v).is_integer() else repr(round(v, 6)))


def _parse_words(tokens, i):
    """Parse an English number starting at tokens[i]. Returns (value, next_index) or (None, i)."""
    n = len(tokens)
    total = cur = 0
    j, used, last = i, False, None
    if tokens[i] == "a" and i + 1 < n and tokens[i + 1] in ("hundred", "thousand"):
        cur, used, j = 1, True, i + 1
    while j < n:
        w = tokens[j]
        if w in TENS and cur % 100 == 0:
            cur += TENS[w]; last = "tens"; used = True
        elif w in ONES and (cur % 100 == 0 or (last == "tens" and ONES[w] < 10)):
            if ONES[w] >= 10 and cur % 100 != 0:
                break
            cur += ONES[w]; last = "ones"; used = True
        elif w == "hundred" and used and cur % 100 != 0 or (w == "hundred" and used and 0 < cur < 10):
            cur = (cur // 1000 * 1000) + (cur % 1000) * 100 if False else cur * 100; last = "hundred"
        elif w in SCALES and (used or cur):
            total += (cur or 1) * SCALES[w]; cur = 0; last = "scale"; used = True
        elif w == "and" and used and j + 1 < n and tokens[j + 1] in NUMWORD:
            pass
        else:
            break
        j += 1
    return ((total + cur) if used else None), j


ORDINALS = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10,
            "eleventh": 11, "twelfth": 12, "thirteenth": 13, "fourteenth": 14, "fifteenth": 15, "sixteenth": 16, "seventeenth": 17,
            "eighteenth": 18, "nineteenth": 19, "twentieth": 20, "thirtieth": 30}
SUFFIXES = {"th", "st", "nd", "rd"}


def canon(tokens):
    """Numbers -> one canonical token (#32000) whether spoken in words or transcribed as digits (also 17th, seventeenth, 7's, ii); common units unified."""
    # a bare "hundred and seventy" means "a hundred and seventy"
    tk = []
    for k, w in enumerate(tokens):
        if w == "hundred" and not (k and (tokens[k - 1] in NUMWORD or tokens[k - 1] == "a" or tokens[k - 1].isdigit())):
            tk.append("a")
        tk.append(w)
    tokens = tk
    out, i, n = [], 0, len(tokens)
    while i < n:
        t = tokens[i]
        if t in SPELLING:
            out.append(SPELLING[t]); i += 1  # the recognizer picks one spelling of a word with variants
            continue
        if t == "ii":
            out.append("#2"); i += 1
            continue
        if re.fullmatch(r"\d+'s", t):
            t = t[:-2]
        if t in ORDINALS and not (t == "second" and not (out and out[-1].startswith("#"))):
            out.append(_fmt(ORDINALS[t])); i += 1
            continue
        if re.fullmatch(r"(19[5-9]\d|20\d\d)", t) and not t.endswith("00"):
            out.append(_fmt(int(t[:2]))); out.append(_fmt(int(t[2:]))); i += 1  # a year read as "twenty twenty-six" is transcribed "2026"
            continue
        if re.fullmatch(r"\d+", t) and i + 1 < n and tokens[i + 1] in SUFFIXES:
            out.append(_fmt(int(t))); i += 2
            continue
        if re.fullmatch(r"\d+(dot\d+)?", t):
            v = float(t.replace("dot", ".")) if "dot" in t else int(t)
            j = i + 1
            while j < n and tokens[j] in SCALES:
                v *= SCALES[tokens[j]]; j += 1
            if j + 2 < n and tokens[j] == "and" and tokens[j + 1] == "a" and tokens[j + 2] == "half":
                v, j = v + 0.5, j + 3  # "7 and a half" -> 7.5
            out.append(_fmt(v)); i = j
            continue
        if t in NUMWORD or t == "a":
            v, j = _parse_words(tokens, i)
            if v is not None:
                # "seven and a half" -> 7.5
                if j + 2 < n and tokens[j] == "and" and tokens[j + 1] == "a" and tokens[j + 2] == "half":
                    v, j = v + 0.5, j + 3
                # spoken decimals: "three point eight"
                if j + 1 < n and tokens[j] == "point" and tokens[j + 1] in ONES and ONES[tokens[j + 1]] < 10:
                    k, frac = j + 1, ""
                    while k < n and tokens[k] in ONES and ONES[tokens[k]] < 10:
                        frac += str(ONES[tokens[k]]); k += 1
                    v, j = float(f"{int(v)}.{frac}"), k
                out.append(_fmt(v)); i = j
                continue
        out.append(UNITS.get(t, t))
        i += 1
    return out


def skeleton(w):
    """Rough consonant skeleton, so words a recognizer spells differently but that SOUND the same compare equal
    (colour/color, wait/weight, right/write) while real slips (past/fast, breaks/frixt) do not."""
    w = w.replace("'", "")
    for a, b in (("gh", ""), ("ph", "f"), ("ck", "k"), ("wr", "r"), ("kn", "n"), ("wh", "w"), ("qu", "kw"), ("c", "k")):
        w = w.replace(a, b)
    w = re.sub(r"[aeiouy]", "", w)
    return re.sub(r"(.)\1+", r"\1", w)


SPELLING = {"disk": "disc"}


def similar(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


HOMOPHONES = [{"disc", "disk"}, {"cache", "cash"}, {"cached", "cashed", "cash"}, {"past", "passed"}, {"right", "write"}, {"wait", "weight"}, {"to", "too", "two"}, {"for", "four"}, {"whole", "hole"}, {"by", "buy"}, {"there", "their"}, {"new", "knew"}, {"claude", "clawed"}, {"read", "reed", "red"}]

DEFAULT_IGNORE = ()


def diff_issues(script, heard, ignore=DEFAULT_IGNORE, garble_below=0.72, word_below=0.84):
    """script/heard: canonical token lists. Returns [{kind, script, heard, hi}] (hi = index into `heard`)."""
    ign = set(ignore)
    sm = difflib.SequenceMatcher(None, script, heard, autojunk=False)
    issues = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        ns, nh = i2 - i1, j2 - j1
        sblock, hblock = script[i1:i2], heard[j1:j2]
        if any(w in ign for w in sblock + hblock):
            continue  # names/acronyms the recognizer cannot spell
        base = {"script": " ".join(sblock), "heard": " ".join(hblock), "hi": j1}
        # a number that was dropped, merged ("6 to 7" heard as "60") or changed: a wrong figure is worse than a wrong word
        if [w for w in sblock if w.startswith("#")] != [w for w in hblock if w.startswith("#")]:
            issues.append({"kind": "number", **base})
            continue
        if nh - ns >= 3:
            issues.append({"kind": "repeated" if tag == "insert" else "extra", **base})
        elif (tag == "delete" and ns >= 3) or (tag == "replace" and nh <= 1 and ns >= 4):
            issues.append({"kind": "missing", **base})
        elif tag == "replace" and ns >= 2 and nh >= 2 and similar(" ".join(sblock), " ".join(hblock)) < garble_below:
            issues.append({"kind": "garbled", **base})
        elif tag == "replace" and ns == nh:
            # word-for-word substitutions ("past" -> "fast", "breaks" -> "frixt"): a slipped or mispronounced word
            for a, b in zip(sblock, hblock):
                if a.startswith("#") or b.startswith("#") or a.replace("'", "") == b.replace("'", ""):
                    continue
                if min(len(a), len(b)) <= 2 or skeleton(a) == skeleton(b) or any(a in g and b in g for g in HOMOPHONES):
                    continue  # tiny function words, or the same sound spelled differently
                if similar(a, b) < word_below:
                    issues.append({"kind": "word", "script": a, "heard": b, "hi": j1 + sblock.index(a)})
    return issues
