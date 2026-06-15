"""
generate_phase2_pdf.py
Generates Phase 2 presentation as a PDF with dark green theme matching Phase 1.
Each page = one slide in landscape 16:9 format.
"""
import os
from fpdf import FPDF

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BG_PATH = os.path.join(BASE_DIR, "Assets", "bg.jpg")
HEADER_PATH = os.path.join(BASE_DIR, "PPT", "extracted_logos", "full_header.png")
OUTPUT_PATH = os.path.join(BASE_DIR, "PPT", "Phase 2 ppt.pdf")

# Page dimensions (landscape 16:9 in mm)
PW = 338.67  # ~13.333 inches
PH = 190.5   # ~7.5 inches


class SlidePDF(FPDF):
    def __init__(self):
        super().__init__(orientation='L', unit='mm', format=(PH, PW))
        self.set_auto_page_break(auto=False)

    def new_slide(self):
        """Add a new slide page with background image."""
        self.add_page()
        self.image(BG_PATH, x=0, y=0, w=PW, h=PH)

    def slide_text(self, x, y, w, text, size=14, color=(255,255,255),
                   bold=False, font='Helvetica', align='L'):
        """Draw text at position. Uses multi_cell for wrapping."""
        self.set_xy(x, y)
        style = 'B' if bold else ''
        self.set_font(font, style, size)
        self.set_text_color(*color)
        self.multi_cell(w, size * 0.55, text, align=align)

    def draw_card(self, x, y, w, h):
        """Draw a semi-transparent card rectangle."""
        self.set_fill_color(35, 50, 35)
        self.set_draw_color(60, 80, 60)
        self.rect(x, y, w, h, style='DF')

    def draw_label(self, x, y, w, text):
        """Small label/chip."""
        self.set_fill_color(70, 55, 55)
        self.set_draw_color(70, 55, 55)
        self.rect(x, y, w, 8, style='DF')
        self.set_xy(x, y + 1)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(200, 200, 200)
        self.cell(w, 6, text, align='C')


# ─── Color constants ───
WHITE = (255, 255, 255)
GRAY = (200, 200, 200)
LGRAY = (170, 170, 170)
ACCENT = (0, 218, 170)
RED = (239, 68, 68)
BLUE = (59, 130, 246)
GREEN = (34, 197, 94)


def slide_cover(pdf):
    """Slide 1: Cover slide matching Phase 1."""
    pdf.new_slide()
    # Header strip with logos
    pdf.image(HEADER_PATH, x=0, y=0, w=PW, h=24)
    # Cover Slide label
    pdf.draw_label(145, 30, 40, "Cover Slide")
    # Title
    pdf.slide_text(30, 42, 280, "Predicting Patient Health Risk\nThrough Proactive Monitoring",
                   size=32, bold=True, align='C')
    # Subtitle
    pdf.slide_text(50, 82, 240, "An Early Warning Approach to Prevent Patient Deterioration",
                   size=12, color=GRAY, font='Courier', align='C')
    # Team info
    info = [
        ("College:", "Pandit Deendayal Energy University"),
        ("Team Name:", "Tech Titans"),
        ("Team Members:", "Amyel Christian, Malhar Gajjar, Darsh Patel"),
        ("Event:", "India Tech Summit - Innovate 2026"),
        ("Phase:", "Ideathon - Phase 2"),
        ("Team ID:", "8HmuRy2kMbeU8JQJhy0E"),
        ("Problem Statement ID:", "Xfair1003"),
    ]
    y = 108
    for label, value in info:
        pdf.set_xy(12, y)
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*WHITE)
        pdf.cell(pdf.get_string_width(label) + 2, 7, label)
        pdf.set_font('Helvetica', '', 11)
        pdf.set_text_color(*GRAY)
        pdf.cell(150, 7, " " + value)
        y += 9


def slide_section(pdf, title, subtitle):
    """Section title slide."""
    pdf.new_slide()
    pdf.slide_text(20, 50, 300, title, size=38, bold=True, align='C')
    pdf.slide_text(40, 100, 260, subtitle, size=14, color=GRAY, align='C')


