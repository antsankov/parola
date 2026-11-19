# Parola

An Italian flashcard and quiz app built with HTML, CSS, and JavaScript. No build step or dependencies.

## Run

Use Node.js 20+ and run `npm run dev`, then open http://localhost:5173. `npm test` verifies frequency data and deck behavior. Deploy `dist/` to any static host.

## Practice

- Random cards from the top 100, 250, or all 500 words.
- Custom inclusive frequency range from 1 to 500; use 1–N for any top-N pool.
- Click a card or press Space to reveal the meaning. Arrow keys navigate when focus is outside a control.
- Italian → English and English → Italian modes; optional browser Italian pronunciation.
- Reveal a verb card to see its present indicative conjugation table.
- **Present tense** mode draws person + infinitive prompts from verbs in your selected rank range. Each available form appears once per round; flip to reveal the form and full reference table.
- Saved incorrect/review marks apply to the whole verb, so all its forms share the existing saved word mark.
- Shuffled without replacement. Completing the deck starts a new round; navigation back through the current round is supported.

Use the 20-question quiz mode to answer multiple-choice questions drawn without replacement from your selected pool. Pools with fewer than 20 words use all available words. Wrong answers are scored automatically; words can also be flagged for further review. The results screen offers review of wrong answers or flagged words. Distractors come from the full word collection.

Mark incorrect words or flag cards during flashcard practice, then use **Review saved words** at any time. Use **Learned — remove** to remove a word from both saved lists. **Clear saved review list** erases all saved marks.

Wrong answers and flags persist in the first-party `parola_review_v1` cookie for one year after a change, scoped to this host with Path=/, SameSite=Lax, and Secure on HTTPS. The compact versioned value stores two flags per rank and fits all 500 words in 503 bytes. Malformed cookies are ignored. If cookies are blocked, the app reports that saving failed and retains marks only in memory. Current quizzes and scores reset on refresh. No analytics, API requests, or backend database. A Google Fonts stylesheet is used for typography with local fallbacks. Browser speech synthesis availability and Italian voice quality depend on the device.

## Data

500 entries, their news-frequency ranks, and short English meanings were extracted from [Atlas Runa’s Italian Word Frequency List](https://atlasruna.com/blog/italian-word-frequency-list/) on 18 November 2026. The published list groups related word forms under headwords. The app retains the source ordering and meanings; frequency describes the source corpus, rather than every Italian conversation. See [their analysis](https://atlasruna.com/blog/italian-word-frequency-analysis/) for methodology.

`dist/words.js` is bundled data so cards need no runtime calls to Atlas Runa. The app uses all 500 published entries; it does not claim to include their unpublished full vocabulary database.

## Present-tense data

`dist/present-data.js` includes 126 verbs from the frequency list, adapted from [ian-hamlin/verb-data](https://github.com/ian-hamlin/verb-data) and its original Wiktionary entries under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Each entry links to its source; see [the data attribution and changes](dist/conjugations-LICENSE.md). Common modern forms are shown; alternate, archaic, and regional variants are omitted. Impersonal/third-person-only verbs are limited to their usual forms, with usage notes, rather than producing inappropriate person prompts.

The extraction is reproducible with `python3 scripts/extract-present.py /path/to/verb-data-master.tar.gz` using the source repository’s master archive. No conjugation API is called at runtime. The flashcard direction selector applies to vocabulary cards; present-tense practice always prompts with an Italian infinitive and person.
