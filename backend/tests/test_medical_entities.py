from app.utils.medical import extract_medical_entities


def test_extract_medical_entities_from_question() -> None:
    entities = extract_medical_entities("Can metformin help diabetes with hypertension?")
    assert entities["diseases"] == ["diabetes", "hypertension"]
    assert entities["medicines"] == ["metformin"]
