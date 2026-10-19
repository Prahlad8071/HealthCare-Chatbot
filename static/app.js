// AuraCare AI — Application Engine

const STATE = {
  apiKey: localStorage.getItem("auracare_openai_key") || "",
  baseUrl: localStorage.getItem("auracare_base_url") || "https://api.openai.com/v1",
  model: localStorage.getItem("auracare_model") || "gpt-4o-mini",
  history: [],
  hasServerKey: false,
  isGenerating: false,
  selectedDoctor: null,
  selectedSpecialty: null,
  speechRecognition: null,
  isListening: false
};

// DOM Elements
const DOM = {
  chatViewport: document.getElementById("chat-viewport"),
  welcomeContainer: document.getElementById("welcome-container"),
  chatMessages: document.getElementById("chat-messages"),
  typingIndicator: document.getElementById("typing-indicator"),
  chatForm: document.getElementById("chat-form"),
  chatTextarea: document.getElementById("chat-textarea"),
  btnSend: document.getElementById("btn-send"),
  btnVoiceInput: document.getElementById("btn-voice-input"),
  micIcon: document.getElementById("mic-icon"),
  btnNewChat: document.getElementById("btn-new-chat"),
  btnClearChat: document.getElementById("btn-clear-chat"),
  btnExportChat: document.getElementById("btn-export-chat"),
  btnThemeToggle: document.getElementById("btn-theme-toggle"),
  themeIcon: document.getElementById("theme-icon"),
  emergencyBanner: document.getElementById("emergency-banner"),
  emergencyTitle: document.getElementById("emergency-title"),
  emergencyDesc: document.getElementById("emergency-desc"),
  btnDismissEmergency: document.getElementById("btn-dismiss-emergency"),
  disclaimerBar: document.getElementById("disclaimer-bar"),
  btnAcceptDisclaimer: document.getElementById("btn-accept-disclaimer"),
  // Sidebar & Nav
  sidebar: document.getElementById("sidebar"),
  btnToggleSidebar: document.getElementById("btn-toggle-sidebar"),
  btnMobileMenu: document.getElementById("btn-mobile-menu"),
  navChat: document.getElementById("nav-chat"),
  navSpecialists: document.getElementById("nav-specialists"),
  navBookings: document.getElementById("nav-bookings"),
  bookingCountBadge: document.getElementById("booking-count-badge"),
  statusText: document.getElementById("status-text"),
  apiKeyIndicator: document.getElementById("api-key-indicator"),
  // Settings Modal
  settingsModal: document.getElementById("settings-modal"),
  btnOpenSettings: document.getElementById("btn-open-settings"),
  btnCloseSettings: document.getElementById("btn-close-settings"),
  btnCancelSettings: document.getElementById("btn-cancel-settings"),
  btnSaveSettings: document.getElementById("btn-save-settings"),
  inputApiKey: document.getElementById("input-api-key"),
  inputBaseUrl: document.getElementById("input-base-url"),
  selectModel: document.getElementById("select-model"),
  btnTogglePw: document.getElementById("btn-toggle-pw"),
  pwEyeIcon: document.getElementById("pw-eye-icon"),
  settingsFeedback: document.getElementById("settings-feedback"),
  // Specialist & Booking Modal
  specialistModal: document.getElementById("specialist-modal"),
  btnCloseSpecialist: document.getElementById("btn-close-specialist"),
  specialistBrowseView: document.getElementById("specialist-browse-view"),
  specialistFormView: document.getElementById("specialist-form-view"),
  specialistSuccessView: document.getElementById("specialist-success-view"),
  specialistGrid: document.getElementById("specialist-grid"),
  btnBackToSpecialists: document.getElementById("btn-back-to-specialists"),
  selectedDocCard: document.getElementById("selected-doc-card"),
  bookingForm: document.getElementById("booking-form"),
  patientNameInput: document.getElementById("patient-name"),
  appointmentSlotSelect: document.getElementById("appointment-slot"),
  patientNotesInput: document.getElementById("patient-notes"),
  bookingReceipt: document.getElementById("booking-receipt"),
  btnFinishBooking: document.getElementById("btn-finish-booking"),
  // Appointments List Modal
  myAppointmentsModal: document.getElementById("my-appointments-modal"),
  btnCloseAppointments: document.getElementById("btn-close-appointments"),
  appointmentsListContainer: document.getElementById("appointments-list-container")
};

