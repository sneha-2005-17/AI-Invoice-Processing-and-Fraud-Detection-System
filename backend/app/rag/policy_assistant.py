from pathlib import Path
from uuid import uuid4
try:
    import chromadb
except ImportError:
    chromadb = None
import google.generativeai as genai
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.security import has_prompt_injection, sanitize_text
from app.models.entities import RagChunk, UploadedDocument, User
from app.schemas.rag import Citation, PolicyAnswer


class PolicyAssistant:
    def __init__(self) -> None:
        import logging
        self.logger = logging.getLogger(__name__)
        self.settings = get_settings()
        if chromadb is None:
            self.client = None
            self.collection = None
            self.logger.error("chromadb module is not available.")
        else:
            try:
                self.logger.info(f"Attempting to connect to Chroma HttpClient at {self.settings.chroma_host}:{self.settings.chroma_port}...")
                self.client = chromadb.HttpClient(host=self.settings.chroma_host, port=self.settings.chroma_port)
                self.client.heartbeat()
                self.logger.info("Successfully connected to Chroma HttpClient.")
            except Exception as e:
                self.logger.warning(f"Chroma HttpClient connection failed ({str(e)}). Falling back to PersistentClient at storage/chromadb...")
                self.client = chromadb.PersistentClient(path="storage/chromadb")
            self.collection = self.client.get_or_create_collection("finance_policy_chunks")
            self.logger.info(f"Initialized collection 'finance_policy_chunks'. Current document count: {self.collection.count()}")
        
        if self.settings.gemini_api_key:
            genai.configure(api_key=self.settings.gemini_api_key)

    async def ingest(self, db: Session, file: UploadFile, document_type: str, user: User) -> UploadedDocument:
        self.logger.info(f"Ingesting document: filename={file.filename}, type={document_type}, user={user.email}")
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in {".txt", ".md", ".pdf"}:
            self.logger.warning(f"Unsupported policy document type: {suffix}")
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
        self.logger.info(f"Split document {document.id} into {len(chunks)} chunks.")
        for index, chunk in enumerate(chunks):
            embedding_id = f"doc-{document.id}-{index}"
            if self.collection:
                try:
                    self.logger.info(f"Adding embedding chunk {embedding_id} to Chroma collection.")
                    self.collection.add(
                        ids=[embedding_id],
                        documents=[chunk],
                        metadatas=[{"document_id": document.id, "source": document.title, "chunk_index": index}],
                    )
                except Exception as e:
                    self.logger.error(f"Failed to add embedding chunk {embedding_id} to Chroma: {str(e)}")
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
        self.logger.info(f"Document ingestion complete: title={document.title}, id={document.id}")
        return document

    def answer(self, question: str) -> PolicyAnswer:
        safe_question = sanitize_text(question)
        self.logger.info(f"PolicyAssistant.answer called with question: {question!r} (sanitized: {safe_question!r})")

        if has_prompt_injection(safe_question):
            self.logger.warning("Prompt injection attempt blocked.")
            return PolicyAnswer(
                answer="This question was blocked because it resembles a prompt injection attempt.",
                citations=[],
                blocked=True,
            )

        if not self.collection:
            self.logger.error("Chroma collection is not initialized. Cannot retrieve policy clauses.")
            return PolicyAnswer(
                answer="No relevant policy clauses were retrieved from the uploaded policy documents for this question.",
                citations=[],
                source_document=None,
                section_reference=None,
                confidence_score="Low",
            )

        self.logger.info("Querying Chroma database...")
        documents, metadatas, distances, ids = [], [], [], []
        try:
            results = self.collection.query(query_texts=[safe_question], n_results=4)
            documents = results.get("documents", [[]])[0] or []
            metadatas = results.get("metadatas", [[]])[0] or []
            distances = results.get("distances", [[]])[0] or []
            ids = results.get("ids", [[]])[0] or []
            
            self.logger.info(f"Retrieval Diagnostics: Query retrieved {len(documents)} results.")
            for idx in range(len(documents)):
                doc_id = ids[idx] if idx < len(ids) else "N/A"
                dist = distances[idx] if idx < len(distances) else "N/A"
                meta = metadatas[idx] if idx < len(metadatas) else {}
                self.logger.info(f"  Result [{idx}]: ID={doc_id}, Distance={dist}, Source={meta.get('source')}, Content snippet: {documents[idx][:100]!r}")
        except Exception as e:
            self.logger.exception(f"Exception during Chroma query: {str(e)}")

        if not documents or not metadatas:
            self.logger.warning("No documents retrieved from Chroma collection.")
            return PolicyAnswer(
                answer="No relevant policy clauses were retrieved from the uploaded policy documents for this question.",
                citations=[],
                source_document=None,
                section_reference=None,
                confidence_score="Low",
            )

        context = "\n\n".join(
            f"Source: {meta.get('source')}\n{doc}" for doc, meta in zip(documents, metadatas)
        )
        self.logger.info("Generating compliance answer from Gemini model...")
        res_dict = self._generate_answer(safe_question, context)
        citations = [
            Citation(source=str(meta.get("source")), excerpt=doc[:280])
            for doc, meta in zip(documents, metadatas)
        ]
        self.logger.info(f"Successfully generated answer. Confidence: {res_dict.get('confidence_score')}, Source Document: {res_dict.get('source_document')}")
        return PolicyAnswer(
            answer=res_dict["answer"],
            citations=citations,
            source_document=res_dict.get("source_document"),
            section_reference=res_dict.get("section_reference"),
            confidence_score=res_dict.get("confidence_score"),
        )

    def _generate_answer(self, question: str, context: str) -> dict:
        fallback_res = {
            "answer": "Retrieved policy context excerpt (no model-based answer available):\n" + context[:700].strip(),
            "source_document": None,
            "section_reference": None,
            "confidence_score": "Low"
        }
        if not context:
            return {
                "answer": "No relevant policy clauses were retrieved from the uploaded policy documents for this question.",
                "source_document": None,
                "section_reference": None,
                "confidence_score": "Low",
            }

        if not self.settings.gemini_api_key:
            self.logger.warning("GEMINI_API_KEY not set. Using fallback excerpt response.")
            fallback_res["answer"] = context[:700].strip()
            if "Source: " in context:
                parts = context.split("Source: ")
                if len(parts) > 1:
                    fallback_res["source_document"] = parts[1].split("\n")[0].strip()
            return fallback_res

        import json
        model = genai.GenerativeModel(self.settings.gemini_model)
        prompt = (
            "You are a finance compliance assistant. Answer the user's question using ONLY the provided policy context.\n"
            "You must return a raw JSON object containing the following keys:\n"
            "- 'answer' (string: the actual answer to the question, based strictly on context)\n"
            "- 'source_document' (string or null: the specific name of the source document from the context used to answer)\n"
            "- 'section_reference' (string or null: any section, clause, or paragraph identifier mentioned in the context)\n"
            "- 'confidence_score' (string: 'High', 'Medium', or 'Low' indicating how fully the context answers the question)\n\n"
            "Do not include any explanation or markdown formatting (like ```json), return ONLY the raw JSON string.\n\n"
            f"Question: {question}\n\nContext:\n{context}"
        )
        try:
            self.logger.info(f"Generating content using model: {self.settings.gemini_model}")
            response = model.generate_content(prompt)
            clean_res = response.text.strip()
            if clean_res.startswith("```"):
                clean_res = clean_res.strip("`").strip()
                if clean_res.lower().startswith("json"):
                    clean_res = clean_res[4:].strip()
            
            data = json.loads(clean_res)
            return {
                "answer": data.get("answer", "No answer key found in AI response."),
                "source_document": data.get("source_document"),
                "section_reference": data.get("section_reference"),
                "confidence_score": data.get("confidence_score", "Medium"),
            }
        except Exception as e:
            self.logger.exception(f"Gemini generation call failed: {str(e)}")
            fallback_res["answer"] = context[:700].strip()
            return fallback_res

    def _read_document(self, path: Path) -> str:
        """
        Read policy documents as plain text.

        IMPORTANT: No mock/demo/fallback strings must ever be returned.
        If extraction fails, return an empty string.
        """
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            try:
                import pdfplumber  # type: ignore

                texts: list[str] = []
                with pdfplumber.open(str(path)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        if page_text.strip():
                            texts.append(page_text)
                combined = "\n\n".join(texts).strip()
                if combined:
                    return combined
            except Exception:
                pass

            # If pdfplumber fails/returns nothing, OCR the rendered pages.
            try:
                from pdf2image import convert_from_path  # type: ignore
                import pytesseract  # type: ignore

                pages = convert_from_path(str(path), dpi=220)
                page_texts: list[str] = []
                for page in pages:
                    t = pytesseract.image_to_string(page) or ""
                    if t.strip():
                        page_texts.append(t.strip())
                return "\n\n".join(page_texts).strip()
            except Exception:
                return ""

        # TXT/MD fallback to plain text read (no simulated output)
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

    def _chunk(self, text: str, size: int = 1000, overlap: int = 150) -> list[str]:
        words = text.split()
        chunks = []
        start = 0
        while start < len(words):
            chunks.append(" ".join(words[start : start + size]))
            start += size - overlap
        return chunks
