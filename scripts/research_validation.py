"""Checks that a study summary is complete before any pages are written.

These checks catch missing language versions and repeated placeholder copy.
They complement source review; they cannot certify scientific truth.
"""
import re
from datetime import date

LANGS = ('en', 'de', 'fr', 'es', 'ar', 'ru')


def validate_articles(articles):
    if not articles:
        raise ValueError('research: no articles')
    slugs, dois = set(), set()
    intros = {lang: set() for lang in LANGS}
    conclusions = {lang: set() for lang in LANGS}
    for a in articles:
        slug = a.get('slug', '')
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug in slugs:
            raise ValueError(f'research: invalid or duplicate slug: {slug}')
        slugs.add(slug)
        doi = a.get('doi', '')
        if not re.fullmatch(r'10\.\d{4,9}/\S+', doi) or doi in dois:
            raise ValueError(f'{slug}: invalid or duplicate DOI')
        dois.add(doi)
        for key in ('cite_authors', 'cite_title', 'cite_journal'):
            if not a.get(key, '').strip():
                raise ValueError(f'{slug}: missing {key}')
        if re.search(r'\bstudy\s*\(\d{4}\)', a['cite_authors'], re.I):
            raise ValueError(f'{slug}: placeholder author citation')
        for key in ('published', 'modified'):
            date.fromisoformat(a[key])
        if a['modified'] < a['published']:
            raise ValueError(f'{slug}: modification predates publication')
        if set(a.get('text', {})) != set(LANGS):
            raise ValueError(f'{slug}: all six language versions are required')
        for lang in LANGS:
            t = a['text'][lang]
            for key in ('title', 'dek', 'intro'):
                if not isinstance(t.get(key), str) or not t[key].strip():
                    raise ValueError(f'{slug}/{lang}: missing {key}')
            sections = t.get('sections', [])
            if len(sections) != 4 or any(len(s) != 2 or not all(isinstance(x, str) and x.strip() for x in s) for s in sections):
                raise ValueError(f'{slug}/{lang}: four complete sections required')
            if lang != 'en':
                en = a['text']['en']
                if any(t[k] == en[k] for k in ('title', 'dek', 'intro')) or any(s[1] == es[1] for s, es in zip(sections, en['sections'])):
                    raise ValueError(f'{slug}/{lang}: English fallback is not a translation')
            for value, seen in ((t['intro'], intros[lang]), (sections[-1][1], conclusions[lang])):
                normalized = ' '.join(value.casefold().split())
                if normalized in seen:
                    raise ValueError(f'{slug}/{lang}: repeated introduction or conclusion')
                seen.add(normalized)
            body = ' '.join([t['title'], t['dek'], t['intro'], *(s[1] for s in sections)])
            if lang == 'ar' and len(re.findall(r'[\u0600-\u06ff]', body)) < 100:
                raise ValueError(f'{slug}/ar: Arabic body missing')
            if lang == 'ru' and len(re.findall(r'[\u0400-\u04ff]', body)) < 100:
                raise ValueError(f'{slug}/ru: Russian body missing')
    return articles
