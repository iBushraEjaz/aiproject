"""
Model loading and inference for the Propaganda Detection API.

Loads a fine-tuned mBERT (bert-base-multilingual-cased) model for
binary propaganda classification.
"""

import os
import logging
from pathlib import Path

import torch
import numpy as np
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

        self.tokenizer = BertTokenizer.from_pretrained(source)
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

        # Softmax probabilities
        probs = torch.nn.functional.softmax(logits, dim=-1).cpu().numpy()

        results: list[dict] = []
        for prob_row in probs:
            pred_id = int(np.argmax(prob_row))
            results.append(
                {
                    "label": LABEL_MAP.get(pred_id, "unknown"),
                    "label_id": pred_id,
                    "confidence": round(float(prob_row[pred_id]), 6),
                    "probabilities": {
                        LABEL_MAP[i]: round(float(p), 6)
                        for i, p in enumerate(prob_row)
                    },
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
