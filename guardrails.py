import re
from typing import Dict, List, Optional

# High-urgency emergency indicators that require immediate medical attention
EMERGENCY_PATTERNS = [
    r"\b(crushing|severe|radiating)\s+(chest\s+pain|pressure\b|tightness\b)",
    r"\b(chest\s+pain)\b",
    r"\b(difficulty\s+breathing|can'?t\s+breathe|severe\s+shortness\s+of\s+breath|suffocating)\b",
    r"\b(sudden\s+weakness|facial\s+droop|slurred\s+speech|paralysis|numbness\s+on\s+one\s+side)\b",  # Stroke signs
    r"\b(coughing\s+up\s+blood|vomiting\s+blood|severe\s+hemorrhage|uncontrolled\s+bleeding)\b",
    r"\b(anaphylaxis|swollen\s+tongue|throat\s+closing|severe\s+allergic\s+reaction)\b",
    r"\b(loss\s+of\s+consciousness|unresponsive|passed\s+out|fainted\s+and\s+not\s+waking)\b",
    r"\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die|self\s*harm)\b",
    r"\b(poisoning|swallowed\s+poison|overdose|drug\s+overdose)\b",
    r"\b(worst\s+headache\s+of\s+my\s+life|thunderclap\s+headache)\b"
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in EMERGENCY_PATTERNS]

def check_emergency(text: str) -> Optional[Dict[str, str]]:
    """
    Checks user text against high-risk emergency markers.
    Returns details if an emergency is detected, or None.
    """
    if not text:
        return None

    # Check for suicidal ideation / crisis specifically
    if re.search(r"\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die|self\s*harm)\b", text, re.IGNORECASE):
        return {
            "level": "CRITICAL_CRISIS",
            "title": "Immediate Crisis Assistance Needed",
            "message": "If you or someone you know is in crisis, please call or text 988 (Suicide & Crisis Lifeline in the US) or contact your national emergency hotline immediately. You are not alone and help is available 24/7.",
            "hotline": "988 or 911 (US) / 112 (EU) / 999 (UK)"
        }

    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            return {
                "level": "CRITICAL_MEDICAL",
                "title": "Urgent Medical Alert Detected",
                "message": "Your description matches symptoms that could indicate a time-critical medical emergency. Do not wait for a chat response. Please seek immediate in-person emergency care or call your local emergency service right away.",
                "hotline": "Call 911 (US/Canada) / 112 (Europe/India) / 999 (UK) or visit the nearest Emergency Room"
            }

    return None
