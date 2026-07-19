import re

DISEASE_TERMS = {
    "diabetes", "hypertension", "asthma", "anemia", "pneumonia",
    "migraine", "thyroid", "arthritis", "covid", "malaria",
    "cancer", "stroke", "depression", "anxiety", "alzheimer",
    "parkinson", "epilepsy", "tuberculosis", "hepatitis", "cirrhosis",
    "lupus", "fibromyalgia", "osteoporosis", "hypothyroidism", "hyperthyroidism",
    "psoriasis", "eczema", "obesity", "sepsis", "cholesterol",
    "bronchitis", "sinusitis", "appendicitis", "pancreatitis",
    "copd", "gerd", "colitis", "celiac",
}

MEDICINE_TERMS = {
    "paracetamol", "acetaminophen", "ibuprofen", "metformin",
    "amlodipine", "atorvastatin", "azithromycin", "amoxicillin",
    "omeprazole", "insulin",
    "aspirin", "lisinopril", "losartan", "sertraline", "fluoxetine",
    "levothyroxine", "prednisone", "dexamethasone", "furosemide",
    "pantoprazole", "cetirizine", "loratadine", "warfarin",
    "clopidogrel", "simvastatin", "rosuvastatin", "gabapentin",
    "tramadol", "morphine", "salbutamol", "albuterol",
    "fluticasone", "montelukast", "hydrochlorothiazide",
}

_DISEASE_RE: dict[str, re.Pattern] = {t: re.compile(r"\b" + re.escape(t) + r"\b") for t in DISEASE_TERMS}
_MEDICINE_RE: dict[str, re.Pattern] = {t: re.compile(r"\b" + re.escape(t) + r"\b") for t in MEDICINE_TERMS}


def extract_medical_entities(text: str) -> dict[str, list[str]]:
    text_lower = text.lower()
    return {
        "diseases": sorted(term for term, pat in _DISEASE_RE.items() if pat.search(text_lower)),
        "medicines": sorted(term for term, pat in _MEDICINE_RE.items() if pat.search(text_lower)),
    }