def slide_problem(pdf):
    """Slide 3: Problem Overview."""
    pdf.new_slide()
    pdf.slide_text(12, 10, 160, "PROBLEM OVERVIEW", size=28, bold=True)
    pdf.slide_text(12, 32, 160,
        "Despite the availability of rich patient data, current "
        "healthcare systems lack intelligent, real-time analytics "
        "to predict patient deterioration.\n\n"
        "The absence of early warning mechanisms limits proactive care "
        "and reduces the ability to intervene before conditions become "
        "life-threatening.",
        size=12, color=GRAY)

    cards = ["Unutilized\nPatient Data", "Proactive Risk\nAssessment Opportunity",
             "Reactive Healthcare\nApproach"]
    for i, txt in enumerate(cards):
        y = 15 + i * 50
        pdf.draw_card(200, y, 120, 40)
        pdf.slide_text(210, y + 8, 100, txt, size=14, bold=True, align='C')

    pdf.slide_text(12, 145, 180,
        "Healthcare lacks intelligent systems that convert existing patient "
        "data into timely, actionable insights, resulting in delayed "
        "interventions and preventable critical events.",
        size=10, color=GRAY, bold=True)


def slide_solution(pdf):
    """Slide 4: Solution Overview."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Our Solution: CORTEX v3.0", size=28, bold=True)
    pdf.slide_text(12, 24, 300,
        "AI-Powered Clinical Risk Assessment System - Fully Deployed & Live",
        size=12, color=ACCENT)

    features = [
        ("ML Risk Prediction",
         "XGBoost model trained on 1.41M+ MIMIC-IV patient records "
         "with 99.98% accuracy. Real-time risk scoring: Low / Medium / High."),
        ("AI Health Companion",
         "LLM-powered health chat using Llama 3.3 70B via OpenRouter API. "
         "Context-aware conversations with assessment data."),
        ("Document Intelligence",
         "Upload and analyze clinical documents (lab reports, imaging, "
         "prescriptions). AI-powered OCR and summarization."),
        ("Safety Override System",
         "Rule-based critical threshold detection. SpO2 < 90%, HR > 150, "
         "BP > 180/110 triggers immediate high-risk alerts."),
    ]
    positions = [(12, 40), (172, 40), (12, 108), (172, 108)]
    for (title, desc), (x, y) in zip(features, positions):
        pdf.draw_card(x, y, 148, 58)
        pdf.slide_text(x + 6, y + 5, 136, title, size=14, bold=True)
        pdf.slide_text(x + 6, y + 18, 136, desc, size=10, color=GRAY)


def slide_tech_stack(pdf):
    """Slide 5: Tech Stack."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Technology Stack", size=28, bold=True)
    pdf.slide_text(12, 24, 300,
        "Production-grade technologies powering CORTEX", size=12, color=GRAY)

    categories = [
        ("Frontend", [
            "React 19.2.0", "Vite 7.3.1", "Tailwind CSS 4.2",
            "React Router 7.13", "Lucide React"
        ]),
        ("Backend", [
            "FastAPI", "Uvicorn (ASGI)", "Python 3.11",
            "Docker", "Google Cloud Run"
        ]),
        ("AI / ML", [
            "XGBoost", "scikit-learn", "MIMIC-IV Data",
            "OpenRouter API", "Llama 3.3 70B"
        ]),
        ("Infrastructure", [
            "Firebase Auth", "Cloud Firestore", "Vercel Hosting",
            "Google Cloud Run", "Security Rules"
        ]),
    ]

    for i, (cat, items) in enumerate(categories):
        x = 12 + i * 80
        pdf.draw_card(x, 38, 72, 140)
        pdf.slide_text(x + 4, 42, 64, cat, size=14, bold=True, color=ACCENT, align='C')
        for j, item in enumerate(items):
            pdf.slide_text(x + 6, 58 + j * 18, 60, "- " + item, size=10, color=GRAY)