// ---------------- INITIALIZATION ----------------
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  checkDisclaimer();
  setupVoiceRecognition();
  setupEventListeners();
  loadThemePreference();
  updateApiKeyIndicator();
  fetchBookingsCount();
});

// Check Server Health & Key status
async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      const data = await res.json();
      STATE.hasServerKey = data.has_server_api_key;
      updateApiKeyIndicator();
    }
  } catch (err) {
    console.warn("Server health check failed:", err);
  }
}

function updateApiKeyIndicator() {
  if (STATE.hasServerKey || (STATE.apiKey && STATE.apiKey.length > 10)) {
    DOM.apiKeyIndicator.textContent = "Ready";
    DOM.apiKeyIndicator.className = "api-status-badge ok";
  } else {
    DOM.apiKeyIndicator.textContent = "Key Needed";
    DOM.apiKeyIndicator.className = "api-status-badge missing";
  }
}

// Disclaimer acceptance check
function checkDisclaimer() {
  if (localStorage.getItem("auracare_disclaimer_accepted") === "true") {
    DOM.disclaimerBar.classList.add("hidden");
  }
}

// ---------------- EVENT LISTENERS ----------------
function setupEventListeners() {
  // Disclaimer
  DOM.btnAcceptDisclaimer.addEventListener("click", () => {
    localStorage.setItem("auracare_disclaimer_accepted", "true");
    DOM.disclaimerBar.classList.add("hidden");
  });

  // Emergency Banner Dismiss
  DOM.btnDismissEmergency.addEventListener("click", () => {
    DOM.emergencyBanner.classList.add("hidden");
  });

  // Chat Form Submit
  DOM.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  // Textarea dynamic resize & Enter submit
  DOM.chatTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  DOM.chatTextarea.addEventListener("input", () => {
    DOM.chatTextarea.style.height = "auto";
    DOM.chatTextarea.style.height = Math.min(DOM.chatTextarea.scrollHeight, 140) + "px";
  });

  // Prompt Cards Click
  document.querySelectorAll(".prompt-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.getAttribute("data-prompt");
      if (prompt) {
        DOM.chatTextarea.value = prompt;
        handleSendMessage();
      }
    });
  });

  // Quick Tags Click
  document.querySelectorAll(".quick-tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.getAttribute("data-tag");
      DOM.chatTextarea.value = `I am experiencing ${tag}. Can you provide clinical guidance?`;
      DOM.chatTextarea.focus();
    });
  });

  // Voice Input Button
  DOM.btnVoiceInput.addEventListener("click", toggleVoiceDictation);

  // New Chat & Clear Chat
  DOM.btnNewChat.addEventListener("click", resetConversation);
  DOM.btnClearChat.addEventListener("click", resetConversation);

  // Export Chat
  DOM.btnExportChat.addEventListener("click", exportChatSummary);

  // Theme Toggle
  DOM.btnThemeToggle.addEventListener("click", toggleTheme);

  // Mobile menu toggle
  DOM.btnMobileMenu?.addEventListener("click", () => DOM.sidebar.classList.toggle("open"));
  DOM.btnToggleSidebar?.addEventListener("click", () => DOM.sidebar.classList.remove("open"));

  // Settings Modal events
  DOM.btnOpenSettings.addEventListener("click", openSettingsModal);
  DOM.btnCloseSettings.addEventListener("click", () => DOM.settingsModal.classList.add("hidden"));
  DOM.btnCancelSettings.addEventListener("click", () => DOM.settingsModal.classList.add("hidden"));
  DOM.btnSaveSettings.addEventListener("click", saveSettings);
  DOM.btnTogglePw.addEventListener("click", togglePasswordVisibility);

  // Specialist Navigation & Modal
  DOM.navSpecialists.addEventListener("click", openSpecialistModal);
  DOM.btnCloseSpecialist.addEventListener("click", () => DOM.specialistModal.classList.add("hidden"));
  DOM.btnBackToSpecialists.addEventListener("click", showSpecialistBrowseView);
  DOM.bookingForm.addEventListener("submit", handleBookingSubmit);
  DOM.btnFinishBooking.addEventListener("click", () => {
    DOM.specialistModal.classList.add("hidden");
    showSpecialistBrowseView();
  });

  // My Appointments Modal
  DOM.navBookings.addEventListener("click", openAppointmentsModal);
  DOM.btnCloseAppointments.addEventListener("click", () => DOM.myAppointmentsModal.classList.add("hidden"));
}

