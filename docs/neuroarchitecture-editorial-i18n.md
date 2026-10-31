# Neuroarchitecture: German-first editorial workflow

## Approval and translation
1. Research discovery creates a private **German** draft for Paul's scientific and editorial review.
2. Paul approves an exact German revision; the article remains unpublished during translation.
3. Generate English, French, Spanish, Modern Standard Arabic and Russian translations automatically from the approved German master. German is also retained.
4. Validate that all six versions preserve study design, sample size, uncertainty, citations and DOI. Check RTL Arabic layout, language tags and accessibility.
5. Create a reviewable pull request with six versions. Publication requires review and explicit release; never automatically merge a newly discovered study.
6. If German master changes, invalidate translations and publication approval for that revision; regenerate and review.

## Site-specific requirements
- Existing language directories: `dist/` (English), `dist/de`, `dist/fr`, `dist/es`, `dist/ar`, `dist/ru`.
- Follow `AGENTS.md`: `scripts/i18n.py` workflow for site shell, no direct edits to generated localized homepages.
- Standalone article pages should use locale-specific URLs, hreflang/canonical, and localized Article metadata.
- Never publish drafts, rejected studies, or translations awaiting validation.

## First article
German working title: **Kann dein Wohnviertel dein Gehirn verändern?**
English: **can your neighborhood change your brain?**
Study: *Aging in the city: Linking neighborhood features with whole-brain structural and micro-structural changes during aging* (2026). DOI to verify against primary source before shipping.

## Automation boundary
Weekly discovery can create candidate drafts and propose translations, but publication is gated by Paul and a reviewed deployment PR. A static website cannot securely host a private approval dashboard without additional infrastructure; use version-controlled draft/PR approvals initially.
