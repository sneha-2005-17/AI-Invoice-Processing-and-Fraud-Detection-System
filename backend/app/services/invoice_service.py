from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.models.entities import Invoice, User, Vendor
from app.models.enums import InvoiceStatus
from app.services.fraud_service import FraudDetectionService
from app.services.ocr_service import OCRService

import logging

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024


class InvoiceService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.ocr = OCRService()
        self.fraud = FraudDetectionService()

    async def upload_and_process(self, db: Session, file: UploadFile, user: User) -> Invoice:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported invoice file type")
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds 15MB limit")

        upload_dir = Path(self.settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid4().hex}{suffix}"
        storage_path = upload_dir / stored_name

        logger.info(
            "Upload received: uploaded_filename=%s stored_name=%s storage_path=%s bytes=%s",
            file.filename,
            stored_name,
            str(storage_path),
            len(content),
        )

        storage_path.write_bytes(content)

        file_exists = storage_path.exists()
        logger.info(
            "Storage write status: file_exists=%s storage_path=%s",
            file_exists,
            str(storage_path),
        )

        text = self.ocr.extract_text(str(storage_path))
        logger.info(
            "OCR extraction complete: ocr_text_length=%s storage_path=%s",
            len(text or ""),
            str(storage_path),
        )

        # Required logging: first 1000 chars preview
        preview = (text or "")[:1000]
        logger.info("OCR text preview (first 1000 chars): %s", preview)

        extracted = self.ocr.parse_invoice(text or "")
        logger.info(
            "parse_invoice() results: invoice_number=%s vendor_name=%s gst_number=%s invoice_date=%s tax_amount=%s total_amount=%s",
            extracted.invoice_number,
            extracted.vendor_name,
            extracted.gst_number,
            extracted.invoice_date,
            extracted.tax_amount,
            extracted.total_amount,
        )

        vendor = self._get_or_create_vendor(db, extracted.vendor_name, extracted.gst_number)

        analysis = self._extract_document_analysis(
            text or "",
            filename=file.filename or stored_name,
            extracted=extracted,
        )

        invoice = Invoice(
            invoice_number=extracted.invoice_number,
            vendor_id=vendor.id if vendor else None,
            uploaded_by_id=user.id,
            invoice_date=extracted.invoice_date,
            gst_number=extracted.gst_number,
            tax_amount=extracted.tax_amount,
            total_amount=extracted.total_amount,
            line_items=extracted.line_items,
            raw_text=extracted.raw_text,
            original_filename=file.filename or stored_name,
            storage_path=str(storage_path),
            status=InvoiceStatus.EXTRACTED.value,
            analysis_result=analysis,
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        self.fraud.analyze(db, invoice)
        db.refresh(invoice)
        return invoice

    def _get_or_create_vendor(self, db: Session, name: str | None, gst_number: str | None) -> Vendor | None:
        if not name:
            return None
        vendor = db.query(Vendor).filter(Vendor.name == name).first()
        if vendor:
            return vendor
        vendor = Vendor(name=name, gst_number=gst_number, risk_score=40, is_approved=False)
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        return vendor

    def _extract_document_analysis(self, text: str, filename: str, extracted) -> dict:
        import json
        import re

        # Deterministic analysis scaffold (must not erase good extracted fields).
        fallback_analysis = {
            "document_type": "Invoice",
            # confidence_score/confidence summary will only be used when we truly have
            # no structured analysis available.
            "confidence_score": 0.2,
            "summary": "Document analysis generated from extracted invoice fields.",
            "important_names": [],
            "important_dates": [],
            "important_amounts": [],
            "risk_indicators": [],
        }

        # Required logging
        logger.info(
            "Document analysis started: uploaded_filename=%s text_length=%s",
            filename,
            len(text or ""),
        )
        logger.info("OCR text preview (first 1000 chars): %s", (text or "")[:1000])

        lowered_text = (text or "").lower()
        if any(s in lowered_text for s in ["salary", "payslip", "pay slip", "salary slip"]):
            fallback_analysis["document_type"] = "Salary Slip"
        elif any(s in lowered_text for s in ["sop", "procedure", "standard operating"]):
            fallback_analysis["document_type"] = "SOP"
        elif any(s in lowered_text for s in ["policy", "handbook"]):
            fallback_analysis["document_type"] = "Policy"

        vendor_match = re.search(r"vendor:\s*([^\n]+)", text or "", re.IGNORECASE)
        if vendor_match:
            fallback_analysis["important_names"].append(vendor_match.group(1).strip())

        date_matches = re.findall(r"(\d{4}-\d{2}-\d{2})|(\d{2}[\/\-]\d{2}[\/\-]\d{4})", text or "")
        for m in date_matches:
            d = m[0] or m[1]
            if d and d not in fallback_analysis["important_dates"]:
                fallback_analysis["important_dates"].append(d)

        total_match = re.search(
            r"total\s*(?:amount)?\s*[:\-]?\s*([\d,]+\.\d{2})",
            text or "",
            re.IGNORECASE,
        )
        if total_match:
            fallback_analysis["important_amounts"].append(total_match.group(1).strip())

        # Required logging: Gemini key and model
        gemini_key_present = bool(self.settings.gemini_api_key)
        logger.info(
            "Gemini API key availability: gemini_api_key_present=%s gemini_model=%s",
            gemini_key_present,
            self.settings.gemini_model,
        )

        # Deterministic enrichment from parse_invoice so we never erase good parsed values.
        # (Does not change DB schema or API contract; only enriches analysis_result.)
        try:
            if getattr(extracted, "vendor_name", None):
                vn = extracted.vendor_name
                if vn not in fallback_analysis["important_names"]:
                    fallback_analysis["important_names"].insert(0, vn)

            if getattr(extracted, "gst_number", None):
                gst = extracted.gst_number
                if gst and gst not in fallback_analysis["important_names"]:
                    fallback_analysis["important_names"].append(gst)

            if getattr(extracted, "invoice_date", None):
                inv_date = str(extracted.invoice_date)
                if inv_date not in fallback_analysis["important_dates"]:
                    fallback_analysis["important_dates"].insert(0, inv_date)

            if getattr(extracted, "total_amount", None) is not None:
                ta = float(extracted.total_amount)
                if ta > 0:
                    ts = f"{ta:.2f}"
                    if ts not in fallback_analysis["important_amounts"]:
                        fallback_analysis["important_amounts"].insert(0, ts)

            if getattr(extracted, "tax_amount", None) is not None:
                tax = float(extracted.tax_amount)
                if tax > 0:
                    txs = f"{tax:.2f}"
                    if txs not in fallback_analysis["important_amounts"]:
                        fallback_analysis["important_amounts"].append(txs)
        except Exception as e:
            logger.exception("Deterministic enrichment from parse_invoice failed: %s", e)

        # If Gemini is unavailable, return deterministic data derived from parse_invoice()
        # (no generic “OCR parser” messaging).
        if not gemini_key_present:
            logger.warning("fallback_analysis trigger reason: gemini_api_key_missing_or_empty")
            return fallback_analysis

        try:
            import google.generativeai as genai

            logger.info(
                "Gemini request start: uploaded_filename=%s model=%s",
                filename,
                self.settings.gemini_model,
            )

            genai.configure(api_key=self.settings.gemini_api_key)
            model = genai.GenerativeModel(self.settings.gemini_model)

            prompt = (
                "You are an AI document analysis engine. Analyze the following document text and "
                "return a JSON object containing the document metadata.\n"
                "The JSON object must have EXACTLY the following keys:\n"
                "- 'document_type' (string, e.g., 'Invoice', 'Salary Slip', 'SOP', 'Receipt', etc.)\n"
                "- 'confidence_score' (float, between 0.0 and 1.0)\n"
                "- 'summary' (string, brief summary of the document)\n"
                "- 'important_names' (array of strings, e.g., vendor, employee, client names)\n"
                "- 'important_dates' (array of strings, key dates found in the document)\n"
                "- 'important_amounts' (array of strings, key amounts like totals, salaries, taxes)\n"
                "- 'risk_indicators' (array of strings, any anomalies, missing info, or warnings)\n\n"
                "Do not include any explanation or markdown formatting. Return ONLY the raw JSON string.\n\n"
                f"Document Text:\n{text}"
            )

            response = model.generate_content(prompt)

            response_text = (getattr(response, "text", None) or "").strip()
            logger.info(
                "Gemini response preview (first 500 chars): %s",
                response_text[:500],
            )

            if not response_text:
                logger.warning("fallback_analysis trigger reason: gemini_returned_empty_text")
                return fallback_analysis

            clean_response = response_text
            if clean_response.startswith("```"):
                clean_response = clean_response.strip("`").strip()
                if clean_response.lower().startswith("json"):
                    clean_response = clean_response[4:].strip()

            try:
                result = json.loads(clean_response)
            except Exception as e:
                logger.exception("JSON parse failure: %s", e)
                logger.warning("fallback_analysis trigger reason: gemini_json_parse_failed")
                return fallback_analysis

            required_keys = [
                "document_type",
                "confidence_score",
                "summary",
                "important_names",
                "important_dates",
                "important_amounts",
                "risk_indicators",
            ]
            if all(k in result for k in required_keys):
                logger.info("Gemini analysis JSON validated successfully.")
                # Ensure deterministic extracted fields are not lost
                if getattr(extracted, "gst_number", None):
                    gst = extracted.gst_number
                    if gst and gst not in result.get("important_names", []):
                        result.setdefault("important_names", []).append(gst)
                if getattr(extracted, "vendor_name", None):
                    vn = extracted.vendor_name
                    if vn and vn not in result.get("important_names", []):
                        result.setdefault("important_names", []).insert(0, vn)
                if getattr(extracted, "invoice_date", None):
                    inv_date = str(extracted.invoice_date)
                    if inv_date and inv_date not in result.get("important_dates", []):
                        result.setdefault("important_dates", []).insert(0, inv_date)
                if getattr(extracted, "total_amount", None) is not None:
                    try:
                        ta = float(extracted.total_amount)
                        if ta > 0:
                            ts = f"{ta:.2f}"
                            if ts not in result.get("important_amounts", []):
                                result.setdefault("important_amounts", []).insert(0, ts)
                    except Exception:
                        pass
                if getattr(extracted, "tax_amount", None) is not None:
                    try:
                        tax = float(extracted.tax_amount)
                        if tax > 0:
                            txs = f"{tax:.2f}"
                            if txs not in result.get("important_amounts", []):
                                result.setdefault("important_amounts", []).append(txs)
                    except Exception:
                        pass
                return result

            # Gemini returned structured JSON but missing required keys:
            # do NOT show generic OCR-parser summary; keep deterministic extracted data.
            logger.warning("fallback_analysis trigger reason: gemini_json_missing_required_keys")
            return fallback_analysis

        except Exception as e:
            logger.exception("Analysis failure (Gemini): %s", e)
            logger.warning("fallback_analysis trigger reason: gemini_exception")
            return fallback_analysis