// ---------------- VOICE RECOGNITION ----------------
function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    DOM.btnVoiceInput.style.display = "none";
    return;
  }

  STATE.speechRecognition = new SpeechRecognition();
  STATE.speechRecognition.continuous = false;
  STATE.speechRecognition.interimResults = false;
  STATE.speechRecognition.lang = "en-US";

  STATE.speechRecognition.onstart = () => {
    STATE.isListening = true;
    DOM.btnVoiceInput.classList.add("listening");
    DOM.micIcon.className = "fa-solid fa-microphone-lines";
  };

  STATE.speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript) {
      DOM.chatTextarea.value = (DOM.chatTextarea.value + " " + transcript).trim();
      DOM.chatTextarea.dispatchEvent(new Event("input"));
    }
  };

  STATE.speechRecognition.onerror = (event) => {
    console.warn("Speech error:", event.error);
    stopVoiceDictation();
  };

  STATE.speechRecognition.onend = () => {
    stopVoiceDictation();
  };
}

function toggleVoiceDictation() {
  if (!STATE.speechRecognition) return;
  if (STATE.isListening) {
    STATE.speechRecognition.stop();
    stopVoiceDictation();
  } else {
    try {
      STATE.speechRecognition.start();
    } catch (e) {
      console.error(e);
    }
  }
}

function stopVoiceDictation() {
  STATE.isListening = false;
  DOM.btnVoiceInput.classList.remove("listening");
  DOM.micIcon.className = "fa-solid fa-microphone";
}

