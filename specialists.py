import datetime
from typing import List, Dict, Optional

SPECIALISTS_DATA = [
    {
        "id": "spec-gp",
        "specialty": "General Medicine / Family Physician",
        "icon": "stethoscope",
        "description": "First-line primary care, common illnesses, fever, checkups, and preventive health.",
        "doctors": [
            {"id": "doc-1", "name": "Dr. Sarah Lin, MD", "experience": "12 yrs", "rating": 4.9, "slots": ["Today 4:00 PM", "Tomorrow 10:30 AM", "Tomorrow 2:00 PM"]},
            {"id": "doc-2", "name": "Dr. Robert Vance, MD", "experience": "18 yrs", "rating": 4.8, "slots": ["Tomorrow 11:00 AM", "Friday 3:30 PM"]}
        ]
    },
    {
        "id": "spec-cardio",
        "specialty": "Cardiology (Heart & Circulation)",
        "icon": "heart-pulse",
        "description": "Chest discomfort, blood pressure concerns, palpitations, and cardiovascular health.",
        "doctors": [
            {"id": "doc-3", "name": "Dr. Marcus Chen, FACC", "experience": "16 yrs", "rating": 4.95, "slots": ["Tomorrow 9:00 AM", "Thursday 1:00 PM"]},
            {"id": "doc-4", "name": "Dr. Elena Rostova, MD", "experience": "11 yrs", "rating": 4.85, "slots": ["Friday 10:00 AM", "Monday 2:00 PM"]}
        ]
    },
    {
        "id": "spec-derm",
        "specialty": "Dermatology (Skin, Hair & Nails)",
        "icon": "sparkles",
        "description": "Rashes, acne, unusual moles, eczema, allergic skin reactions.",
        "doctors": [
            {"id": "doc-5", "name": "Dr. Priya Patel, FAAD", "experience": "10 yrs", "rating": 4.9, "slots": ["Today 5:30 PM", "Thursday 11:15 AM"]},
            {"id": "doc-6", "name": "Dr. James Wilson, MD", "experience": "14 yrs", "rating": 4.8, "slots": ["Tomorrow 3:00 PM", "Friday 1:30 PM"]}
        ]
    },
    {
        "id": "spec-ortho",
        "specialty": "Orthopedics & Joint Care",
        "icon": "bone",
        "description": "Joint pain, knee/shoulder injuries, back stiffness, fractures & sprains.",
        "doctors": [
            {"id": "doc-7", "name": "Dr. David Miller, MD", "experience": "15 yrs", "rating": 4.9, "slots": ["Tomorrow 1:30 PM", "Friday 9:00 AM"]}
        ]
    },
    {
        "id": "spec-neuro",
        "specialty": "Neurology (Brain & Nerves)",
        "icon": "brain",
        "description": "Chronic migraines, nerve tingling, tremors, vertigo, sleep disturbances.",
        "doctors": [
            {"id": "doc-8", "name": "Dr. Sophia Al-Mansoor, MD", "experience": "13 yrs", "rating": 4.92, "slots": ["Thursday 10:00 AM", "Friday 2:00 PM"]}
        ]
    },
    {
        "id": "spec-ent",
        "specialty": "ENT / Otolaryngology (Ear, Nose & Throat)",
        "icon": "head-side-cough",
        "description": "Sinusitis, ear infections, persistent sore throat, hearing issues.",
        "doctors": [
            {"id": "doc-9", "name": "Dr. Alexander Kim, MD", "experience": "9 yrs", "rating": 4.87, "slots": ["Today 6:00 PM", "Tomorrow 10:00 AM"]}
        ]
    },
    {
        "id": "spec-mental",
        "specialty": "Psychiatry & Behavioral Health",
        "icon": "smile",
        "description": "Anxiety, stress management, depression, insomnia, emotional wellness.",
        "doctors": [
            {"id": "doc-10", "name": "Dr. Rachel Green, PsyD", "experience": "12 yrs", "rating": 4.96, "slots": ["Tomorrow 4:00 PM", "Friday 11:00 AM"]}
        ]
    }
]

# In-memory booking records
BOOKINGS: List[Dict] = []

def get_all_specialists() -> List[Dict]:
    return SPECIALISTS_DATA

def book_appointment(patient_name: str, doctor_id: str, doctor_name: str, specialty: str, slot: str, notes: str = "") -> Dict:
    booking = {
        "booking_id": f"BK-{len(BOOKINGS) + 1001}",
        "patient_name": patient_name,
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "specialty": specialty,
        "slot": slot,
        "notes": notes,
        "status": "Confirmed",
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    BOOKINGS.append(booking)
    return booking
