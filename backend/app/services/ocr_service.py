from datetime import date
import re
from pathlib import Path
from typing import Iterable
from app.schemas.invoice import ExtractedInvoiceData


class OCRService:
    def __init__(self) -> None:
        self._reader = None

    def _load_reader(self):
        if self._reader is None:
            import easyocr

            self._reader = easyocr.Reader(["en"], gpu=False)
        return self._reader

    def extract_text(self, file_path: str) -> str:
        path = Path(file_path)
        if path.suffix.lower() == ".pdf":
            return self._extract_pdf(path)
        reader = self._load_reader()
        lines = reader.readtext(str(path), detail=0, paragraph=True)
        return "\n".join(lines)

    def _extract_pdf(self, path: Path) -> str:
        from pdf2image import convert_from_path

        reader = self._load_reader()
        pages = convert_from_path(str(path), dpi=220)
        text_blocks: list[str] = []
        for page in pages:
            lines = reader.readtext(page, detail=0, paragraph=True)
            text_blocks.append("\n".join(lines))
        return "\n\n".join(text_blocks)

    def parse_invoice(self, text: str) -> ExtractedInvoiceData:
        invoice_number = self._first_match(text, [r"invoice\s*(?:no|number|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)"])
        gst_number = self._first_match(text, [r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9])\b"])
        vendor_name = self._extract_vendor(text)
        invoice_date = self._extract_date(text)
        total_amount = self._extract_money(text, ["total", "amount due", "grand total"])
        tax_amount = self._extract_money(text, ["gst", "tax"])
        return ExtractedInvoiceData(
            invoice_number=invoice_number,
            vendor_name=vendor_name,
            invoice_date=invoice_date,
            gst_number=gst_number,
            tax_amount=tax_amount,
            total_amount=total_amount,
            line_items=self._extract_line_items(text),
            raw_text=text,
        )

    def _first_match(self, text: str, patterns: Iterable[str]) -> str | None:
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_vendor(self, text: str) -> str | None:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for line in lines[:8]:
            if not re.search(r"invoice|tax|gst|date|bill", line, re.IGNORECASE):
                return line[:255]
        return lines[0][:255] if lines else None

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
