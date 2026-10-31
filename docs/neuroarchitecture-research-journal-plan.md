# neuroarchitecture research journal — implementation plan

Issue: #188
Branch: chatgpt/188-neuroarchitecture-journal

## Architecture
- Current site: static `dist/index.html`, `dist/styles.css`, `dist/app.js`.
- Existing `<details id="neuroarchitecture">` stays intact. Append a `research journal` section after the existing story and before contact CTA.
- Each approved article has a teaser in the accordion and an accessible standalone static route `/research/can-your-neighborhood-change-your-brain/`.
- Keep main site lightweight, black-and-white and responsive. No third-party CMS or JS dependencies.

## Editorial workflow
1. Discovery writes a **draft** article record, never public HTML.
2. Paul reviews the full article text and study source.
3. Record explicit approval of exact content revision (hash) and source DOI.
4. A human-reviewed PR generates public pages only from approved revisions.
5. Publishing is an explicit merge/deployment action; later content changes invalidate approval.
6. Rejected or pending records never appear on public pages, feeds, sitemaps or search indices.

## Article schema
`id`, `slug`, `title`, `dek`, `topic`, `published_at`, `study_date`, `authors`, `journal`, `doi`, `source_url`, `methods`, `sample`, `findings`, `limitations`, `architectural_implications`, `approval_status`, `approved_revision`.

## First approved article
Title: **can your neighborhood change your brain?**
Original paper: *Aging in the city: Linking neighborhood features with whole-brain structural and micro-structural changes during aging*.
DOI candidate from approved draft: https://doi.org/10.1016/j.envres.2026.124671 — independently confirm DOI, author list, journal and findings from primary source before deployment.
Sample described in draft: 334 older adults; approximately two-year longitudinal period.
Core message: neighborhood environmental characteristics correlate with brain structural changes; observational association is not causation.

## Verification gates
- Validate primary source and citation; avoid causal language.
- Keep English as source; honor `scripts/i18n.py` extraction/build for translated site pages.
- Check accessibility, metadata and canonical URL, mobile layout, links, intro behavior and `node --check dist/app.js`.
- Do not merge to main until review and tests pass.
