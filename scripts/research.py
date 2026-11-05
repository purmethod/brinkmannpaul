#!/usr/bin/env python3
"""Builds the neuroarchitecture research journal from research/articles.json.

  python3 scripts/research.py

Writes, for every language:
  dist/<lang>/research/<slug>/index.html   one page per article
  dist/<lang>/research/index.html          the list of all articles
and the journal teaser in the neuroarchitecture row of dist/index.html, with
the translations of its texts in i18n/<lang>.json, so `scripts/i18n.py build`
carries it into every language. Run it before the i18n build.

Each article is a summary of one published study: what was asked, how it was
studied, what was found, what it means for architecture, and the source with
its DOI. Texts never claim more than the study shows; observational studies
are described as associations.
"""
import html
import json
import re
from pathlib import Path
from research_validation import validate_articles

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://brinkmannpaul.com/'
LANGS = ['en', 'de', 'fr', 'es', 'ar', 'ru']
LOCALE = {'en': 'en_US', 'de': 'de_DE', 'fr': 'fr_FR', 'es': 'es_ES', 'ar': 'ar_AR', 'ru': 'ru_RU'}
UI = {
    'en': {'all': 'all articles', 'more': 'read more', 'index_title': 'Neuroarchitecture research',
           'index_dek': 'Studies on how the spaces we build relate to the brain, summarised for architecture.', 'source': 'original research / doi'},
    'de': {'all': 'alle artikel', 'more': 'weiterlesen', 'index_title': 'Neuroarchitektur Forschung',
           'index_dek': 'Studien darüber, wie die Räume, die wir bauen, mit dem Gehirn zusammenhängen, zusammengefasst für die Architektur.', 'source': 'original research / doi'},
    'fr': {'all': 'tous les articles', 'more': 'lire la suite', 'index_title': 'Recherche en neuroarchitecture',
           'index_dek': 'Des études sur le lien entre les espaces que nous construisons et le cerveau, résumées pour l’architecture.', 'source': 'original research / doi'},
    'es': {'all': 'todos los artículos', 'more': 'seguir leyendo', 'index_title': 'Investigación en neuroarquitectura',
           'index_dek': 'Estudios sobre cómo los espacios que construimos se relacionan con el cerebro, resumidos para la arquitectura.', 'source': 'original research / doi'},
    'ar': {'all': 'كل المقالات', 'more': 'اقرأ المزيد', 'index_title': 'أبحاث العمارة العصبية',
           'index_dek': 'دراسات عن علاقة الفضاءات التي نبنيها بالدماغ، ملخّصة من أجل العمارة.', 'source': 'original research / doi'},
    'ru': {'all': 'все статьи', 'more': 'читать дальше', 'index_title': 'Исследования нейроархитектуры',
           'index_dek': 'Исследования о том, как связаны с мозгом пространства, которые мы строим, кратко для архитектуры.', 'source': 'original research / doi'},
}
LABELS = {
    'en': ('research journal', 'original study', 'study summary', 'skip to content', 'contact', 'language', 'e-mail'),
    'de': ('forschungsjournal', 'originalstudie', 'studienzusammenfassung', 'zum inhalt', 'kontakt', 'sprache', 'e-mail'),
    'fr': ('carnet de recherche', 'étude originale', 'synthèse d’étude', 'aller au contenu', 'contact', 'langue', 'e-mail'),
    'es': ('cuaderno de investigación', 'estudio original', 'resumen del estudio', 'ir al contenido', 'contacto', 'idioma', 'correo electrónico'),
    'ar': ('دفتر الأبحاث', 'الدراسة الأصلية', 'ملخص دراسة', 'انتقل إلى المحتوى', 'تواصل', 'اللغة', 'البريد الإلكتروني'),
    'ru': ('исследовательский журнал', 'оригинальное исследование', 'обзор исследования', 'к содержанию', 'контакты', 'язык', 'электронная почта'),
}
NATIVE = {'en': ('en', 'english'), 'de': ('de', 'deutsch'), 'fr': ('fr', 'français'),
          'es': ('es', 'español'), 'ar': ('ع', 'العربية'), 'ru': ('ру', 'русский')}


def prefix(lang):
    return '' if lang == 'en' else f'{lang}/'


def esc(text):
    """For attributes."""
    return html.escape(text, quote=True)


def txt(text):
    """For text between tags: apostrophes and quotes stay as they are."""
    return html.escape(text, quote=False)


