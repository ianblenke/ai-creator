# The Cast: facts (every line dated; sources are our own records or primary pages)

## Models, jobs and licences (read dates; "read by" = the AI agent that fetched the primary page, no human)
- Voice: Audio8-TTS-Realistic 0.6B (Edge0), clones from one reference recording of the author's own voice, local GPU, one request at a time. Model card says Apache-2.0 for code and weights (read 2026-11-01, revision 1e857568); training data not described; adds no watermark. Source: docs/licences.md.
- Aligner: WhisperX (BSD-2-Clause) with the wav2vec2-base-960h model (Apache-2.0); CPU. Recognizer: Whisper small.en via faster-whisper (MIT per the Systran card); CPU. Both read 2026-10-28. Source: docs/licences.md.
- Recognizer blind spot: an ADDED syllable transcribes as the right word (docs/tutorial/takes.md, CLAUDE.md "word-ending slips").
- Failed judges, tested 2026-10-22 on the same 18 clips (6 clean; planted sniffs and loud words), on a 20 GB GPU: Qwen2-Audio-7B-Instruct (HF API licence tag apache-2.0, revision 0a095220, read 2026-11-02) and Qwen2.5-Omni-7B (model card licence "other", licence name apache-2.0, LICENSE file is the Apache License 2.0, revision ae9e1690, read 2026-11-02): both said "yes, unnatural pause" for every clip. SQUIM (torchaudio; weights Creative Commons Attribution 4.0 per the torchaudio docs, read 2026-11-02): naturalness score 4.52 for clean and for every planted defect.
- What worked: flag a sound only as an outlier against the episode's own baseline. On the same clips the gap detectors caught 4 of 4 planted sniffs with 2 false alarms on the other 14 clips. One test, one voice; NOT calibrated against the author's ears. Findings are candidates.
- Picture writer: Claude Opus 5.5 writes each scene; a second Opus session reviews keyframes. A/B on two scenes with identical briefs (Opus vs Sonnet 5.5): on the denser scene Opus took about 26 min and 267k output tokens, Sonnet about 2.6 min and 77k (about 10 times the time); the author judged the Opus animations "so much better" (2026-10-24). n = 2 scenes, one author's judgement, not a benchmark.
- Producer: Claude Code runs the stages, re-runs every gate itself, starts sub-agents; each scene author sees only four files (brief, bible, scene contract, style); reviewers are read-only (CLAUDE.md hard rules).
- Plans: Anthropic's pricing page (https://claude.com/pricing, read 2026-11-02 by an AI agent) lists Claude Code and Opus as included on Pro, Max, Ultra, Team and Enterprise and not on Free; Opus 5.5 is listed with API pricing. Plans change.
- NOT measured: the dollar cost or wall-clock time of making an episode; other chat models as substitutes; AudioSet data terms (for the AST tagger, not mentioned in the narration).

## Rules
- Narration is the author's own cloned voice only; description carries the synthetic-voice line and the Audio8 credit.
- No part numbers spoken. No Haven content. Model names and dates only here and in docs.