def slide_architecture(pdf):
    """Slide 6: System Architecture."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "System Architecture", size=28, bold=True)
    pdf.slide_text(12, 24, 200, "TECHNICAL ARCHITECTURE", size=9, color=GRAY, font='Courier')

    layers = [
        ("User Interface Layer", "React 19 SPA\nDark glass-morphism\n6 dashboard tabs\nResponsive design"),
        ("API Gateway", "FastAPI on Cloud Run\nRESTful endpoints\nCORS middleware\nFile handling"),
        ("Intelligence Layer", "CortexUnifiedAgent\nML / LLM / DB routing\nSafety overrides\nContext management"),
    ]
    for i, (title, desc) in enumerate(layers):
        x = 12 + i * 108
        pdf.draw_card(x, 36, 98, 55)
        pdf.slide_text(x + 5, 38, 88, title, size=13, bold=True)
        pdf.slide_text(x + 5, 50, 88, desc, size=10, color=GRAY)

    # Arrows
    for x in [105, 215]:
        pdf.slide_text(x, 55, 15, "->", size=18, bold=True, color=ACCENT, align='C')

    bottom = [
        ("ML Engine", "XGBoost model\n44 engineered features\nRisk classification\nFeature importance"),
        ("LLM Service", "Llama 3.3 70B\nHealth chat responses\nAssessment explanations\nDocument analysis"),
        ("Data Layer", "Cloud Firestore\nFirebase Auth\nPer-user collections\nReal-time sync"),
    ]
    for i, (title, desc) in enumerate(bottom):
        x = 12 + i * 108
        pdf.draw_card(x, 100, 98, 55)
        pdf.slide_text(x + 5, 102, 88, title, size=13, bold=True)
        pdf.slide_text(x + 5, 114, 88, desc, size=10, color=GRAY)


def slide_ml_model(pdf):
    """Slide 7: ML Model Details."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "ML Model: Clinical Risk Prediction", size=28, bold=True)

    # Left card - stats
    pdf.draw_card(12, 30, 150, 150)
    stats = [
        ("Algorithm:", "XGBoost (Gradient Boosted Trees)"),
        ("Training Data:", "MIMIC-IV Clinical Database"),
        ("Training Samples:", "1,410,937 patient records"),
        ("Features:", "44 engineered clinical features"),
        ("Accuracy:", "99.98%"),
        ("High-Risk Recall:", "100% (never misses critical patients)"),
        ("Inference Time:", "< 100ms per prediction"),
        ("Risk Categories:", "Low / Medium / High"),
        ("Threshold:", "0.15 (optimized for sensitivity)"),
        ("Safety Overrides:", "Rule-based critical thresholds"),
    ]
    for i, (label, value) in enumerate(stats):
        y = 36 + i * 13
        pdf.set_xy(18, y)
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_text_color(*ACCENT)
        pdf.cell(pdf.get_string_width(label) + 2, 6, label)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(*GRAY)
        pdf.cell(100, 6, " " + value)

    # Right card - vitals
    pdf.draw_card(172, 30, 150, 150)
    pdf.slide_text(178, 34, 138, "Core Vital Signs Monitored", size=14, bold=True, color=ACCENT)
    vitals = [
        "Heart Rate (HR) - bpm",
        "Systolic Blood Pressure (SBP) - mmHg",
        "Diastolic Blood Pressure (DBP) - mmHg",
        "Oxygen Saturation (SpO2) - %",
        "Respiratory Rate (RR) - breaths/min",
        "Body Temperature - Fahrenheit",
    ]
    for i, v in enumerate(vitals):
        pdf.slide_text(182, 50 + i * 12, 130, "- " + v, size=10, color=GRAY)

    pdf.slide_text(178, 125, 138, "Derived Features", size=14, bold=True, color=ACCENT)
    derived = [
        "Mean Arterial Pressure (MAP)",
        "Shock Index (HR / SBP)",
        "Pulse Pressure (SBP - DBP)",
        "Rolling averages & rate of change",
    ]
    for i, d in enumerate(derived):
        pdf.slide_text(182, 140 + i * 10, 130, "- " + d, size=10, color=GRAY)


