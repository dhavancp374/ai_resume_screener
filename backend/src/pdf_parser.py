import PyPDF2

def extract_text_from_pdf(pdf_file):
    text = ""
    reader = PyPDF2.PdfReader(pdf_file)
    
    for page in reader.pages:
        text += page.extract_text()
        
    return text