// ---------------- CHAT LOGIC ----------------
async function handleSendMessage() {
  const query = DOM.chatTextarea.value.trim();
  if (!query || STATE.isGenerating) return;

  // Check if API key is present either locally or on server
  if (!STATE.hasServerKey && !STATE.apiKey) {
    openSettingsModal();
    showSettingsFeedback("Please provide your OpenAI API Key to begin consultation.", "error");
    return;
  }

  // Pre-client emergency scan for immediate visual feedback
  checkForLocalEmergency(query);

  // Append user message
  appendMessage("user", query);
  STATE.history.push({ role: "user", content: query });

  // Reset textarea
  DOM.chatTextarea.value = "";
  DOM.chatTextarea.style.height = "auto";
  DOM.welcomeContainer.classList.add("hidden");

  // Show typing indicator
  STATE.isGenerating = true;
  DOM.btnSend.disabled = true;
  DOM.typingIndicator.classList.remove("hidden");
  scrollToBottom();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-openai-key": STATE.apiKey || "",
        "x-openai-base-url": STATE.baseUrl || ""
      },
      body: JSON.stringify({
        messages: STATE.history,
        model: STATE.model,
        apiKey: STATE.apiKey,
        baseUrl: STATE.baseUrl
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server responded with status ${res.status}`);
    }

    const data = await res.json();

    // Check emergency flag from server
    if (data.emergency_alert) {
      triggerEmergencyBanner(data.emergency_alert);
    }

    // Append bot response
    appendMessage("bot", data.reply, data.recommended_specialists);
    STATE.history.push({ role: "assistant", content: data.reply });

  } catch (error) {
    appendMessage(
      "bot",
      `⚠️ **Consultation Notice:** Unable to reach clinical engine.\n\n*${error.message}*\n\nPlease check your OpenAI API key in Settings or ensure your network connection is active.`
    );
  } finally {
    STATE.isGenerating = false;
    DOM.btnSend.disabled = false;
    DOM.typingIndicator.classList.add("hidden");
    scrollToBottom();
  }
}

function checkForLocalEmergency(text) {
  const emergencyRegex = /\b(chest\s+pain|difficulty\s+breathing|can'?t\s+breathe|slurred\s+speech|unconscious|coughing\s+blood|suicide)\b/i;
  if (emergencyRegex.test(text)) {
    triggerEmergencyBanner({
      title: "URGENT CLINICAL WARNING DETECTED",
      message: "Your input contains critical emergency keywords. Do not rely on chat. Call 911 or visit the nearest emergency facility immediately."
    });
  }
}

function triggerEmergencyBanner(alert) {
  DOM.emergencyTitle.textContent = alert.title || "URGENT MEDICAL ALERT";
  DOM.emergencyDesc.textContent = alert.message || "High-urgency symptoms detected. Seek emergency assistance immediately.";
  DOM.emergencyBanner.classList.remove("hidden");
}

function appendMessage(role, content, recommendedSpecialists = []) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML = role === "bot"
    ? `<i class="fa-solid fa-notes-medical"></i>`
    : `<i class="fa-solid fa-user"></i>`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // Parse Markdown using marked.js
  const parsedHtml = (typeof marked !== "undefined" && marked.parse)
    ? marked.parse(content)
    : content.replace(/\n/g, "<br>");
  
  bubble.innerHTML = parsedHtml;

  // If bot response has recommended specialists, render interactive card
  if (role === "bot" && recommendedSpecialists && recommendedSpecialists.length > 0) {
    const specBlock = document.createElement("div");
    specBlock.className = "recommended-specialist-block";
    specBlock.innerHTML = `
      <div class="recommended-specialist-title">
        <i class="fa-solid fa-stethoscope"></i> Recommended Medical Department
      </div>
    `;

    recommendedSpecialists.forEach((spec) => {
      const card = document.createElement("div");
      card.className = "specialist-card-compact";
      const doc = spec.doctors && spec.doctors[0] ? spec.doctors[0] : null;
      card.innerHTML = `
        <div class="specialist-compact-info">
          <strong>${spec.specialty}</strong>
          <small>${doc ? doc.name + ' (' + doc.experience + ' exp)' : spec.description}</small>
        </div>
        <button class="btn-book-instant" data-spec-id="${spec.id}">
          <i class="fa-regular fa-calendar-check"></i> Book Now
        </button>
      `;

      card.querySelector(".btn-book-instant").addEventListener("click", () => {
        openBookingForSpecialist(spec, doc);
      });

      specBlock.appendChild(card);
    });

    bubble.appendChild(specBlock);
  }

  // Action buttons for bot message (TTS Read Aloud, Copy)
  if (role === "bot") {
    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.innerHTML = `
      <button class="btn-msg-action btn-tts" title="Read aloud">
        <i class="fa-solid fa-volume-high"></i> Listen
      </button>
      <button class="btn-msg-action btn-copy" title="Copy response">
        <i class="fa-regular fa-copy"></i> Copy
      </button>
    `;

    // TTS handler
    actions.querySelector(".btn-tts").addEventListener("click", (e) => {
      speakText(content, e.currentTarget);
    });

    // Copy handler
    actions.querySelector(".btn-copy").addEventListener("click", (e) => {
      navigator.clipboard.writeText(content).then(() => {
        e.currentTarget.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
        setTimeout(() => {
          e.currentTarget.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
        }, 2000);
      });
    });

    bubble.appendChild(actions);
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  DOM.chatMessages.appendChild(row);
  scrollToBottom();
}

// Text-to-Speech audio reader
function speakText(text, btnElement) {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech is not supported in this browser.");
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (btnElement) btnElement.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
    return;
  }

  // Strip markdown tags for speech
  const cleanText = text.replace(/[*_#`~\[\]]/g, "");
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (btnElement) btnElement.innerHTML = `<i class="fa-solid fa-stop"></i> Stop`;

  utterance.onend = () => {
    if (btnElement) btnElement.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
  };

  utterance.onerror = () => {
    if (btnElement) btnElement.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
  };

  window.speechSynthesis.speak(utterance);
}

function scrollToBottom() {
  DOM.chatViewport.scrollTo({
    top: DOM.chatViewport.scrollHeight,
    behavior: "smooth"
  });
}