def slide_safety(pdf):
    """Slide 8: Safety Override System."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Safety Override System", size=28, bold=True)
    pdf.slide_text(12, 24, 320,
        "Critical threshold detection that overrides ML predictions to ensure patient safety",
        size=12, color=GRAY)

    overrides = [
        ("SpO2 < 90%", "Critical Oxygen Drop", "Immediate high-risk alert triggered"),
        ("HR > 150 / < 40", "Critical Heart Rate", "Dangerous tachy/bradycardia"),
        ("SBP > 180 / DBP > 110", "Hypertensive Crisis", "Emergency BP levels"),
        ("SBP < 90 / DBP < 60", "Hypotensive Crisis", "Dangerously low BP"),
        ("Temp > 103F / < 95F", "Critical Temperature", "Hyper/hypothermia risk"),
    ]

    for i, (threshold, title, desc) in enumerate(overrides):
        x = 10 + i * 65
        pdf.draw_card(x, 42, 58, 120)
        pdf.slide_text(x + 4, 48, 50, threshold, size=11, bold=True, color=RED, align='C')
        pdf.slide_text(x + 4, 72, 50, title, size=12, bold=True, align='C')
        pdf.slide_text(x + 4, 100, 50, desc, size=10, color=GRAY, align='C')


def slide_dashboard(pdf):
    """Slide 9: Dashboard Features."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Dashboard Features", size=28, bold=True)
    pdf.slide_text(12, 24, 300,
        "6 comprehensive tabs for complete health management", size=12, color=GRAY)

    tabs = [
        ("Home Tab", "Patient overview with Cortex AI score, health summary, "
         "care timeline, and quick actions."),
        ("Health Chat", "AI-powered health assistant using Llama 3.3 70B. "
         "Context-aware conversations."),
        ("Assessment", "Real-time vital sign input with instant ML risk "
         "predictions and explanations."),
        ("Documents", "Upload & analyze clinical documents. AI-powered OCR "
         "and summarization."),
        ("Database", "Assessment history with biometric logs. Track trends "
         "over time with timestamps."),
        ("Analytics", "Brain mapping, risk gauges, vitals grid, and clinical "
         "action plans."),
    ]
    for i, (title, desc) in enumerate(tabs):
        col = i % 3
        row = i // 3
        x = 12 + col * 108
        y = 38 + row * 72
        pdf.draw_card(x, y, 98, 62)
        pdf.slide_text(x + 5, y + 5, 88, title, size=14, bold=True, color=ACCENT)
        pdf.slide_text(x + 5, y + 20, 88, desc, size=10, color=GRAY)


