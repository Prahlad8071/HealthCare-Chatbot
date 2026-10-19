# AuraCare AI — Intelligent Healthcare Assistant & Symptom Triage

A state-of-the-art Healthcare Chatbot powered by the OpenAI API (`gpt-4o` / `gpt-4o-mini`), featuring clinical safety guardrails, real-time emergency triage detection, specialist doctor recommendations, and appointment scheduling.

---

## ✨ Features

- **🩺 Clinical Symptom Triaging**: Guided intake asking clarifying questions on duration, severity (1–10 scale), and context without providing premature or dangerous self-diagnosis.
- **🚨 Automated Emergency Guardrails**: Scans for high-urgency cardiac, stroke, respiratory, hemorrhage, and crisis indicators, flashing an immediate Emergency Call banner (911/112/999).
- **👨‍⚕️ Specialist Matcher & Doctor Directory**: Automatically maps symptoms to relevant medical departments (Cardiology, Dermatology, Orthopedics, Neurology, ENT, Psychiatry) with doctor profiles and ratings.
- **📅 Interactive Appointment Booking**: Instant booking flow with confirmation cards, time slot selection, and appointment logs.
- **🎙️ Voice Dictation & Text-to-Speech**: Speech-to-Text input for hands-free typing and Text-to-Speech audio readout for accessibility.
- **📄 Export Consultation Summary**: One-click download of a formatted clinical summary in Markdown for physician visits.
- **⚙️ Flexible API Key Management**: Provide your OpenAI API key either in `.env` or directly through the web UI's secure settings modal.
- **🌓 Theme Customization**: Elegant dark mode with glowing clinical glassmorphism and high-contrast clean light mode.

---

## 🚀 Quick Start

### 1. Requirements
Ensure Python 3.9+ is installed.

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Add your OpenAI API Key
Either open `.env` and paste your key:
```env
OPENAI_API_KEY=sk-proj-your-actual-api-key
```
*Or* start the application and enter the key directly in the **System Configuration (Gear Icon)** in the web interface!

### 4. Run the Server
```bash
python run.py
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🛡️ Medical Disclaimer
AuraCare AI is an educational and triage guidance tool. It does not provide medical diagnoses, treatment prescriptions, or definitive medical opinions. In the event of an emergency, immediately call local emergency services (911/112) or visit the nearest emergency room.
