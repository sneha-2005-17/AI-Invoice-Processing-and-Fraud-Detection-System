from pathlib import Path
from uuid import uuid4
import chromadb
import google.generativeai as genai
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.security import has_prompt_injection, sanitize_text
from app.models.entities import RagChunk, UploadedDocument, User
from app.schemas.rag import Citation, PolicyAnswer


class PolicyAssistant:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = chromadb.HttpClient(host=self.settings.chroma_host, port=self.settings.chroma_port)
        self.collection = self.client.get_or_create_collection("finance_policy_chunks")
        if self.settings.gemini_api_key:
            genai.configure(api_key=self.settings.gemini_api_key)

    async def ingest(self, db: Session, file: UploadFile, document_type: str, user: User) -> UploadedDocument:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in {".txt", ".md", ".pdf"}:
            raise HTTPException(status_code=400, detail="Policy documents must be TXT, Markdown, or PDF")
        content = await file.read()
        upload_dir = Path(self.settings.upload_dir) / "policies"
        upload_dir.mkdir(parents=True, exist_ok=True)
        path = upload_dir / f"{uuid4().hex}{suffix}"
        path.write_bytes(content)

        text = self._read_document(path)
        document = UploadedDocument(
            title=file.filename or path.name,
            document_type=document_type,
            storage_path=str(path),
            uploaded_by_id=user.id,
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        chunks = self._chunk(text)
        for index, chunk in enumerate(chunks):
            embedding_id = f"doc-{document.id}-{index}"
            self.collection.add(
                ids=[embedding_id],
                documents=[chunk],
                metadatas=[{"document_id": document.id, "source": document.title, "chunk_index": index}],
            )
            db.add(
                RagChunk(
                    document_id=document.id,
                    chunk_index=index,
                    content=chunk,
                    source_reference=f"{document.title} chunk {index + 1}",
                    embedding_id=embedding_id,
                )
            )
        db.commit()
        return document

    def answer(self, question: str) -> PolicyAnswer:
        safe_question = sanitize_text(question)
        if has_prompt_injection(safe_question):
            return PolicyAnswer(
                answer="This question was blocked because it resembles a prompt injection attempt.",
                citations=[],
                blocked=True,
            )
        results = self.collection.query(query_texts=[safe_question], n_results=4)
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        context = "\n\n".join(f"Source: {meta.get('source')}\n{doc}" for doc, meta in zip(documents, metadatas))
        answer = self._generate_answer(safe_question, context)
        citations = [
            Citation(source=str(meta.get("source")), excerpt=doc[:280])
            for doc, meta in zip(documents, metadatas)
        ]
        return PolicyAnswer(answer=answer, citations=citations)

    def _generate_answer(self, question: str, context: str) -> str:
        if not context:
            return "I could not find relevant finance policy context for this question."
        if not self.settings.gemini_api_key:
            return f"Based on the available policy context, review these cited clauses before acting: {context[:700]}"
        model = genai.GenerativeModel(self.settings.gemini_model)
        prompt = (
            "Answer using only the cited finance policy context. Include practical compliance reasoning. "
            "If the context is insufficient, say so.\n\n"
            f"Question: {question}\n\nContext:\n{context}"
        )
        response = model.generate_content(prompt)
        return response.text

    def _read_document(self, path: Path) -> str:
        if path.suffix.lower() == ".pdf":
            from pdf2image import convert_from_path
            import easyocr

            reader = easyocr.Reader(["en"], gpu=False)
            return "\n".join("\n".join(reader.readtext(page, detail=0)) for page in convert_from_path(str(path)))
        return path.read_text(encoding="utf-8", errors="ignore")

    def _chunk(self, text: str, size: int = 1000, overlap: int = 150) -> list[str]:
        words = text.split()
        chunks = []
        start = 0
        while start < len(words):
            chunks.append(" ".join(words[start : start + size]))
            start += size - overlap
        return chunks