def slide_auth(pdf):
    """Slide 10: Auth & Security."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Authentication & Security", size=28, bold=True)

    # Left card
    pdf.draw_card(12, 32, 150, 148)
    pdf.slide_text(18, 36, 138, "Firebase Authentication", size=16, bold=True, color=ACCENT)
    auth_items = [
        "Email/password sign-up and login",
        "Dedicated login & signup pages",
        "Password reset functionality",
        "Protected dashboard routes",
        "AuthContext with React Context API",
        "LocalStorage caching for instant auth restore",
        "Session persistence across page reloads",
    ]
    for i, item in enumerate(auth_items):
        pdf.slide_text(22, 54 + i * 16, 134, "- " + item, size=10, color=GRAY)

    # Right card
    pdf.draw_card(172, 32, 150, 148)
    pdf.slide_text(178, 36, 138, "Cloud Firestore Security", size=16, bold=True, color=ACCENT)
    sec_items = [
        "Per-user document isolation (users/{userId})",
        "Firestore security rules enforce ownership",
        "Read/write restricted to authenticated owner",
        "OTP verifications locked to Cloud Functions",
        "CORS middleware on FastAPI backend",
        "Environment variable secrets management",
        "HTTPS-only API communication",
    ]
    for i, item in enumerate(sec_items):
        pdf.slide_text(182, 54 + i * 16, 134, "- " + item, size=10, color=GRAY)


def slide_api(pdf):
    """Slide 11: API Architecture."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "API Architecture", size=28, bold=True)
    pdf.slide_text(12, 24, 300,
        "RESTful API built with FastAPI, deployed on Google Cloud Run",
        size=12, color=GRAY)

    pdf.draw_card(12, 38, 310, 140)

    # Table header
    pdf.set_xy(20, 44)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*ACCENT)
    pdf.cell(35, 8, "Method")
    pdf.cell(80, 8, "Endpoint")
    pdf.cell(180, 8, "Description")

    endpoints = [
        ("POST", "/chat", "Conversational health queries with context"),
        ("POST", "/assessment", "ML risk prediction from vital signs"),
        ("POST", "/upload-document", "Clinical document analysis via AI"),
        ("GET", "/documents/{uid}", "Retrieve user's document records"),
        ("GET", "/dashboard/{uid}", "Full dashboard data aggregation"),
        ("POST", "/reminder", "Create health/medication reminders"),
        ("GET", "/history/{uid}", "Conversation history retrieval"),
    ]

    for i, (method, endpoint, desc) in enumerate(endpoints):
        y = 58 + i * 15
        # Separator line
        pdf.set_draw_color(60, 80, 60)
        pdf.line(20, y - 2, 312, y - 2)

        color = GREEN if method == "GET" else BLUE
        pdf.set_xy(20, y)
        pdf.set_font('Courier', 'B', 11)
        pdf.set_text_color(*color)
        pdf.cell(35, 8, method)
        pdf.set_font('Courier', '', 11)
        pdf.set_text_color(*WHITE)
        pdf.cell(80, 8, endpoint)
        pdf.set_font('Helvetica', '', 11)
        pdf.set_text_color(*GRAY)
        pdf.cell(180, 8, desc)


def slide_deployment(pdf):
    """Slide 12: Deployment Architecture."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Deployment Architecture", size=28, bold=True)

    deployments = [
        ("Frontend - Vercel", [
            "React SPA built with Vite 7",
            "Deployed on Vercel platform",
            "SPA rewrites for /login, /signup",
            "Asset caching (immutable)",
            "Environment: .env.production",
            "Auto-deploy on git push",
        ]),
        ("Backend - Google Cloud Run", [
            "Docker container (Python 3.11)",
            "FastAPI with Uvicorn server",
            "Auto-scaling (0 to N instances)",
            "Port 8080 configuration",
            "Environment secrets via GCP",
            "Region: us-central1",
        ]),
        ("Database - Firebase", [
            "Cloud Firestore (NoSQL)",
            "Firebase Authentication",
            "Real-time data sync",
            "Security rules enforcement",
            "Per-user data isolation",
            "Automatic backups",
        ]),
    ]

    for i, (title, items) in enumerate(deployments):
        x = 12 + i * 108
        pdf.draw_card(x, 30, 98, 148)
        pdf.slide_text(x + 5, 34, 88, title, size=14, bold=True, color=ACCENT, align='C')
        for j, item in enumerate(items):
            pdf.slide_text(x + 8, 54 + j * 18, 82, "- " + item, size=10, color=GRAY)


def slide_pipeline(pdf):
    """Slide 13: Risk Assessment Pipeline."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Risk Assessment Pipeline", size=28, bold=True)
    pdf.slide_text(12, 24, 320,
        "End-to-end flow from vital sign input to clinical recommendation",
        size=12, color=GRAY)

    steps = [
        ("1. Vital Input", "User enters 6 core vitals via dashboard Assessment Tab"),
        ("2. Safety Check", "Critical threshold overrides checked before ML inference"),
        ("3. Feature Eng.", "6 vitals expanded to 44 clinical features (MAP, Shock Index...)"),
        ("4. ML Prediction", "XGBoost classifies risk as Low/Medium/High with confidence"),
        ("5. LLM Explain", "Llama 3.3 generates plain-language clinical explanation"),
        ("6. Persist & Show", "Results saved to Firestore and displayed on dashboard"),
    ]
    for i, (title, desc) in enumerate(steps):
        col = i % 3
        row = i // 3
        x = 12 + col * 108
        y = 38 + row * 72
        pdf.draw_card(x, y, 98, 62)
        pdf.slide_text(x + 5, y + 5, 88, title, size=14, bold=True, color=ACCENT)
        pdf.slide_text(x + 5, y + 22, 88, desc, size=10, color=GRAY)


