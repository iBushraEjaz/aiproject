"""
Backlink analysis for Propaganda Detection API.
Loads the restmedia.st backlink Excel file and scores referring domains.
"""

import os
import logging
from urllib.parse import urlparse

import openpyxl

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Known domain reputation lists (from research + common knowledge)
# ---------------------------------------------------------------------------

KNOWN_PROPAGANDA_DOMAINS = {
    # Russian state media
    "rt.com", "sputniknews.com", "sputnik.md", "tass.com", "ria.ru",
    "vesti.ru", "rg.ru", "iz.ru", "tsargrad.tv", "regnum.ru",
    # Pro-Russian / disinformation
    "restmedia.st", "southfront.press", "southfront.org",
    "globalresearch.ca", "strategic-culture.org", "infowars.com",
    "zerohedge.com", "neweasterneurope.eu",
    # Extremist / dark web adjacent
    "dstormer6em3i4km.onion.pw", "elstormer6vrre53.onion.pw",
    "therepublicansvoice.com",
    # Identified in backlink data
    "vaseljenska.net", "mojenovosti.com", "vostok.rs",
    "opinione-pubblica.com", "tgchannels.org",
}

KNOWN_CREDIBLE_DOMAINS = {
    "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com", "dw.com",
    "theguardian.com", "nytimes.com", "washingtonpost.com",
    "economist.com", "ft.com", "bloomberg.com", "npr.org",
    "aljazeera.com", "france24.com", "euronews.com",
    # Research / fact-check
    "dfrlab.org", "bellingcat.com", "snopes.com", "factcheck.org",
    "politifact.com", "euvsdisinfo.eu",
}

# ---------------------------------------------------------------------------
# Excel backlink loader
# ---------------------------------------------------------------------------

EXCEL_PATH = os.path.join(os.path.dirname(__file__), "..", "AI", "REST_Media.io_updated_Backlinks.xlsx")


def load_backlinks_from_excel(domain: str) -> dict:
    """
    Load backlink data from the Excel file for a given domain.
    Returns scoring breakdown.
    """
    target_domain = domain.replace("www.", "").lower().strip("/")

    # Check if we have Excel data for this domain
    excel_path = os.path.abspath(EXCEL_PATH)
    if not os.path.exists(excel_path):
        logger.warning("Backlinks Excel not found at %s", excel_path)
        return _score_by_reputation(target_domain, [], 0)

    # Only restmedia.st has Excel data
    if target_domain not in ("restmedia.st", "restmedia.io"):
        return _score_by_reputation(target_domain, [], 0)

    try:
        wb = openpyxl.load_workbook(excel_path)
        ws = wb.active

        referring_domains = []
        total_links = 0
        nofollow_count = 0

        for row in ws.iter_rows(min_row=2, values_only=True):
            source_url = row[2]
            nofollow = row[7]
            if not source_url:
                continue
            total_links += 1
            if nofollow:
                nofollow_count += 1
            ref_domain = urlparse(str(source_url)).netloc.replace("www.", "").lower()
            if ref_domain:
                referring_domains.append(ref_domain)

        return _score_by_reputation(target_domain, referring_domains, total_links, nofollow_count)

    except Exception as e:
        logger.error("Failed to load backlinks Excel: %s", e)
        return _score_by_reputation(target_domain, [], 0)


def _score_by_reputation(domain: str, referring_domains: list, total_links: int, nofollow_count: int = 0) -> dict:
    """Score a domain based on its referring domains' reputation."""

    unique_domains = list(set(referring_domains))
    total_unique = len(unique_domains)

    propaganda_refs = [d for d in unique_domains if d in KNOWN_PROPAGANDA_DOMAINS]
    credible_refs   = [d for d in unique_domains if d in KNOWN_CREDIBLE_DOMAINS]
    unknown_refs    = [d for d in unique_domains if d not in KNOWN_PROPAGANDA_DOMAINS and d not in KNOWN_CREDIBLE_DOMAINS]

    # Check for dark web / onion links
    onion_refs = [d for d in unique_domains if ".onion" in d]

    if total_unique == 0:
        # No backlink data — score based on domain reputation alone
        if domain in KNOWN_PROPAGANDA_DOMAINS:
            network_score = 0.85
        elif domain in KNOWN_CREDIBLE_DOMAINS:
            network_score = 0.05
        else:
            network_score = 0.5  # unknown
    else:
        propaganda_weight = len(propaganda_refs) / total_unique
        credible_weight   = len(credible_refs) / total_unique
        onion_penalty     = min(len(onion_refs) / total_unique * 2, 0.3)  # dark web = big red flag
        network_score     = min(propaganda_weight + onion_penalty - (credible_weight * 0.3) + 0.1, 1.0)
        network_score     = max(network_score, 0.0)

    nofollow_ratio = round(nofollow_count / total_links, 3) if total_links > 0 else 0

    return {
        "total_backlinks": total_links,
        "unique_referring_domains": total_unique,
        "propaganda_sources": len(propaganda_refs),
        "credible_sources": len(credible_refs),
        "unknown_sources": len(unknown_refs),
        "dark_web_links": len(onion_refs),
        "nofollow_ratio": nofollow_ratio,
        "top_referring_domains": unique_domains[:10],
        "propaganda_referring_domains": propaganda_refs,
        "credible_referring_domains": credible_refs,
        "network_propaganda_score": round(network_score, 4),
    }


def get_network_score(url: str) -> dict:
    """Main entry point — given a URL, return its network propaganda score."""
    domain = urlparse(url).netloc.replace("www.", "").lower()
    if not domain:
        domain = url.replace("www.", "").lower().strip("/")
    return load_backlinks_from_excel(domain)
