"""Extracts the text of CV PDFs, as an ATS would, and checks key facts are there.

Usage: python -I experiments/cv-pdf-text.py build/cv/pdf/*.pdf  (needs pypdf)
"""

import re
import sys

from pypdf import PdfReader

failures = 0
for path in sys.argv[1:]:
    text = '\n'.join(page.extract_text() for page in PdfReader(path).pages)
    flat = ' '.join(text.split())
    ru = path.endswith('-ru.pdf')
    expected = [
        'github.com/konard',
        '@drakonard',
        'konard.github.io',
        'Опыт работы' if ru else 'Professional experience',
        'Образование' if ru else 'Education',
    ]
    missing = [word for word in expected if word.lower() not in flat.lower()]
    if missing:
        failures += 1
        print(f'{path}: missing {missing}')
    # No phone, email, birth date or salary (issue #11).
    private = re.findall(r'\+\d[\d\s()-]{7,}|\S+@\S+\.\w+|born|рожд|salary|зарплат|₽', flat, re.I)
    if private:
        failures += 1
        print(f'{path}: private data {private}')
    # Sections in reading order: the experience before the education.
    lower = flat.lower()
    if lower.find(expected[3].lower()) > lower.rfind(expected[4].lower()):
        failures += 1
        print(f'{path}: the experience comes after the education')
if len(sys.argv) == 2:
    print(text)
print(f'{len(sys.argv) - 1} PDFs checked, {failures} failed')
sys.exit(1 if failures else 0)
