"""
Model loading and inference for the Propaganda Detection API.

Loads a fine-tuned mBERT (bert-base-multilingual-cased) model for
binary propaganda classification.
"""

import os
import logging
from pathlib import Path

import torch
from transformers import BertTokenizer, BertForSequenceClassification

from preprocessing import clean_text

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_MODEL_NAME = "bert-base-multilingual-cased"
NUM_LABELS = 3  # Matches notebook config (num_labels=3)
MAX_LENGTH = 128  # Matches notebook tokenization

LABEL_MAP = {
    0: "non-propaganda",
    1: "propaganda",
    2: "unknown",  # Unused class from notebook config
}

# Temperature > 1.0 softens overconfident predictions (no retraining needed)
TEMPERATURE = 4.0

# Propaganda techniques mapped to keywords (based on standard propaganda taxonomy)
PROPAGANDA_TECHNIQUES = {
    "Loaded Language": [
        "terrorist", "terrorists", "criminal", "criminals", "illegal",
        "invasion", "invaders", "regime", "tyranny", "puppet", "traitor",
        "extremist", "radical", "thug", "savage", "evil", "corrupt",
    ],
    "Fear Appeal": [
        "under attack", "crisis", "collapse", "war on", "threat", "danger",
        "before it's too late", "they are coming", "destroy our", "wipe out",
        "existential", "catastrophe", "disaster", "chaos", "panic",
    ],
    "Us vs Them": [
        "our nation", "our people", "our country", "enemy of the people",
        "corrupt elite", "globalist", "deep state", "they want", "they don't want",
        "the west", "western agenda", "foreign agents", "outsiders",
    ],
    "Discrediting Media": [
        "fake news", "mainstream media", "lamestream", "msm", "media lies",
        "censored", "suppressed", "they don't want you to know", "hidden truth",
        "cover up", "coverup", "propaganda", "misleading media",
    ],
    "Emotional Manipulation": [
        "wake up", "sheeple", "brainwashed", "sheep", "asleep", "open your eyes",
        "the truth is", "nobody talks about", "what they hide", "agenda",
        "manipulation", "hoax", "scam", "fraud", "lies", "lie",
    ],
    "Call to Action": [
        "fight back", "resist", "stand up", "act now", "join us", "spread the word",
        "share this", "wake others", "take action", "rise up",
    ],
}

# ---------------------------------------------------------------------------
# Singleton model holder
# ---------------------------------------------------------------------------


class PropagandaDetector:
    """Wraps tokenizer + model for propaganda inference."""

    def __init__(self) -> None:
        self.tokenizer: BertTokenizer | None = None
        self.model: BertForSequenceClassification | None = None
        self.device: torch.device = torch.device("cpu")
        self._loaded = False

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self, model_dir: str | None = None) -> None:
        """
        Load the tokenizer and model.

        Parameters
        ----------
        model_dir : str | None
            Path to a directory containing a saved model + tokenizer.
            If *None* or the directory does not exist, falls back to the
            base ``bert-base-multilingual-cased`` checkpoint (not fine-tuned).
        """
        # Determine device
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        else:
            self.device = torch.device("cpu")
        logger.info("Using device: %s", self.device)

        # Resolve model source
        use_local = model_dir and Path(model_dir).is_dir()
        source = model_dir if use_local else BASE_MODEL_NAME

        if use_local:
            logger.info("Loading fine-tuned model from: %s", source)
        else:
            logger.warning(
                "Local model directory not found (%s). "
                "Falling back to base checkpoint '%s' — predictions will NOT "
                "be meaningful until you provide the fine-tuned weights.",
                model_dir,
                BASE_MODEL_NAME,
            )

        # Always load tokenizer from base mBERT (client files may have wrong tokenizer)
        self.tokenizer = BertTokenizer.from_pretrained(BASE_MODEL_NAME)
        self.model = BertForSequenceClassification.from_pretrained(
            source, num_labels=NUM_LABELS
        )
        self.model.to(self.device)
        self.model.eval()
        self._loaded = True
        logger.info("Model loaded successfully.")

    # ------------------------------------------------------------------
    # Inference helpers
    # ------------------------------------------------------------------

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, text: str) -> dict:
        """
        Run inference on a single text string.

        Returns a dict with keys: label, label_id, confidence, probabilities.
        """
        return self.predict_batch([text])[0]

    def predict_batch(self, texts: list[str]) -> list[dict]:
        """
        Run inference on a batch of text strings.

        Returns a list of dicts, each with keys:
        label, label_id, confidence, probabilities.
        """
        if not self._loaded:
            raise RuntimeError("Model is not loaded. Call load() first.")

        # Preprocess
        cleaned = [clean_text(t) for t in texts]

        # Tokenize
        encoded = self.tokenizer(
            cleaned,
            truncation=True,
            padding="max_length",
            max_length=MAX_LENGTH,
            return_tensors="pt",
        )
        input_ids = encoded["input_ids"].to(self.device)
        attention_mask = encoded["attention_mask"].to(self.device)

        # Inference
        with torch.no_grad():
            outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits  # (batch, num_labels)

        # Temperature scaling — softens overconfident predictions
        probs = torch.nn.functional.softmax(logits / TEMPERATURE, dim=-1).cpu().numpy()

        results: list[dict] = []
        for text, prob_row in zip(cleaned, probs):
            # Merge 'unknown' (label 2) into 'non-propaganda' (label 0)
            merged_non_propaganda = float(prob_row[0]) + float(prob_row[2])
            merged_propaganda = float(prob_row[1])
            pred_label = "propaganda" if merged_propaganda > merged_non_propaganda else "non-propaganda"
            confidence = merged_propaganda if pred_label == "propaganda" else merged_non_propaganda

            # Detect propaganda techniques in the text
            text_lower = text.lower()
            detected_techniques = {}
            for technique, keywords in PROPAGANDA_TECHNIQUES.items():
                matched = [kw for kw in keywords if kw in text_lower]
                if matched:
                    detected_techniques[technique] = matched[:3]  # max 3 examples per technique

            # Flat list of flagged phrases for backward compat
            flagged = [kw for matches in detected_techniques.values() for kw in matches]

            results.append(
                {
                    "label": pred_label,
                    "label_id": 1 if pred_label == "propaganda" else 0,
                    "confidence": round(confidence, 6),
                    "probabilities": {
                        "non-propaganda": round(merged_non_propaganda, 6),
                        "propaganda": round(merged_propaganda, 6),
                        "unknown": 0.0,
                    },
                    "flagged_phrases": flagged[:10],
                    "detected_techniques": detected_techniques,
                }
            )

        return results


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

detector = PropagandaDetector()


def get_detector() -> PropagandaDetector:
    """Return the singleton detector instance."""
    return detector
