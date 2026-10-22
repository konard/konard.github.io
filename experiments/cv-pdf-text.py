"""Extracts the text of CV PDFs, as an ATS would, and checks key facts are there.

Usage: python -I experiments/cv-pdf-text.py build/cv/pdf/*.pdf  (needs pypdf)
"""
import sys

from pypdf import PdfReader

failures = 0
for path in sys.argv[1:]:
    text = "\n".join(page.extract_text() for page in PdfReader(path).pages)
    flat = " ".join(text.split())
    ru = path.endswith("-ru.pdf")
    expected = ["github.com/konard", "@drakonard", "konard.github.io",
                "Опыт работы" if ru else "Professional experience",
                "Образование" if ru else "Education"]
    missing = [word for word in expected if word.lower() not in flat.lower()]
    if missing:
        failures += 1
        print(f"{path}: missing {missing}")
if len(sys.argv) == 2:
    print(text)
print(f"{len(sys.argv) - 1} PDFs checked, {failures} failed")
sys.exit(1 if failures else 0)
