#!/usr/bin/env python3
"""Regression checks for the published journal and its observed content failures."""
import copy
import html
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from research_validation import LANGS, validate_articles

ROOT = Path(__file__).resolve().parent.parent
ARTICLES = json.loads((ROOT / 'research/articles.json').read_text())['articles']
AUDIT = json.loads((ROOT / 'research/source-audit.json').read_text())


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def all(self, tag):
        return [a for t, a in self.tags if t == tag]


def numbers(text):
    result = set()
    # Arabic conjunctions can directly precede Western digits (e.g. و1981).
    for match in re.findall(r'\d+(?:[.,]\d+| \d{3})*', text):
        value = match.replace(' ', '')
        if re.fullmatch(r'\d{1,3}(?:[.,]\d{3})+', value):
            value = re.sub(r'[.,]', '', value)
        result.add(value.replace(',', '.'))
    return result


class ResearchTests(unittest.TestCase):
    def test_localized_number_formats(self):
        self.assertTrue({'426220', '3513', '13.6', '1981'}.issubset(numbers('426.220 / 3 513 / 13,6 / و1981')))

    def test_all_approved_studies_have_source_audit(self):
        self.assertEqual(len(AUDIT["studies"]), 17)
        self.assertEqual({s['doi'] for s in AUDIT['studies']}, {a['doi'] for a in ARTICLES})
        validate_articles(ARTICLES)
        for a in ARTICLES:
            checked = next(s for s in AUDIT['studies'] if s['doi'] == a['doi'])
            self.assertTrue(checked['access'] and checked['review'] and checked['primary_url'].startswith('https://'))
            for lang in LANGS:
                with self.subTest(slug=a['slug'], lang=lang):
                    t = a['text'][lang]
                    body = ' '.join([t['intro'], *(s[1] for s in t['sections'])])
                    self.assertTrue({str(n) for n in checked['key_counts']}.issubset(numbers(body)), 'key numeric facts must survive translation')

    def test_missing_language_rejected(self):
        data = copy.deepcopy(ARTICLES)
        del data[6]['text']['fr']
        with self.assertRaisesRegex(ValueError, 'six language'):
            validate_articles(data)

    def test_english_fallback_rejected(self):
        data = copy.deepcopy(ARTICLES)
        data[6]['text']['de'] = copy.deepcopy(data[6]['text']['en'])
        with self.assertRaisesRegex(ValueError, 'English fallback'):
            validate_articles(data)

    def test_partial_english_fallback_rejected(self):
        data = copy.deepcopy(ARTICLES)
        data[6]['text']['fr']['sections'][1][1] = data[6]['text']['en']['sections'][1][1]
        with self.assertRaisesRegex(ValueError, 'English fallback'):
            validate_articles(data)

    def test_repeated_intro_rejected(self):
        data = copy.deepcopy(ARTICLES)
        data[7]['text']['en']['intro'] = data[6]['text']['en']['intro']
        with self.assertRaisesRegex(ValueError, 'repeated introduction'):
            validate_articles(data)

    def test_repeated_conclusion_rejected(self):
        data = copy.deepcopy(ARTICLES)
        data[7]['text']['en']['sections'][-1][1] = data[6]['text']['en']['sections'][-1][1]
        with self.assertRaisesRegex(ValueError, 'repeated introduction or conclusion'):
            validate_articles(data)

    def test_placeholder_author_rejected(self):
        data = copy.deepcopy(ARTICLES)
        data[12]['cite_authors'] = 'Building and Environment study (2024)'
        with self.assertRaisesRegex(ValueError, 'placeholder author'):
            validate_articles(data)

    def test_duplicate_study_rejected(self):
        data = copy.deepcopy(ARTICLES)
        data[1]['doi'] = data[0]['doi']
        with self.assertRaisesRegex(ValueError, 'duplicate DOI'):
            validate_articles(data)

    def test_generated_routes_and_metadata(self):
        pages = []
        for lang in LANGS:
            prefix = '' if lang == 'en' else lang + '/'
            for a in [None, *ARTICLES]:
                route = f'{prefix}research/' + (a['slug'] + '/' if a else '')
                file = ROOT / 'dist' / route / 'index.html'
                with self.subTest(route=route):
                    self.assertTrue(file.exists())
                    source = file.read_text()
                    dom = Page(source)
                    self.assertEqual(dom.all('html')[0]['lang'], lang)
                    self.assertEqual(dom.all('html')[0].get('dir', 'ltr'), 'rtl' if lang == 'ar' else 'ltr')
                    self.assertEqual(len(dom.all('h1')), 1)
                    for landmark in ('header', 'main', 'footer'):
                        self.assertEqual(len(dom.all(landmark)), 1)
                    links = dom.all('link')
                    canonical = [l['href'] for l in links if l.get('rel') == 'canonical']
                    self.assertEqual(canonical, ['https://brinkmannpaul.com/' + route])
                    alternates = {l['hreflang']: l['href'] for l in links if l.get('rel') == 'alternate'}
                    self.assertEqual(set(alternates), {*LANGS, 'x-default'})
                    for other in LANGS:
                        target = ('' if other == 'en' else other + '/') + 'research/' + (a['slug'] + '/' if a else '')
                        self.assertEqual(alternates[other], 'https://brinkmannpaul.com/' + target)
                    language_links = [l for l in dom.all('a') if 'hreflang' in l]
                    self.assertEqual(len(language_links), 6)
                    self.assertEqual([l['hreflang'] for l in language_links if l.get('aria-current') == 'page'], [lang])
                    styles = [l['href'] for l in links if l.get('rel') == 'stylesheet']
                    home = (ROOT / 'dist/index.html').read_text()
                    shared_css = re.search(r'<link rel="stylesheet" href="(styles\.css[^\"]*)"', home)[1]
                    self.assertEqual(styles, ['/' + shared_css, '/research.css?v=2'])
                    header = re.search(r'<header\b.*?</header>', source, re.S)[0]
                    footer = re.search(r'<footer\b.*?</footer>', source, re.S)[0]
                    self.assertEqual(len(Page(header).all('a')), 8, 'brand, journal and six languages at the top')
                    self.assertEqual(len([a for a in Page(header).all('a') if 'hreflang' in a]), 6)
                    self.assertNotIn('hreflang=', footer, 'no language selector after the article')
                    self.assertEqual(len(Page(footer).all('a')), 3, 'email, whatsapp and instagram at the bottom')
                    self.assertNotIn('<style', source)
                    self.assertIn('class="neural-background"', source)
                    self.assertIn('class="contact-links"', source)
                    self.assertIn('href="#main-content"', source)
                    self.assertIn('id="main-content"', source)
                    ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)[1])
                    self.assertEqual(ld['inLanguage'], lang)
                    self.assertEqual(len(dom.all('script')), 1, 'static pages need no behavior scripts')
                    if a:
                        self.assertEqual(len(dom.all('h2')), 4)
                        self.assertEqual(ld['headline'], a['text'][lang]['title'])
                        self.assertEqual(ld['dateModified'], a['modified'])
                        self.assertEqual(ld['citation']['sameAs'], 'https://doi.org/' + a['doi'])
                        self.assertIn(html.escape(a['cite_authors'], quote=False), source)
                        plain_source = re.sub(r'<bdi class="research-term" dir="ltr">(.*?)</bdi>', r'\1', source)
                        for heading, paragraph in a['text'][lang]['sections']:
                            self.assertIn(html.escape(paragraph, quote=False), plain_source)
                    else:
                        self.assertEqual(len(ld['hasPart']), len(ARTICLES))
                        for study in ARTICLES:
                            self.assertIn(f'href="/{prefix}research/{study["slug"]}/"', source)
                    for attrs in [*dom.all('a'), *links]:
                        href = attrs.get('href', '')
                        url = urlsplit(href)
                        if not url.scheme and url.path:
                            dest = ROOT / 'dist' / url.path.lstrip('/')
                            self.assertTrue(dest.is_file() or (dest / 'index.html').is_file(), href)
                    pages.append(route)
        self.assertEqual(len(pages), len(LANGS) * (len(ARTICLES) + 1))

    def test_sitemap_has_all_journal_pages(self):
        sitemap = (ROOT / 'dist/sitemap.xml').read_text()
        urls = re.findall(r'<loc>([^<]+)</loc>', sitemap)
        self.assertEqual(len(urls), len(set(urls)))
        self.assertEqual(sum('/research/' in u for u in urls), len(LANGS) * (len(ARTICLES) + 1))

    def test_scientific_symbol_case_and_direction_are_preserved(self):
        css = (ROOT / 'dist/research.css').read_text()
        self.assertIn('.research-page .research-term { text-transform: none; }', css)
        page = ROOT / 'dist/ar/research/can-biodiverse-playgrounds-change-immunity/index.html'
        source = page.read_text()
        for term in ('IL-10:IL-17A', 'TGF-beta1', 'Gammaproteobacteria'):
            self.assertIn(f'<bdi class="research-term" dir="ltr">{term}</bdi>', source)
        self.assertIn('<bdi class="research-term" dir="ltr">3-5</bdi>', source)
        memory = ROOT / 'dist/ar/research/can-daily-green-exposure-support-memory/index.html'
        self.assertIn('<bdi class="research-term" dir="ltr">65-89</bdi>', memory.read_text())
        street = ROOT / 'dist/ar/research/how-do-urban-scenes-shape-brain-signals/index.html'
        self.assertIn('و<bdi class="research-term" dir="ltr">LPP</bdi>', street.read_text())
        self.assertIn('[dir="rtl"] .research-page .site-header', css)


if __name__ == '__main__':
    unittest.main(verbosity=2)
