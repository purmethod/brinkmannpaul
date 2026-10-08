#!/usr/bin/env python3
"""Builds the language versions of brinkmannpaul.com from the English page.

dist/index.html is the source. i18n/<lang>.json maps every English text unit
(the inner HTML of a paragraph, heading, link or item subtitle, plus the page
title, meta texts and labels) to its translation.

  python3 scripts/i18n.py extract   # writes i18n/units.json, the units to translate
  python3 scripts/i18n.py build     # writes dist/<lang>/index.html for every language

The build fails on any unit without a translation and on any translation that
changes the markup inside a unit (tags, links, classes), so a text change on
the English page cannot silently ship in English on the other pages.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'dist' / 'index.html'
I18N = ROOT / 'i18n'
SITE = 'https://brinkmannpaul.com/'
LANGS = {
    'de': {'locale': 'de_DE'},
    'fr': {'locale': 'fr_FR'},
    'es': {'locale': 'es_ES'},
    'ar': {'locale': 'ar_AR', 'dir': 'rtl'},
    'ru': {'locale': 'ru_RU'},
}

# Inner HTML of these elements is one unit; links inside a paragraph travel with it.
BLOCK = re.compile(r'<(p|h1|h2|a|li|title|figcaption)(\s[^>]*)?>(.*?)</\1>', re.S)
ITEM_TYPE = re.compile(r'(<span class="item-type[^"]*">)(.*?)(</span>)', re.S)
HEADER_SPAN = re.compile(r'(</h1>\s*<span>)(.*?)(</span>\s*</header>)', re.S)
META = re.compile(r'(<meta (?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description)" content=")([^"]*)(")')
ATTR = re.compile(r'(\s(?:aria-label|alt|data-label-[a-z-]+)=")([^"]+)(")')
TAGS = re.compile(r'<[^>]+>')


def needs(text):
    return bool(re.search(r'[A-Za-zÀ-ÿ]', TAGS.sub('', text)))


def units(html):
    found = []

    def add(text):
        if needs(text) and text not in found:
            found.append(text)

    for match in BLOCK.finditer(html):
        tag, attrs, inner = match.groups()
        if tag == 'a' and attrs and 'hreflang=' in attrs:
            continue  # the language names stay as they are
        add(inner)
    for pattern in (ITEM_TYPE, HEADER_SPAN, META, ATTR):
        for match in pattern.finditer(html):
            if not in_language_link(match):
                add(match.group(2))
    return found


def in_language_link(match):
    """Language names (aria-label on a link with hreflang) stay in their own language."""
    text = match.string
    return 'hreflang=' in text[text.rfind('<', 0, match.start()):match.start()]


def translate(html, table, lang):
    missing, broken = [], []

    def look(text):
        if not needs(text):
            return text
        if text not in table:
            missing.append(text)
            return text
        value = table[text]
        if TAGS.findall(value) != TAGS.findall(text):
            broken.append(text)
        return value

    def block(match):
        tag, attrs, inner = match.groups()
        attrs = attrs or ''
        if tag == 'a' and 'hreflang=' in attrs:
            return match.group(0)
        return f'<{tag}{attrs}>{look(inner)}</{tag}>'

    html = BLOCK.sub(block, html)
    for pattern in (ITEM_TYPE, HEADER_SPAN, META, ATTR):
        html = pattern.sub(lambda m: m.group(0) if in_language_link(m) else m.group(1) + look(m.group(2)) + m.group(3), html)
    if missing or broken:
        for text in missing:
            print(f'{lang}: missing translation: {text[:90]}', file=sys.stderr)
        for text in broken:
            print(f'{lang}: markup changed in: {text[:90]}', file=sys.stderr)
        sys.exit(1)
    return html


def localise(html, lang, conf):
    url = f'{SITE}{lang}/'
    html = html.replace('<html lang="en">', f'<html lang="{lang}"' + (f' dir="{conf["dir"]}"' if conf.get('dir') else '') + '>', 1)
    html = html.replace(f'<link rel="canonical" href="{SITE}" />', f'<link rel="canonical" href="{url}" />', 1)
    html = html.replace(f'<meta property="og:url" content="{SITE}" />', f'<meta property="og:url" content="{url}" />', 1)
    html = html.replace('<meta property="og:locale" content="en_US" />', f'<meta property="og:locale" content="{conf["locale"]}" />', 1)
    # The pages live one folder down: local files are addressed from the site root.
    html = re.sub(r'(\s(?:src|href|srcset)=")(?![a-z]+:|/|#)([^"]+")', r'\1/\2', html)
    # The current language is the one marked in the selector.
    html = html.replace(' aria-current="page">en</a>', '>en</a>', 1)
    html = re.sub(rf'(<a href="/{lang}/" hreflang="{lang}" lang="{lang}"[^>]*)>', r'\1 aria-current="page">', html, count=1)
    return html


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else 'build'
    html = SOURCE.read_text()
    if command == 'extract':
        I18N.mkdir(exist_ok=True)
        (I18N / 'units.json').write_text(json.dumps(units(html), ensure_ascii=False, indent=1) + '\n')
        print(f'{len(units(html))} units')
        return
    for lang, conf in LANGS.items():
        table = json.loads((I18N / f'{lang}.json').read_text())
        page = localise(translate(html, table, lang), lang, conf)
        out = ROOT / 'dist' / lang / 'index.html'
        out.parent.mkdir(exist_ok=True)
        out.write_text(page)
        print(f'{lang}: {out.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