def slide_performance(pdf):
    """Slide 14: Model Performance."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "Model Performance", size=28, bold=True)
    pdf.slide_text(12, 24, 300,
        "Production model evaluation results on held-out test data", size=12, color=GRAY)

    # Big metric cards
    metrics = [("99.98%", "Overall\nAccuracy"), ("100%", "High-Risk\nRecall"),
               ("< 100ms", "Inference\nLatency"), ("1.41M+", "Training\nSamples")]
    for i, (value, label) in enumerate(metrics):
        x = 12 + i * 80
        pdf.draw_card(x, 38, 72, 48)
        pdf.slide_text(x + 4, 40, 64, value, size=24, bold=True, color=ACCENT, align='C')
        pdf.slide_text(x + 4, 60, 64, label, size=11, color=GRAY, align='C')

    # Comparison table
    pdf.draw_card(12, 94, 310, 80)
    pdf.slide_text(18, 97, 150, "Model Comparison Results", size=14, bold=True, color=ACCENT)

    headers = ["Model", "Accuracy", "Precision", "Recall", "F1 Score"]
    col_x = [20, 90, 145, 200, 255]
    col_w = [65, 50, 50, 50, 50]

    # Header row
    pdf.set_draw_color(60, 80, 60)
    pdf.line(18, 114, 312, 114)
    for j, h in enumerate(headers):
        pdf.set_xy(col_x[j], 108)
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*ACCENT)
        pdf.cell(col_w[j], 6, h)

    rows = [
        ("XGBoost", "99.98%", "99.97%", "100%", "99.98%"),
        ("Random Forest", "99.95%", "99.93%", "99.96%", "99.94%"),
        ("Logistic Regression", "89.42%", "88.15%", "89.42%", "88.71%"),
    ]
    for i, row in enumerate(rows):
        y = 120 + i * 14
        if i < len(rows) - 1:
            pdf.line(18, y + 12, 312, y + 12)
        for j, cell in enumerate(row):
            pdf.set_xy(col_x[j], y)
            pdf.set_font('Courier' if j > 0 else 'Helvetica', '', 11)
            pdf.set_text_color(*WHITE if j == 0 else GRAY)
            pdf.cell(col_w[j], 6, cell)


def slide_ui_design(pdf):
    """Slide 15: UI/UX Design."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 300, "UI/UX Design", size=28, bold=True)
    pdf.slide_text(12, 24, 300,
        "Premium dark glass-morphism design with clinical precision",
        size=12, color=GRAY)

    elements = [
        ("Dark Glass Morphism",
         "Frosted glass cards with backdrop blur effects. "
         "Semi-transparent overlays create depth and hierarchy."),
        ("Ambient Mesh Backgrounds",
         "Dynamic gradient mesh backgrounds that adapt to risk levels. "
         "Green for low, amber for medium, red for high risk."),
        ("Clinical Color System",
         "Risk-aware color coding: Green (#22C55E) - Low Risk, "
         "Amber (#F59E0B) - Medium, Red (#EF4444) - High Risk."),
        ("Responsive Design",
         "Mobile-first approach with Tailwind CSS v4. "
         "Adapts seamlessly to desktop, tablet, and mobile views."),
    ]
    positions = [(12, 38), (172, 38), (12, 108), (172, 108)]
    for (title, desc), (x, y) in zip(elements, positions):
        pdf.draw_card(x, y, 148, 60)
        pdf.slide_text(x + 6, y + 5, 136, title, size=14, bold=True, color=ACCENT)
        pdf.slide_text(x + 6, y + 20, 136, desc, size=10, color=GRAY)


