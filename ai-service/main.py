from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import io
import json

load_dotenv()

app = FastAPI(title="Humaein AI Service")

# Configure CORS to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.post("/api/process-documents")
async def process_documents(insurance_card: UploadFile = File(...), clinical_doc: UploadFile = File(...)):
    """
    This is the core AI endpoint. It takes two files:
    1. Insurance Card (image)
    2. Clinical Document (image or PDF)
    It uses OCR and OpenAI's GPT-4 to extract and structure data.
    """
    try:
        # 1. Read image files into memory
        insurance_image_data = await insurance_card.read()
        clinical_image_data = await clinical_doc.read()

        # 2. Use OCR to extract text from images
        insurance_text = extract_text_from_image(insurance_image_data)
        clinical_text = extract_text_from_image(clinical_image_data)

        # 3. Combine text and send to OpenAI for structured extraction
        combined_text = f"""
        INSURANCE CARD TEXT:
        {insurance_text}

        CLINICAL DOCUMENT TEXT:
        {clinical_text}
        """

        structured_data = await get_structured_data_with_openai(combined_text)

        return {"success": True, "data": structured_data, "raw_text": combined_text}

    except Exception as e:
        return {"success": False, "error": str(e)}

def extract_text_from_image(image_data):
    """Extracts text from an image using OCR"""
    try:
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

async def get_structured_data_with_openai(text):
    """Uses OpenAI to parse extracted text into structured JSON"""
    prompt = """
    You are an expert medical coder and insurance specialist. Extract the following information from the provided text extracted from an insurance card and a clinical document. 
    Return ONLY a valid JSON object with these keys: 
    - "patient_name" 
    - "date_of_birth" (format: YYYY-MM-DD)
    - "insurance_company" 
    - "policy_number"
    - "group_number"
    - "proposed_cpt_codes" (as an array of strings, e.g., ["99213", "93000"])
    - "proposed_icd_codes" (as an array of strings, e.g., ["I10", "E11.9"])
    - "estimated_denial_risk" (a number between 0 and 1, based on inconsistencies or missing data)

    If any information is missing or cannot be found, set the value to null.
    """
    
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.1  # Low temperature for more deterministic output
        )
        
        # Parse the JSON response from OpenAI
        result = response.choices[0].message.content
        return json.loads(result)
        
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return {}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)