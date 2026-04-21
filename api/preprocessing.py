"""
Text preprocessing utilities for the Propaganda Detection API.

Mirrors the preprocessing applied during training (the notebook's 'clean_text' column).
"""

import re
import html


def clean_text(text: str) -> str:
    """
    Clean and normalise raw text before passing it to the model.

    Steps (aligned with the training pipeline):
    1. Unescape HTML entities (e.g. &amp; -> &).
    2. Strip HTML tags.
    3. Lowercase.
    4. Remove URLs.
    5. Remove special characters / punctuation (keep alphanumeric + spaces).
    6. Collapse multiple spaces.
    7. Strip leading / trailing whitespace.
    """
    if not text or not isinstance(text, str):
        return ""

    # 1. Unescape HTML
    text = html.unescape(text)

    # 2. Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # 3. Lowercase only ASCII (preserve Arabic/multilingual chars)
    text = re.sub(r'[a-zA-Z]+', lambda m: m.group().lower(), text)

    # 4. Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # 5. Remove non‑alphanumeric characters (keep spaces + unicode letters for multilingual)
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)

    # 6. Collapse whitespace
    text = re.sub(r"\s+", " ", text)

    # 7. Strip
    text = text.strip()

    return text
