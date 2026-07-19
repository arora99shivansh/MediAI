from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config.settings import get_settings


class VectorStore:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model: SentenceTransformer | None = None

    def _model(self) -> SentenceTransformer:
        if self.model is None:
            self.model = SentenceTransformer(self.settings.embedding_model_name)
        return self.model

    def embed(self, texts: list[str]) -> np.ndarray:
        vectors = self._model().encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return np.asarray(vectors, dtype="float32")

    def user_index_path(self, user_id: str) -> Path:
        self.settings.vector_store_path.mkdir(parents=True, exist_ok=True)
        return self.settings.vector_store_path / f"{user_id}.index"

    def load_or_create(self, user_id: str, dimension: int) -> faiss.Index:
        path = self.user_index_path(user_id)
        if path.exists():
            return faiss.read_index(str(path))
        return faiss.IndexFlatIP(dimension)

    def save(self, user_id: str, index: faiss.Index) -> None:
        faiss.write_index(index, str(self.user_index_path(user_id)))

    def search(self, user_id: str, query: str, stored_vectors: np.ndarray, top_k: int) -> list[tuple[int, float]]:
        if stored_vectors.shape[0] == 0:
            return []
        query_vector = self.embed([query])
        index = faiss.IndexFlatIP(stored_vectors.shape[1])
        index.add(stored_vectors)
        scores, indexes = index.search(query_vector, min(top_k, stored_vectors.shape[0]))
        return [(int(idx), float(score)) for idx, score in zip(indexes[0], scores[0], strict=False) if idx >= 0]

    def rebuild_index(self, user_id: str, vectors: np.ndarray) -> None:
        index_path = self.user_index_path(user_id)
        if vectors.shape[0] == 0:
            index_path.unlink(missing_ok=True)
            return
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        self.save(user_id, index)