def slide_impact(pdf):
    """Slide 16: Impact & Use Cases."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 140, "Impact and\nUse Cases", size=28, bold=True)
    pdf.slide_text(12, 44, 140,
        "Real-world benefits of early patient risk prediction",
        size=11, color=GRAY)

    cards = [
        ("Reduced Critical Events",
         "Early risk detection prevents sudden deterioration, "
         "reducing ICU transfers, code-blue events, and "
         "emergency interventions."),
        ("Operational Impact",
         "Better prioritization of high-risk patients reduces "
         "length of stay, readmissions, and optimizes staff "
         "workload and resources."),
        ("Patient Impact",
         "Proactive monitoring improves patient outcomes, safety, "
         "and confidence through timely clinical attention."),
        ("Use Cases",
         "Applicable across wards, ICUs, emergency units, and "
         "post-operative care for continuous patient risk monitoring."),
    ]
    positions = [(165, 8), (252, 8), (165, 98), (252, 98)]
    for (title, desc), (x, y) in zip(cards, positions):
        pdf.draw_card(x, y, 80, 80)
        pdf.slide_text(x + 5, y + 5, 70, title, size=12, bold=True)
        pdf.slide_text(x + 5, y + 22, 70, desc, size=9, color=GRAY)


def slide_future(pdf):
    """Slide 17: Future Scope."""
    pdf.new_slide()
    pdf.slide_text(12, 8, 180, "Future Scope &\nScalability", size=28, bold=True)
    pdf.slide_text(190, 12, 140,
        "Strategic initiatives for expanding platform capabilities and patient care delivery",
        size=11, color=GRAY)

    items = [
        "Wearable Integration", "Predictive Population Health", "Clinical Validation",
        "Scalable Deployment", "Population Level Insights", "Remote Monitoring",
        "Scalable AI Platform", "Beyond Hospital Care", "Real World Validation",
    ]
    for i, item in enumerate(items):
        col = i % 3
        row = i // 3
        x = 12 + col * 108
        y = 55 + row * 42
        pdf.draw_card(x, y, 98, 32)
        pdf.slide_text(x + 5, y + 8, 88, item, size=13, align='C')


def slide_thank_you(pdf):
    """Slide 18: Thank You with live link."""
    pdf.new_slide()
    pdf.slide_text(12, 70, 300, "Thank You", size=52, bold=True)

    pdf.set_xy(12, 120)
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(*GRAY)
    pdf.cell(pdf.get_string_width("Team: ") + 1, 7, "Team: ")
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(*WHITE)
    pdf.cell(50, 7, "Tech Titans")

    pdf.slide_text(12, 130, 300, "Pandit Deendayal Energy University", size=13, color=GRAY)

    # Divider
    pdf.set_draw_color(100, 100, 100)
    pdf.line(12, 145, 326, 145)

    pdf.slide_text(12, 150, 300,
        "Thank you for your time and consideration.", size=11, color=GRAY)

    # Live link card
    pdf.draw_card(80, 160, 180, 18)
    pdf.slide_text(85, 163, 170,
        "Live Website:  https://cortex-health-app.vercel.app",
        size=13, bold=True, color=ACCENT, align='C')


def main():
    pdf = SlidePDF()
    slide_cover(pdf)         # 1
    slide_section(pdf,       # 2
        "Predicting Patient Health Risk\nThrough Proactive Monitoring",
        "Phase 2: Fully working website - deployed and live")
    slide_problem(pdf)       # 3
    slide_solution(pdf)      # 4
    slide_tech_stack(pdf)    # 5
    slide_architecture(pdf)  # 6
    slide_ml_model(pdf)      # 7
    slide_safety(pdf)        # 8
    slide_dashboard(pdf)     # 9
    slide_auth(pdf)          # 10
    slide_api(pdf)           # 11
    slide_deployment(pdf)    # 12
    slide_pipeline(pdf)      # 13
    slide_performance(pdf)   # 14
    slide_ui_design(pdf)     # 15
    slide_impact(pdf)        # 16
    slide_future(pdf)        # 17
    slide_thank_you(pdf)     # 18

    pdf.output(OUTPUT_PATH)
    print(f"Phase 2 PDF generated: {OUTPUT_PATH}")
    print(f"Total slides: 18")


if __name__ == "__main__":
    main()
