from app.rag.rag_service import RAGService


class FakeDatabase:
    name = "fake"


def test_rag_prompt_includes_citations_and_disclaimer_contract() -> None:
    service = RAGService(FakeDatabase())
    prompt = service.build_prompt(
        "Explain my report",
        [{"filename": "cbc.pdf", "page": 2, "text": "Hemoglobin is below reference range."}],
        "English",
    )
    assert "Source 1: cbc.pdf page 2" in prompt
    assert "Disclaimer" in prompt
    assert "Few-shot style" in prompt
    assert "If context is insufficient" in prompt
