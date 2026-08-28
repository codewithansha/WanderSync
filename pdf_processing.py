import fitz  # PyMuPDF

def extract_text_from_pdf(file):
    """
    Extract text content from an uploaded travel document / PDF file.
    Supports flight confirmations, hotel vouchers, itineraries, and guides.
    """
    try:
        if hasattr(file, 'read'):
            file_bytes = file.read()
        else:
            file_bytes = file
            
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += f"--- Page {page_num + 1} ---\n"
            text += page.get_text() + "\n"
            
        cleaned = text.strip()
        if not cleaned:
            return "No extractable text found in this PDF (it may contain only scanned images)."
        return cleaned
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"
