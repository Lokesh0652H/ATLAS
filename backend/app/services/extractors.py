import re
from typing import List, Dict, Any, Optional
from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument

class ExtractedSection:
    def __init__(
        self,
        content: str,
        page_number: Optional[int] = None,
        section_heading: Optional[str] = None
    ):
        self.content = content.strip()
        self.page_number = page_number
        self.section_heading = section_heading

class DocumentExtractor:
    @staticmethod
    def extract_pdf(file_path: str) -> (List[ExtractedSection], int):
        """Extract text from PDF page by page preserving page provenance."""
        sections: List[ExtractedSection] = []
        reader = PdfReader(file_path)
        total_pages = len(reader.pages)

        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                # Detect potential title/heading from first line
                lines = [line.strip() for line in text.splitlines() if line.strip()]
                heading = lines[0][:80] if lines else f"Page {page_idx + 1}"
                sections.append(
                    ExtractedSection(
                        content=text,
                        page_number=page_idx + 1,
                        section_heading=heading
                    )
                )

        return sections, total_pages

    @staticmethod
    def extract_docx(file_path: str) -> (List[ExtractedSection], Optional[int]):
        """Extract text from DOCX preserving heading hierarchy."""
        doc = DocxDocument(file_path)
        sections: List[ExtractedSection] = []
        current_heading = "Overview"
        current_text_buf: List[str] = []

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue

            if p.style and p.style.name.startswith("Heading"):
                if current_text_buf:
                    sections.append(
                        ExtractedSection(
                            content="\n".join(current_text_buf),
                            page_number=1,
                            section_heading=current_heading
                        )
                    )
                    current_text_buf = []
                current_heading = text
            else:
                current_text_buf.append(text)

        if current_text_buf:
            sections.append(
                ExtractedSection(
                    content="\n".join(current_text_buf),
                    page_number=1,
                    section_heading=current_heading
                )
            )

        return sections, 1

    @staticmethod
    def extract_markdown(file_path: str) -> (List[ExtractedSection], Optional[int]):
        """Extract text from Markdown preserving header hierarchy."""
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        sections: List[ExtractedSection] = []
        current_heading = "Introduction"
        current_lines: List[str] = []

        for line in content.splitlines():
            line_str = line.strip()
            if line_str.startswith("#"):
                if current_lines:
                    sections.append(
                        ExtractedSection(
                            content="\n".join(current_lines),
                            page_number=1,
                            section_heading=current_heading
                        )
                    )
                    current_lines = []
                # Clean header symbols
                current_heading = re.sub(r"^#+\s*", "", line_str)
            else:
                if line_str:
                    current_lines.append(line_str)

        if current_lines:
            sections.append(
                ExtractedSection(
                    content="\n".join(current_lines),
                    page_number=1,
                    section_heading=current_heading
                )
            )

        return sections, 1

    @classmethod
    def extract(cls, file_path: str, ext: str) -> (List[ExtractedSection], Optional[int]):
        """Dispatch to appropriate parser based on file extension."""
        ext = ext.lower()
        if ext == ".pdf":
            return cls.extract_pdf(file_path)
        elif ext == ".docx":
            return cls.extract_docx(file_path)
        elif ext in [".md", ".markdown", ".txt"]:
            return cls.extract_markdown(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
