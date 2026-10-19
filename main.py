import os
import re
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import openai

from guardrails import check_emergency
from system_prompt import HEALTHCARE_SYSTEM_PROMPT
from specialists import get_all_specialists, book_appointment, BOOKINGS

load_dotenv()

app = FastAPI(title="AuraCare Healthcare Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "gpt-4o-mini"
    apiKey: Optional[str] = None
    baseUrl: Optional[str] = None

class AppointmentRequest(BaseModel):
    patient_name: str
    doctor_id: str
    doctor_name: str
    specialty: str
    slot: str
    notes: Optional[str] = ""

def detect_specialist_intent(text: str) -> List[str]:
    """Matches text keywords to recommended specialist categories."""
    matches = []
    text_lower = text.lower()
    
    mapping = {
        "spec-cardio": ["heart", "chest", "palpitation", "blood pressure", "hypertension", "cardio"],
        "spec-derm": ["skin", "rash", "acne", "mole", "itch", "eczema", "hair fall", "dermatol"],
        "spec-ortho": ["bone", "joint", "knee", "spine", "back pain", "fracture", "shoulder", "arthritis"],
        "spec-neuro": ["migraine", "headache", "nerve", "tingling", "vertigo", "dizziness", "seizure", "neurolog"],
        "spec-ent": ["throat", "ear", "sinus", "nose", "tonsil", "hearing", "nasal"],
        "spec-mental": ["anxiety", "depression", "panic", "stress", "sleep", "insomnia", "mental health", "sadness"],
        "spec-gp": ["fever", "flu", "cough", "cold", "body ache", "fatigue", "general checkup"]
    }

    for spec_id, keywords in mapping.items():
        if any(kw in text_lower for kw in keywords):
            matches.append(spec_id)
            
    return matches

@app.get("/api/health")
def health_check():
    load_dotenv(override=True)
    server_key = os.getenv("OPENAI_API_KEY", "")
    has_key = bool(server_key and not server_key.startswith("your_") and len(server_key.strip()) > 5)
    return {
        "status": "healthy",
        "has_server_api_key": has_key,
        "default_model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "default_base_url": os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    }

@app.get("/api/specialists")
def list_specialists():
    return {"specialists": get_all_specialists()}

@app.get("/api/bookings")
def list_bookings():
    return {"bookings": BOOKINGS}

@app.post("/api/book-appointment")
def create_booking(req: AppointmentRequest):
    if not req.patient_name or not req.slot:
        raise HTTPException(status_code=400, detail="Patient name and appointment slot are required.")
    
    booking = book_appointment(
        patient_name=req.patient_name,
        doctor_id=req.doctor_id,
        doctor_name=req.doctor_name,
        specialty=req.specialty,
        slot=req.slot,
        notes=req.notes or ""
    )
    return {"success": True, "booking": booking}

@app.post("/api/triage/check")
def quick_triage(req: Dict[str, str]):
    text = req.get("text", "")
    emergency = check_emergency(text)
    return {
        "is_emergency": emergency is not None,
        "emergency_details": emergency
    }

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, x_openai_key: Optional[str] = Header(None), x_openai_base_url: Optional[str] = Header(None)):
    load_dotenv(override=True)
    # 1. Resolve API Key (passed in body, or custom header, or .env)
    api_key = req.apiKey or x_openai_key or os.getenv("OPENAI_API_KEY")
    base_url = req.baseUrl or x_openai_base_url or os.getenv("OPENAI_BASE_URL")

    if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
        raise HTTPException(
            status_code=401,
            detail="API Key is missing. Please provide your API key in the top settings modal or in the .env file."
        )

    # 2. Extract latest user query for emergency and specialist scans
    user_messages = [m for m in req.messages if m.role == "user"]
    latest_user_text = user_messages[-1].content if user_messages else ""

    emergency_alert = check_emergency(latest_user_text)
    suggested_spec_ids = detect_specialist_intent(latest_user_text)

    # 3. Assemble messages with clinical system prompt
    formatted_messages = [{"role": "system", "content": HEALTHCARE_SYSTEM_PROMPT}]
    for m in req.messages:
        formatted_messages.append({"role": m.role, "content": m.content})

    # 4. Call OpenAI API (supports OpenRouter via base_url)
    try:
        client = openai.OpenAI(api_key=api_key.strip(), base_url=base_url)
        model_name = req.model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        completion = client.chat.completions.create(
            model=model_name,
            messages=formatted_messages,
            temperature=0.4,
            max_tokens=900,
        )

        reply_content = completion.choices[0].message.content

        # Filter specialist recommendations to full objects
        all_specs = get_all_specialists()
        recommended_specs = [s for s in all_specs if s["id"] in suggested_spec_ids]

        return {
            "reply": reply_content,
            "emergency_alert": emergency_alert,
            "recommended_specialists": recommended_specs[:2],
            "model_used": model_name
        }

    except openai.AuthenticationError:
        raise HTTPException(status_code=401, detail="Authentication failed: The provided API key is invalid.")
    except openai.RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit exceeded or quota exhausted. Please check your billing/quota.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")

# Mount static files folder
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "AuraCare API is running. Place frontend files in static directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
