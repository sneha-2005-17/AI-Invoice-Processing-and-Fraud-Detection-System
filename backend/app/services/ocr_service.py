from __future__ import annotations

from datetime import date
import re
from pathlib import Path
from typing import Iterable

from app.schemas.invoice import ExtractedInvoiceData


class OCRService:
    """
    OCR/extraction with NO mock/fallback invoice text.

    Text extraction may still return an empty string if OCR yields no text,
    but it must never generate simulated invoice content.
    """

    def __init__(self) -> None:
        self._easyocr_reader = None

    def _get_easyocr_reader(self):
        if self._easyocr_reader is not None:
            return self._easyocr_reader

        try:
            import easyocr  # type: ignore

            self._easyocr_reader = easyocr.Reader(["en"], gpu=False)
        except ImportError:
            self._easyocr_reader = None
        return self._easyocr_reader

    def extract_text(self, file_path: str) -> str:
        path = Path(file_path)

        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self._extract_pdf_text(path)

        # Image formats supported by requirements/ingestion:
        # PNG, JPG, JPEG, TIFF, BMP, WEBP
        if suffix in {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"}:
            return self._extract_image_text(path)

        # Unknown file type: return empty (no mock)
        return ""

    def _extract_pdf_text(self, path: Path) -> str:
        # Requirement: pdfplumber for PDFs (extract text)
        try:
            import pdfplumber  # type: ignore

            texts: list[str] = []
            with pdfplumber.open(str(path)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    texts.append(page_text)
            combined = "\n\n".join(t.strip() for t in texts if t and t.strip())
            if combined.strip():
                return combined
        except Exception:
            # Fall through to OCR if pdfplumber fails or yields no text.
            pass

        # Fallback to OCR for PDFs if text extraction fails:
        # Use pytesseract over rendered pages (no mock output).
        try:
            from pdf2image import convert_from_path  # type: ignore
            import pytesseract  # type: ignore

            pages = convert_from_path(str(path), dpi=220)
            page_texts: list[str] = []
            for page in pages:
                text = pytesseract.image_to_string(page) or ""
                if text.strip():
                    page_texts.append(text.strip())
            return "\n\n".join(page_texts)
        except Exception:
            return ""

    def _extract_image_text(self, path: Path) -> str:
        # Prefer pytesseract (requirement).
        try:
            import pytesseract  # type: ignore

            text = pytesseract.image_to_string(str(path)) or ""
            if text.strip():
                return text
        except Exception:
            pass

        # If pytesseract failed/empty and EasyOCR is available, use it (no mock).
        reader = self._get_easyocr_reader()
        if reader is None:
            return ""

        try:
            lines = reader.readtext(str(path), detail=0, paragraph=True)
            combined = "\n".join(lines)
            return combined.strip()
        except Exception:
            return ""

    def parse_invoice(self, text: str) -> ExtractedInvoiceData:
        import logging

        logger = logging.getLogger("ocr_service")

        # Defensive parsing: never crash due to OCR variations.
        try:
            invoice_number = self._first_match(
                text,
                [
                    r"(?:invoice|involco|inv)[\s.]*(?:no|number|#)?[\s:-]*([A-Z0-9-/]{6,})",
                    r"\b([0-9]{8,15})\b"
                ],
            )

            # GSTIN must include a capture group so _first_match can safely extract it.
            gst_number = self._first_match(
                text,
                [
                    r"(\d{2}[A-Z0-9]{13})",
                ],
            )

            vendor_name = self._extract_vendor(text)
            invoice_date = self._extract_date(text)

            total_amount = self._extract_money(
                text,
                [
                    "total bill amount",
                    "invoice value",
                    "grand total",
                    "total amount",
                    "amount due",
                    "total taxable amount",
                ],
            )
            tax_amount = self._extract_money(text, ["gst", "tax"])

            if total_amount is None:
                total_amount = 0.0
            if tax_amount is None:
                tax_amount = 0.0

        except Exception:
            invoice_number = None
            gst_number = None
            vendor_name = None
            invoice_date = None
            total_amount = 0.0
            tax_amount = 0.0

        extracted = ExtractedInvoiceData(
            invoice_number=invoice_number,
            vendor_name=vendor_name,
            invoice_date=invoice_date,
            gst_number=gst_number,
            tax_amount=tax_amount,
            total_amount=total_amount,
            line_items=self._extract_line_items(text),
            raw_text=text,
        )

        logger.info(
            "Invoice extraction result: invoice_number=%s vendor_name=%s gst_number=%s invoice_date=%s total_amount=%s",
            extracted.invoice_number,
            extracted.vendor_name,
            extracted.gst_number,
            extracted.invoice_date,
            extracted.total_amount,
        )
        return extracted

    def _first_match(self, text: str, patterns: Iterable[str]) -> str | None:
        """
        Safely return the first match.

        If regex has capture groups, return group(1).
        Otherwise return the full match (group(0)).
        """
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if not match:
                continue

            if match.lastindex:
                return match.group(1).strip()

            return match.group(0).strip()

        return None

    def _extract_vendor(self, text: str) -> str | None:
        # Generic vendor detection (works across arbitrary vendors).
        # Capture group ensures _first_match is not required here, and returns stable vendor strings.
        vendor_regex = r"([A-Z][A-Z\s&.,()\-]{5,}(?:LIMITED|LTD|PRIVATE LIMITED|PVT LTD))"
        match = re.search(vendor_regex, text.upper(), re.IGNORECASE)
        if match:
            vendor = match.group(1).strip()
            # Normalize whitespace
            vendor = re.sub(r"\s+", " ", vendor)
            return vendor[:255]

        # Heuristic fallback: choose a plausible uppercase/name line near the top.
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for line in lines[:20]:
            if (
                5 < len(line) < 120
                and not re.search(
                    r"invoice|tax|gst|date|amount|bill|eway|total|subtotal|vat",
                    line,
                    re.IGNORECASE,
                )
            ):
                if re.search(r"[A-Za-z]{3,}", line) and not re.search(r"\d{3,}", line):
                    return line[:255]

        return None

    def _extract_date(self, text: str) -> date | None:
        patterns = [r"(\d{4}-\d{2}-\d{2})", r"(\d{2}[\/\-]\d{2}[\/\-]\d{4})"]
        for pattern in patterns:
            match = re.search(pattern, text)
            if not match:
                continue
            value = match.group(1)
            parts = re.split(r"[\/\-]", value)
            try:
                if len(parts[0]) == 4:
                    return date(int(parts[0]), int(parts[1]), int(parts[2]))
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
            except ValueError:
                return None
        return None

    def _extract_money(self, text: str, labels: list[str]) -> float:
        for label in labels:
            pattern = rf"{label}[^\d]{{0,20}}([\d,]+(?:\.\d{{1,2}})?)"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(",", ""))
        amounts = [float(value.replace(",", "")) for value in re.findall(r"[\$₹]?\s*([\d,]+\.\d{2})", text)]
        return max(amounts) if amounts else 0

    def _extract_line_items(self, text: str) -> list[dict]:
        rows = []
        for line in text.splitlines():
            amount_match = re.search(r"([\d,]+\.\d{2})\s*$", line.strip())
            if amount_match and len(line.split()) >= 3:
                rows.append({"description": line[:120], "amount": float(amount_match.group(1).replace(",", ""))})
        return rows[:50]
