# Debug fixes plan (for invoice delete + policy assistant)

## Issue 1: Invoice delete button 500
- [ ] Reproduce by running backend + frontend and checking network request for DELETE /api/invoices/{id}
- [ ] Inspect backend DELETE handler for exceptions around Chroma delete and DB delete
- [ ] Improve exception handling + return structured HTTP error
- [ ] Ensure SQLAlchemy delete respects FK constraints (RagChunk/foreign keys)
- [ ] Ensure response shape matches frontend expectations
- [ ] Add frontend success/error notifications and ensure invoice list refresh uses API not local filter only

## Issue 2: Policy assistant returns empty answers
- [ ] Trace frontend call: POST /api/rag/chat with payload {question}
- [ ] Verify backend rag router expects PolicyQuestion model and returns PolicyAnswer
- [ ] Add logging inside PolicyAssistant.answer: collection query results length, query_texts
- [ ] Verify Chroma collection is loaded/using correct client mode (HttpClient vs PersistentClient)
- [ ] Ensure embeddings exist: check RagChunk rows inserted at upload time
- [ ] Add fallback: if no documents retrieved, return a non-empty helpful message including confidence Low
- [ ] Add Gemini call error handling: log exception, include error in response optionally
- [ ] Tests:
  - [ ] Backend: unit test PolicyAssistant.answer with seeded in-memory/fake Chroma (or stub)
  - [ ] Backend: integration test for /api/rag/chat when chroma unreachable
  - [ ] Frontend: basic component test (or manual verification checklist) for delete + notifications