function resetConversation() {
  STATE.history = [];
  DOM.chatMessages.innerHTML = "";
  DOM.welcomeContainer.classList.remove("hidden");
  DOM.emergencyBanner.classList.add("hidden");
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ---------------- EXPORT CONSULTATION ----------------
function exportChatSummary() {
  if (STATE.history.length === 0) {
    alert("No consultation history to export yet.");
    return;
  }

  const now = new Date().toLocaleString();
  let exportText = `# AuraCare AI — Medical Consultation Summary\n`;
  exportText += `Date: ${now}\n`;
  exportText += `Notice: This summary is generated for personal reference and clinical discussion with your healthcare provider. It does not replace an official physician medical chart.\n\n`;
  exportText += `--------------------------------------------------\n\n`;

  STATE.history.forEach((msg) => {
    const sender = msg.role === "user" ? "PATIENT" : "AURACARE (AI CLINICAL ASSISTANT)";
    exportText += `### [${sender}]\n${msg.content}\n\n`;
  });

  const blob = new Blob([exportText], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AuraCare_Consultation_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------- SETTINGS MODAL ----------------
function openSettingsModal() {
  DOM.inputApiKey.value = STATE.apiKey;
  DOM.inputBaseUrl.value = STATE.baseUrl;
  DOM.selectModel.value = STATE.model;
  DOM.settingsFeedback.className = "feedback-msg hidden";
  DOM.settingsModal.classList.remove("hidden");
}

function togglePasswordVisibility() {
  const isPw = DOM.inputApiKey.type === "password";
  DOM.inputApiKey.type = isPw ? "text" : "password";
  DOM.pwEyeIcon.className = isPw ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
}

function saveSettings() {
  const key = DOM.inputApiKey.value.trim();
  const baseUrl = DOM.inputBaseUrl.value.trim() || "https://api.openai.com/v1";
  const model = DOM.selectModel.value;

  STATE.apiKey = key;
  STATE.baseUrl = baseUrl;
  STATE.model = model;

  localStorage.setItem("auracare_openai_key", key);
  localStorage.setItem("auracare_base_url", baseUrl);
  localStorage.setItem("auracare_model", model);

  updateApiKeyIndicator();
  showSettingsFeedback("Settings saved successfully!", "success");

  setTimeout(() => {
    DOM.settingsModal.classList.add("hidden");
  }, 1000);
}

function showSettingsFeedback(msg, type = "success") {
  DOM.settingsFeedback.textContent = msg;
  DOM.settingsFeedback.className = `feedback-msg ${type}`;
}

// ---------------- SPECIALIST & BOOKING MODAL ----------------
async function openSpecialistModal() {
  showSpecialistBrowseView();
  DOM.specialistModal.classList.remove("hidden");
  DOM.specialistGrid.innerHTML = `<div style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading medical directory...</div>`;

  try {
    const res = await fetch("/api/specialists");
    const data = await res.json();
    renderSpecialistGrid(data.specialists);
  } catch (err) {
    DOM.specialistGrid.innerHTML = `<p style="color:var(--emergency-red)">Failed to load directory. Please try again.</p>`;
  }
}

function showSpecialistBrowseView() {
  DOM.specialistBrowseView.classList.remove("hidden");
  DOM.specialistFormView.classList.add("hidden");
  DOM.specialistSuccessView.classList.add("hidden");
}

function renderSpecialistGrid(specialists) {
  DOM.specialistGrid.innerHTML = "";
  specialists.forEach((spec) => {
    const card = document.createElement("div");
    card.className = "specialist-card";
    
    let doctorsHtml = "";
    spec.doctors.forEach((doc) => {
      doctorsHtml += `
        <div class="doctor-item">
          <div class="doc-info">
            <strong>${doc.name}</strong>
            <span>${doc.experience} • ★ ${doc.rating}</span>
          </div>
          <button class="btn-select-doc" data-doc-id="${doc.id}">Select</button>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="spec-header">
        <div class="spec-icon"><i class="fa-solid fa-user-doctor"></i></div>
        <div class="spec-title">${spec.specialty}</div>
      </div>
      <p class="spec-desc">${spec.description}</p>
      <div class="doctor-list">${doctorsHtml}</div>
    `;

    // Hook buttons
    card.querySelectorAll(".btn-select-doc").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        openBookingForSpecialist(spec, spec.doctors[idx]);
      });
    });

    DOM.specialistGrid.appendChild(card);
  });
}

function openBookingForSpecialist(spec, doc) {
  STATE.selectedSpecialty = spec;
  STATE.selectedDoctor = doc;

  DOM.specialistBrowseView.classList.add("hidden");
  DOM.specialistSuccessView.classList.add("hidden");
  DOM.specialistFormView.classList.remove("hidden");
  DOM.specialistModal.classList.remove("hidden");

  DOM.selectedDocCard.innerHTML = `
    <strong>${doc.name}</strong>
    <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">
      ${spec.specialty} • ${doc.experience} Experience • Rating: ★ ${doc.rating}
    </p>
  `;

  // Populate time slots
  DOM.appointmentSlotSelect.innerHTML = "";
  doc.slots.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = slot;
    DOM.appointmentSlotSelect.appendChild(opt);
  });
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const name = DOM.patientNameInput.value.trim();
  const slot = DOM.appointmentSlotSelect.value;
  const notes = DOM.patientNotesInput.value.trim();

  if (!name || !slot || !STATE.selectedDoctor) return;

  try {
    const res = await fetch("/api/book-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_name: name,
        doctor_id: STATE.selectedDoctor.id,
        doctor_name: STATE.selectedDoctor.name,
        specialty: STATE.selectedSpecialty.specialty,
        slot: slot,
        notes: notes
      })
    });

    if (!res.ok) throw new Error("Booking failed");
    const data = await res.json();
    const b = data.booking;

    DOM.specialistFormView.classList.add("hidden");
    DOM.specialistSuccessView.classList.remove("hidden");

    DOM.bookingReceipt.innerHTML = `
      <div><strong>Appointment ID:</strong> ${b.booking_id}</div>
      <div><strong>Patient:</strong> ${b.patient_name}</div>
      <div><strong>Physician:</strong> ${b.doctor_name} (${b.specialty})</div>
      <div><strong>Scheduled Slot:</strong> ${b.slot}</div>
      <div><strong>Status:</strong> <span style="color:var(--success-green);font-weight:700;">Confirmed</span></div>
    `;

    fetchBookingsCount();
  } catch (err) {
    alert("Could not complete booking: " + err.message);
  }
}