def prose(text):
    """Keep scientific symbols and abbreviations exact within lowercase styling."""
    # Arabic conjunctions can attach directly to Latin symbols, e.g. وLPP.
    word = r'A-Za-z0-9_\u00c0-\u024f\u0400-\u04ff'
    terms = rf'(?<![{word}])(IL-10:IL-17A|TGF-beta1|Gammaproteobacteria|Gammaproteobacterial|Gammaproteobakterien|RMSSD|MRI|MRT|IRM|EEG|GPS|P1|N1|P3|LPP|МРТ|ЭЭГ)(?![{word}])'
    return re.sub(terms, lambda m: f'<bdi class="research-term" dir="ltr">{m.group(0)}</bdi>', txt(text))


def page(lang, path, title, description, body, ld, og_type):
    # Share the actual homepage typography, palette, neural drawing, favicon
    # and contact symbols. Research-specific layout stays in a scoped CSS file.
    home = (ROOT / 'dist' / 'index.html').read_text()
    shared_css = re.search(r'<link rel="stylesheet" href="(styles\.css[^\"]*)"\s*/?>', home).group(1)
    favicon = re.search(r'<link\s+rel="icon"[^>]*>', home).group(0)
    contacts = re.search(r'<nav class="contact-links".*?</nav>', home, re.S).group(0)
    journal, source, summary, skip, contact, language, email = LABELS[lang]
    contacts = contacts.replace('aria-label="contact"', f'aria-label="{contact}"').replace('aria-label="e-mail"', f'aria-label="{email}"')
    url = f'{SITE}{prefix(lang)}{path}'
    alternates = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}{prefix(l)}{path}">' for l in LANGS)
    alternates += f'<link rel="alternate" hreflang="x-default" href="{SITE}{path}">'
    langs = ''.join(f'<a href="/{prefix(l)}{path}" hreflang="{l}" lang="{l}" aria-label="{NATIVE[l][1]}"' + (' aria-current="page"' if l == lang else '') + f'>{NATIVE[l][0]}</a>' for l in LANGS)
    rtl = ' dir="rtl"' if lang == 'ar' else ''
    structured = json.dumps(ld, ensure_ascii=False).replace('<', '\\u003c')
    return (f'<!doctype html><html lang="{lang}"{rtl}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{esc(title)} | paul brinkmann</title><meta name="description" content="{esc(description)}">'
            f'<link rel="canonical" href="{url}">{alternates}{favicon}'
            f'<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="paul brinkmann"><meta property="og:locale" content="{LOCALE[lang]}">'
            f'<meta property="og:url" content="{url}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}">'
            f'<meta property="og:image" content="{SITE}assets/og-image.jpg">'
            f'<script type="application/ld+json">{structured}</script>'
            f'<link rel="stylesheet" href="/{shared_css}"><link rel="stylesheet" href="/research.css?v=1"></head>'
            f'<body class="research-page"><a class="skip-link" href="#main-content">{skip}</a>'
            f'<div class="neural-background" aria-hidden="true"></div>'
            f'<header class="site-header"><a href="/{prefix(lang)}#neuroarchitecture">paul brinkmann, m.sc.</a>'
            f'<a href="/{prefix(lang)}research/">{journal}</a></header>'
            f'<main class="research-main" id="main-content">{body}</main>'
            f'<footer class="research-footer">{contacts}<nav class="footer-langs" aria-label="{language}">{langs}</nav></footer>'
            f'</body></html>\n')


