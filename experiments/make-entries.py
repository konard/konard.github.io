# Generates <page>/index.html for every page from the root index.html (head/meta
# copied, title/description/canonical/og adjusted). Run: python3 -I experiments/make-entries.py
import re
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
base = (root / 'index.html').read_text()
PAGES = {
    'repositories': (
        'Repositories — Konstantin Diachenko (konard)',
        'All original repositories of konard and the organizations konard founded, how they are useful in different fields, and the best examples per IT profession.',
    ),
    'experience': (
        'Experience by role — Konstantin Diachenko (konard)',
        'Experience of Konstantin Diachenko filtered to one role: ML / AI, DevOps, CEO / team lead, developer or researcher.',
    ),
    'research': (
        'Research & theory — Konstantin Diachenko (konard)',
        'The links meta-theory, the universal problem solving algorithm, P vs NP, TSP, physics and laws as data science.',
    ),
    'associative': (
        'Associative stack — Konstantin Diachenko (konard)',
        'The associative technologies in development since 2010: links theory, Links Notation, doublets storage, Deep platform and AI.',
    ),
    'art': (
        'Art & other projects — Konstantin Diachenko (konard)',
        'Visual, audio and game experiments, every symbol of 1–4 links, and projects that fit no other category.',
    ),
    'blog': (
        'Blog — Konstantin Diachenko (konard)',
        'Posts of konard from X and VK, archived with full formatting and deduplicated across networks and languages.',
    ),
}
for page, (title, desc) in PAGES.items():
    url = f'https://konard.github.io/{page}/'
    html = base
    html = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', html)
    html = re.sub(
        r'(<meta\s+name="description"\s+content=")[^"]*(")', lambda m: m.group(1) + desc + m.group(2), html, flags=re.S
    )
    html = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + title + m.group(2), html)
    html = re.sub(
        r'(<meta\s+property="og:description"\s+content=")[^"]*(")',
        lambda m: m.group(1) + desc + m.group(2),
        html,
        flags=re.S,
    )
    html = html.replace(
        '<meta property="og:type" content="profile" />', '<meta property="og:type" content="website" />'
    )
    html = html.replace('content="https://konard.github.io/"', f'content="{url}"')
    html = html.replace(
        '<link rel="canonical" href="https://konard.github.io/" />', f'<link rel="canonical" href="{url}" />'
    )
    html = html.replace('src="/src/index.jsx"', f'src="/src/pages/{page}.jsx"')
    html = re.sub(
        r'(<noscript>).*?(</noscript>)',
        lambda m: m.group(1)
        + f'\n      {desc} Enable JavaScript to see this page, or visit https://github.com/konard.\n    '
        + m.group(2),
        html,
        flags=re.S,
    )
    (root / page).mkdir(exist_ok=True)
    (root / page / 'index.html').write_text(html)
    print(page)