// ---------------- APPOINTMENTS LIST MODAL ----------------
async function openAppointmentsModal() {
  DOM.myAppointmentsModal.classList.remove("hidden");
  DOM.appointmentsListContainer.innerHTML = `<div style="text-align:center;padding:16px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading appointments...</div>`;

  try {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    const list = data.bookings || [];

    if (list.length === 0) {
      DOM.appointmentsListContainer.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--text-muted)">
          <i class="fa-regular fa-calendar-xmark" style="font-size:2rem;margin-bottom:8px;"></i>
          <p>No appointments booked yet.</p>
        </div>
      `;
      return;
    }

    DOM.appointmentsListContainer.innerHTML = "";
    list.forEach((b) => {
      const item = document.createElement("div");
      item.className = "appointment-item";
      item.innerHTML = `
        <div class="appointment-item-header">
          <span class="appointment-id">${b.booking_id}</span>
          <span class="appointment-status">${b.status}</span>
        </div>
        <strong>${b.doctor_name}</strong>
        <p style="font-size:0.8rem;color:var(--text-secondary);">${b.specialty}</p>
        <div style="font-size:0.8rem;margin-top:6px;color:var(--accent-teal);">
          <i class="fa-regular fa-clock"></i> ${b.slot}
        </div>
      `;
      DOM.appointmentsListContainer.appendChild(item);
    });
  } catch (err) {
    DOM.appointmentsListContainer.innerHTML = `<p style="color:var(--emergency-red)">Failed to load bookings.</p>`;
  }
}

async function fetchBookingsCount() {
  try {
    const res = await fetch("/api/bookings");
    if (res.ok) {
      const data = await res.json();
      DOM.bookingCountBadge.textContent = data.bookings ? data.bookings.length : 0;
    }
  } catch (e) {}
}

// ---------------- THEME TOGGLING ----------------
function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  DOM.themeIcon.className = isLight ? "fa-solid fa-moon" : "fa-solid fa-sun";
  localStorage.setItem("auracare_theme", isLight ? "light" : "dark");
}

function loadThemePreference() {
  const saved = localStorage.getItem("auracare_theme");
  if (saved === "light") {
    document.body.classList.add("light-theme");
    DOM.themeIcon.className = "fa-solid fa-moon";
  } else {
    document.body.classList.remove("light-theme");
    DOM.themeIcon.className = "fa-solid fa-sun";
  }
}
