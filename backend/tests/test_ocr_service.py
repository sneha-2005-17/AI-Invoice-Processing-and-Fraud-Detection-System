import pytest
from app.services.ocr_service import OCRService


class TestOCRService:
    """Test cases for OCRService."""

    @pytest.fixture
    def ocr_service(self):
        """Fixture to provide OCRService instance."""
        return OCRService()

    def test_parse_invoice_involco_no_format(self, ocr_service):
        """Test extraction of invoice number from 'Involco No' format."""
        text = "Involco No 2502022694"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "2502022694"

    def test_parse_invoice_invoice_no_format(self, ocr_service):
        """Test extraction of invoice number from 'Invoice No' format."""
        text = "Invoice No 2502022694"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "2502022694"

    def test_parse_invoice_invoice_number_format(self, ocr_service):
        """Test extraction of invoice number from 'Invoice Number' format."""
        text = "Invoice Number 2502022694"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "2502022694"

    def test_parse_invoice_invoice_hash_format(self, ocr_service):
        """Test extraction of invoice number from 'Invoice#' format."""
        text = "Invoice#2502022694"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "2502022694"

    def test_parse_invoice_inv_no_format(self, ocr_service):
        """Test extraction of invoice number from 'Inv No' format."""
        text = "Inv No 2502022694"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "2502022694"

    def test_parse_invoice_with_special_characters(self, ocr_service):
        """Test extraction of invoice number with special characters."""
        text = "Invoice No INV-2025-001/ABC"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "INV-2025-001/ABC"

    def test_parse_invoice_fallback_numeric_match(self, ocr_service):
        """Test fallback numeric match when no prefix pattern matches."""
        text = "Some random text 123456789 more text"
        result = ocr_service.parse_invoice(text)
        assert result.invoice_number == "123456789"