def article_page(a, number, lang):
    t = a['text'][lang]
    path = f'research/{a["slug"]}/'
    doi = f'https://doi.org/{a["doi"]}'
    sections = ''.join(f'<h2>{txt(h)}</h2><p>{prose(p)}</p>' for h, p in t['sections'])
    body = (f'<article><p class="research-label">{LABELS[lang][2]} / {number:03d}</p>'
            f'<h1>{txt(t["title"])}</h1><p class="dek">{prose(t["dek"])}</p><p>{prose(t["intro"])}</p>{sections}'
            f'<section class="source" aria-label="{LABELS[lang][1]}"><p class="research-label">{LABELS[lang][1]}</p>'
            f'<div lang="en" dir="ltr" class="citation"><p><strong>{txt(a["cite_authors"])}</strong><br>'
            f'<cite>{txt(a["cite_title"])}</cite>{"" if a["cite_title"].endswith(".") else "."} {txt(a["cite_journal"])}</p>'
            f'<a href="{doi}" target="_blank" rel="noopener noreferrer">doi: {txt(a["doi"])}</a></div></section></article>'
            f'<nav class="research-nav" aria-label="{UI[lang]["all"]}"><a href="/{prefix(lang)}research/">{UI[lang]["all"]}</a></nav>')
    ld = {'@context': 'https://schema.org', '@type': 'Article', 'headline': t['title'], 'description': t['dek'], 'inLanguage': lang,
          'datePublished': a['published'], 'dateModified': a['modified'], 'author': {'@type': 'Person', 'name': 'Paul Brinkmann'},
          'mainEntityOfPage': f'{SITE}{prefix(lang)}{path}',
          'isPartOf': {'@type': 'Periodical', 'name': 'paul brinkmann · research journal'},
          'citation': {'@type': 'ScholarlyArticle', 'name': a['cite_title'].rstrip('.'), 'sameAs': doi}}
    return page(lang, path, t['title'], t['dek'], body, ld, 'article')


def index_page(arts, lang):
    items = ''.join(f'<li><span class="no">{i:03d}</span><h2><a href="/{prefix(lang)}research/{a["slug"]}/">{txt(a["text"][lang]["title"])}</a></h2>'
                    f'<p>{prose(a["text"][lang]["dek"])}</p></li>' for i, a in enumerate(arts, 1))
    ui = UI[lang]
    body = f'<p class="research-label">{LABELS[lang][0]} / {len(arts):03d}</p><h1>{txt(ui["index_title"])}</h1><p class="dek">{txt(ui["index_dek"])}</p><ol class="list">{items}</ol>'
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': ui['index_title'], 'inLanguage': lang,
          'hasPart': [{'@type': 'Article', 'headline': a['text'][lang]['title'], 'url': f'{SITE}{prefix(lang)}research/{a["slug"]}/'} for a in arts]}
    return page(lang, 'research/', ui['index_title'], ui['index_dek'], body, ld, 'website')


def teaser(arts):
    """The journal in the neuroarchitecture row: every article, its question and its summary."""
    rows = ''.join(
        f'                  <article class="research-teaser">\n'
        f'                    <p class="research-no">{i:03d}</p>\n'
        f'                    <h3>{txt(a["text"]["en"]["title"])}</h3>\n'
        f'                    <p>{txt(a["text"]["en"]["dek"])}</p>\n'
        f'                    <a href="research/{a["slug"]}/">read more</a>\n'
        f'                  </article>\n' for i, a in enumerate(arts, 1))
    return ('                <section class="neuro-research" aria-labelledby="neuro-research-title">\n'
            '                  <p id="neuro-research-title" class="research-label">research journal</p>\n'
            f'{rows}'
            '                  <a class="research-all" href="research/">all articles</a>\n'
            '                </section>\n')


def main():
    arts = validate_articles(json.loads((ROOT / 'research' / 'articles.json').read_text())['articles'])
    for lang in LANGS:
        base = ROOT / 'dist' / prefix(lang) / 'research'
        for i, a in enumerate(arts, 1):
            out = base / a['slug'] / 'index.html'
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(article_page(a, i, lang))
        (base / 'index.html').write_text(index_page(arts, lang))
    # The teaser replaces whatever journal section the row holds.
    index = ROOT / 'dist' / 'index.html'
    s = index.read_text()
    s, n = re.subn(r'                <section class="neuro-research".*?</section>\n', lambda m: teaser(arts), s, count=1, flags=re.S)
    assert n == 1, 'the neuroarchitecture row has no research section'
    index.write_text(s)
    # Its texts in every language, for the i18n build.
    for lang in LANGS[1:]:
        f = ROOT / 'i18n' / f'{lang}.json'
        table = json.loads(f.read_text())
        table['research journal'] = LABELS[lang][0]
        table['read more'] = UI[lang]['more']
        table['all articles'] = UI[lang]['all']
        for a in arts:
            table[txt(a['text']['en']['title'])] = txt(a['text'][lang]['title'])
            table[txt(a['text']['en']['dek'])] = txt(a['text'][lang]['dek'])
        f.write_text(json.dumps(table, ensure_ascii=False, indent=1) + '\n')
    print(f'research: {len(arts)} articles in {len(LANGS)} languages')


if __name__ == '__main__':
    main()
