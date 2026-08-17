# API Documentation

Base URL: `/api`

## Authentication

- `POST /auth/register`: Register a user and return a JWT.
- `POST /auth/login`: Login and return a JWT.
- `GET /auth/me`: Return the authenticated profile.

## Invoices

- `POST /invoices/upload`: Upload PDF/image invoice, run OCR extraction, persist data, and calculate fraud risk.
- `GET /invoices`: List invoices visible to the current user.
- `GET /invoices/{invoice_id}`: Fetch invoice extraction and fraud details.

## Fraud Detection

- `POST /fraud/{invoice_id}/reanalyze`: Re-run duplicate, GST, amount anomaly, and vendor risk checks.

## RAG Policy Assistant

- `POST /rag/documents`: Admin upload for finance policies, GST guidelines, vendor rules, and accounting manuals.
- `POST /rag/chat`: Ask policy questions and receive citation-backed answers.

## Dashboards

- `GET /dashboard/summary`: Admin/analyst KPI payload for invoice, fraud, GST, vendor, and trend charts.
- `GET /evaluation/summary`: RAG, system, performance, and user-feedback metrics.

## Reports

- `POST /reports/invoice/{invoice_id}?fmt=pdf`: Create an invoice summary report.
- `POST /reports/invoice/{invoice_id}?fmt=csv`: Create a CSV invoice report.
- `GET /reports/{report_id}/download`: Download a generated report.

## Admin

- `GET /admin/audit-logs`: Recent security and workflow audit events.
- `GET /admin/vendors`: Vendor risk and approval overview.

## Security Controls

- JWT authentication and RBAC dependencies.
- Password hashing with bcrypt.
- Upload extension and size validation.
- SlowAPI request rate limiting.
- Input sanitization and prompt-injection blocking.
- Sensitive value masking helper.
- Audit logging for auth and invoice actions.
