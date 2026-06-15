"""
Generate a comprehensive A-to-Z PDF document for the CORTEX v3.0 project.
"""
from fpdf import FPDF
import os

class CortexPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(130, 130, 130)
            self.cell(0, 8, 'CORTEX v3.0 - Comprehensive Project Documentation', align='C')
            self.ln(4)
            self.set_draw_color(0, 218, 170)
            self.set_line_width(0.5)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(130, 130, 130)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(17, 24, 39)
        self.set_fill_color(240, 253, 244)
        self.cell(0, 12, title, ln=True, fill=True)
        self.set_draw_color(0, 218, 170)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(31, 41, 55)
        self.cell(0, 10, title, ln=True)
        self.ln(2)

    def sub_section(self, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(55, 65, 81)
        self.cell(0, 8, title, ln=True)
        self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(55, 65, 81)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(55, 65, 81)
        self.set_x(10)
        self.multi_cell(0, 5.5, '  - ' + text)

    def code_block(self, text):
        self.set_font('Courier', '', 9)
        self.set_text_color(30, 30, 30)
        self.set_fill_color(245, 245, 245)
        for line in text.strip().split('\n'):
            self.cell(0, 5, '  ' + line, ln=True, fill=True)
        self.ln(3)

    def table_header(self, cols, widths):
        self.set_x(10)
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(17, 24, 39)
        self.set_text_color(255, 255, 255)
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, col, border=1, fill=True, align='C')
        self.ln()
        self.set_text_color(55, 65, 81)

    def table_row(self, cols, widths, fill=False):
        self.set_x(10)
        self.set_font('Helvetica', '', 9)
        self.set_text_color(55, 65, 81)
        if fill:
            self.set_fill_color(249, 250, 251)
        for i, col in enumerate(cols):
            self.cell(widths[i], 6.5, col, border=1, fill=fill, align='C')
        self.ln()

    def key_value(self, key, value):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(31, 41, 55)
        self.cell(55, 6, key + ':', ln=False)
        self.set_font('Helvetica', '', 10)
        self.set_text_color(55, 65, 81)
        self.cell(0, 6, str(value), ln=True)


def build_pdf():
    pdf = CortexPDF()
    pdf.alias_nb_pages()

    # ===================== COVER PAGE =====================
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font('Helvetica', 'B', 36)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 15, 'CORTEX v3.0', ln=True, align='C')
    pdf.ln(4)
    pdf.set_font('Helvetica', '', 16)
    pdf.set_text_color(0, 218, 170)
    pdf.cell(0, 10, 'Clinical Risk Assessment System', ln=True, align='C')
    pdf.ln(6)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 8, 'AI-Powered Clinical Deterioration Detection', ln=True, align='C')
    pdf.cell(0, 8, '& Patient Risk Monitoring Platform', ln=True, align='C')
    pdf.ln(12)

    pdf.set_draw_color(0, 218, 170)
    pdf.set_line_width(1)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.ln(12)

    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 7, 'Trained on MIMIC-IV Clinical Database (1.41M+ patients)', ln=True, align='C')
    pdf.cell(0, 7, 'Deployed on Google Cloud Platform', ln=True, align='C')
    pdf.ln(8)
    pdf.cell(0, 7, 'Model Accuracy: 99.98%  |  High-Risk Recall: 100%', ln=True, align='C')
    pdf.cell(0, 7, 'Inference Latency: < 1ms (P95)', ln=True, align='C')
    pdf.ln(30)

    pdf.set_font('Helvetica', 'I', 10)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 7, 'Comprehensive Project Documentation', ln=True, align='C')
    pdf.cell(0, 7, 'Version 3.0 | February 2026', ln=True, align='C')

    # ===================== TABLE OF CONTENTS =====================
    pdf.add_page()
    pdf.chapter_title('Table of Contents')
    pdf.ln(4)
    toc = [
        ('1.', 'Executive Summary'),
        ('2.', 'Problem Statement & Motivation'),
        ('3.', 'System Architecture'),
        ('4.', 'Technology Stack'),
        ('5.', 'Machine Learning Model'),
        ('   5.1', 'Training Data & Sources'),
        ('   5.2', 'Feature Engineering (44 Features)'),
        ('   5.3', 'Model Training & Selection'),
        ('   5.4', 'Performance Metrics'),
        ('   5.5', 'Safety Override System'),
        ('   5.6', 'Threshold Optimization'),
        ('   5.7', 'Clinical Test Cases'),
        ('6.', 'Backend Architecture (cortex-agent)'),
        ('   6.1', 'FastAPI Server & Endpoints'),
        ('   6.2', 'Cortex Unified Agent'),
        ('   6.3', 'ML Predictor Module'),
        ('   6.4', 'AI Chat Client (LLM Integration)'),
        ('   6.5', 'Firebase Database Layer'),
        ('7.', 'Frontend Architecture (React Dashboard)'),
        ('   7.1', 'Component Structure'),
        ('   7.2', 'Dashboard Tabs Overview'),
        ('   7.3', 'Authentication System'),
        ('   7.4', 'UI/UX Design'),
        ('8.', 'Security & Compliance'),
        ('9.', 'Deployment & Infrastructure'),
        ('10.', 'API Documentation'),
        ('11.', 'Project File Structure'),
        ('12.', 'Performance Benchmarks'),
        ('13.', 'Future Roadmap'),
    ]
    for num, title in toc:
        pdf.set_font('Helvetica', 'B' if not num.startswith(' ') else '', 11)
        pdf.set_text_color(31, 41, 55)
        pdf.cell(15, 7, num)
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, title, ln=True)

    # ===================== 1. EXECUTIVE SUMMARY =====================
    pdf.add_page()
    pdf.chapter_title('1. Executive Summary')
    pdf.body_text(
        'CORTEX v3.0 is a production-ready, AI-powered clinical risk assessment system designed to predict patient '
        'deterioration risk in real-time. It combines a high-accuracy machine learning model (XGBoost ensemble) with '
        'an intuitive React dashboard, enabling healthcare professionals and patients to monitor health status with '
        'clinical-grade accuracy.'
    )
    pdf.body_text(
        'The system is trained on the MIMIC-IV Clinical Database, comprising over 1.41 million cleaned patient records '
        'from ICU admissions. The ML model achieves 99.98% overall accuracy with 100% high-risk recall, meaning it '
        'has never missed a single critical patient in testing across 26,351 high-risk cases.'
    )
    pdf.body_text(
        'The platform features a full-stack architecture: a Python/FastAPI backend deployed on Google Cloud Run, '
        'a React 19 SPA frontend with Firebase Authentication and Firestore for real-time data, and an AI health '
        'companion powered by LLM integration (Llama 3.3 70B via OpenRouter) for conversational health guidance, '
        'document analysis, and assessment explanations.'
    )
    pdf.ln(2)
    pdf.sub_section('Key Highlights')
    highlights = [
        '99.98% Overall Accuracy with 100% High-Risk Recall (0 missed critical patients)',
        'Sub-millisecond inference (0.39ms P95) - 550,000+ predictions/second throughput',
        '44 engineered clinical features from 7 core vital signs',
        'Safety override system for critical thresholds (SpO2, HR, BP, Temp)',
        'Real-time React dashboard with 6 interactive tabs',
        'AI health companion with conversational chat, document OCR, and assessment explanations',
        'Firebase Auth + Firestore with user-scoped security rules',
        'Dockerized and deployed on Google Cloud Run (asia-south1)',
        'Trained on 1,410,937 real patient records (no synthetic data)',
    ]
    for h in highlights:
        pdf.bullet(h)

    # ===================== 2. PROBLEM STATEMENT =====================
    pdf.add_page()
    pdf.chapter_title('2. Problem Statement & Motivation')
    pdf.body_text(
        'Clinical deterioration in hospitalized patients is a leading cause of preventable deaths. Studies show that '
        'early warning signs are often present 6-24 hours before cardiac arrest or ICU transfer, but are frequently '
        'missed due to information overload, staffing shortages, and reliance on manual monitoring.'
    )
    pdf.body_text(
        'Traditional Early Warning Score (EWS) systems like NEWS and MEWS use simple threshold-based rules that '
        'fail to capture complex, non-linear interactions between vital signs. They suffer from high false alarm '
        'rates (leading to "alarm fatigue") and inadequate sensitivity for truly critical patients.'
    )
    pdf.body_text(
        'CORTEX addresses these challenges by applying advanced machine learning to vital sign analysis, providing:'
    )
    pdf.bullet('Automated risk stratification into Low / Medium / High categories')
    pdf.bullet('Explainable predictions with feature importance rankings')
    pdf.bullet('Safety override rules for critical thresholds that bypass the ML model')
    pdf.bullet('Natural language explanations of results for patient comprehension')
    pdf.bullet('Real-time monitoring through an accessible web dashboard')
    pdf.bullet('AI-powered conversational health guidance for patient empowerment')

    # ===================== 3. SYSTEM ARCHITECTURE =====================
    pdf.add_page()
    pdf.chapter_title('3. System Architecture')
    pdf.body_text(
        'CORTEX follows a modern three-tier architecture separating the frontend presentation layer, '
        'the backend API/ML inference layer, and the cloud data persistence layer.'
    )
    pdf.ln(2)
    pdf.sub_section('Architecture Overview')
    pdf.body_text(
        'The system consists of three main components that communicate via REST APIs over HTTPS:'
    )
    pdf.ln(2)
    pdf.sub_section('1. Frontend (React 19 SPA)')
    pdf.bullet('Built with React 19.2.0, Vite 7.3.1, and Tailwind CSS 4.2.0')
    pdf.bullet('Single Page Application with client-side routing (React Router 7.13)')
    pdf.bullet('Communicates with Firebase for auth/data and Cloud Run for ML predictions')
    pdf.bullet('Deployed on Firebase Hosting / Vercel')
    pdf.ln(2)
    pdf.sub_section('2. Backend (FastAPI on Cloud Run)')
    pdf.bullet('Python 3.11 FastAPI server containerized with Docker')
    pdf.bullet('Hosts the trained XGBoost ML model for risk predictions')
    pdf.bullet('Integrates LLM (Llama 3.3 70B via OpenRouter) for chat and explanations')
    pdf.bullet('Connects to Firebase Firestore for persistent data storage')
    pdf.bullet('Deployed on Google Cloud Run (asia-south1 / us-central1)')
    pdf.ln(2)
    pdf.sub_section('3. Data Layer (Firebase + GCP)')
    pdf.bullet('Firebase Authentication for user management (email/password + OTP)')
    pdf.bullet('Cloud Firestore (NoSQL) for user data, assessments, documents, reminders')
    pdf.bullet('Security rules enforce user-scoped access (users can only access their own data)')
    pdf.bullet('Google Cloud Storage for model artifact storage')

    pdf.ln(4)
    pdf.sub_section('Data Flow')
    pdf.body_text(
        '1. User logs in via Firebase Auth (email/password with OTP verification)\n'
        '2. Dashboard loads user profile and assessment history from Firestore\n'
        '3. User inputs vital signs on the Assessment tab\n'
        '4. Frontend sends vitals to the Cloud Run backend via POST /assessment\n'
        '5. Backend runs safety overrides, then ML inference (XGBoost), then LLM explanation\n'
        '6. Results are returned to frontend and saved to Firestore\n'
        '7. Dashboard updates in real-time with risk scores, analytics, and recommendations'
    )

    # ===================== 4. TECH STACK =====================
    pdf.add_page()
    pdf.chapter_title('4. Technology Stack')

    pdf.sub_section('Frontend Technologies')
    w = [50, 30, 110]
    pdf.table_header(['Technology', 'Version', 'Purpose'], w)
    frontend_stack = [
        ('React', '19.2.0', 'UI component library'),
        ('Vite', '7.3.1', 'Build tool & dev server'),
        ('React Router', '7.13.0', 'Client-side SPA routing'),
        ('Tailwind CSS', '4.2.0', 'Utility-first CSS framework'),
        ('Lucide React', '0.575.0', 'Icon library'),
        ('Firebase SDK', '12.9.0', 'Auth + Firestore client'),
        ('Axios', '1.13.6', 'HTTP client for API calls'),
        ('React Markdown', '10.1.0', 'Markdown rendering in chat'),
        ('EmailJS', '4.4.1', 'Email OTP delivery'),
    ]
    for i, (tech, ver, purpose) in enumerate(frontend_stack):
        pdf.table_row([tech, ver, purpose], w, fill=(i % 2 == 0))

    pdf.ln(6)
    pdf.sub_section('Backend Technologies')
    w = [50, 30, 110]
    pdf.table_header(['Technology', 'Version', 'Purpose'], w)
    backend_stack = [
        ('Python', '3.11', 'Runtime environment'),
        ('FastAPI', '0.134.0', 'Async web framework'),
        ('Uvicorn', '0.41.0', 'ASGI server'),
        ('scikit-learn', '1.8.0', 'ML library'),
        ('XGBoost', 'latest', 'Gradient boosting classifier'),
        ('NumPy', '2.4.2', 'Numerical computing'),
        ('Pandas', '3.0.1', 'Data manipulation'),
        ('Firebase Admin', '7.2.0', 'Server-side Firestore'),
        ('OpenAI SDK', '2.24.0', 'LLM client (OpenRouter)'),
        ('PyPDF2', '3.0.1', 'PDF document processing'),
        ('python-docx', '1.2.0', 'Word document processing'),
        ('Pillow', '12.1.1', 'Image processing'),
    ]
    for i, (tech, ver, purpose) in enumerate(backend_stack):
        pdf.table_row([tech, ver, purpose], w, fill=(i % 2 == 0))

    pdf.ln(6)
    pdf.sub_section('Infrastructure & DevOps')
    infra = [
        ('Cloud Provider', 'Google Cloud Platform (GCP)'),
        ('ML Hosting', 'Google Cloud Run (containerized serverless)'),
        ('Database', 'Cloud Firestore (NoSQL, real-time)'),
        ('Authentication', 'Firebase Authentication'),
        ('Frontend Hosting', 'Firebase Hosting / Vercel'),
        ('Container Registry', 'Google Container Registry (GCR)'),
        ('Region', 'asia-south1 (Mumbai) / us-central1'),
        ('Project ID', 'cortex-12feb'),
    ]
    for k, v in infra:
        pdf.key_value(k, v)

    # ===================== 5. ML MODEL =====================
    pdf.add_page()
    pdf.chapter_title('5. Machine Learning Model')

    pdf.section_title('5.1 Training Data & Sources')
    pdf.body_text(
        'The CORTEX model is trained exclusively on real patient data from multiple clinical databases. '
        'No synthetic data (SMOTE or oversampling) is used -- the model learns purely from real-world clinical observations.'
    )
    pdf.ln(2)
    w = [60, 45, 85]
    pdf.table_header(['Dataset', 'Records', 'Description'], w)
    pdf.table_row(['Sepsis Challenge', '1,552,210', 'PhysioNet Sepsis Challenge data'], w, True)
    pdf.table_row(['CHARTEVENTS (MIMIC)', '758,355', 'MIMIC-IV charted vitals'], w)
    pdf.table_row(['Stroke Data', '5,110', 'Stroke patient records'], w, True)
    pdf.table_row(['MIMIC-IV ED', '1,038', 'Emergency dept vitals'], w)
    pdf.ln(2)
    pdf.key_value('Total Raw Records', '1,568,014')
    pdf.key_value('After Cleaning', '1,410,937 (90.0% retention)')
    pdf.key_value('Training Set (80%)', '1,128,749 records')
    pdf.key_value('Test Set (20%)', '282,188 records')
    pdf.ln(2)
    pdf.sub_section('Class Distribution')
    w2 = [60, 45, 45, 40]
    pdf.table_header(['Risk Level', 'Count', 'Percentage', 'Weight'], w2)
    pdf.table_row(['Low Risk', '811,293', '57.5%', '1x'], w2, True)
    pdf.table_row(['Medium Risk', '467,887', '33.2%', '2x'], w2)
    pdf.table_row(['High Risk', '131,757', '9.3%', '8x'], w2, True)

    pdf.ln(2)
    pdf.body_text(
        'The labeling strategy in v3.0 was fixed to be based purely on observable vital signs, eliminating '
        'information leakage from outcome variables (sepsis labels, disposition codes) that existed in v2.0. '
        'This ensures the model can learn all high-risk patterns from features it actually has access to.'
    )

    # 5.2 Feature Engineering
    pdf.add_page()
    pdf.section_title('5.2 Feature Engineering (44 Features)')
    pdf.body_text(
        'CORTEX engineers 44 features from 7 core vital signs, demographics, and medical history. '
        'Features are organized into 12 categories:'
    )
    pdf.ln(2)

    feature_cats = [
        ('Basic Vitals (7)', 'hr, spo2, sbp, dbp, rr, temp, map'),
        ('Demographics (3)', 'age, gender, age_group'),
        ('Medical History (3)', 'diabetes, hypertension, heart_disease'),
        ('Derived Vitals (3)', 'pulse_pressure, shock_index, mews_score'),
        ('Abnormal Flags (6)', 'hr/spo2/bp/temp/rr_abnormal, total_abnormal_vitals'),
        ('Composite Scores (4)', 'vital_instability, cardio_risk, respiratory_risk, critical_score'),
        ('Interactions (4)', 'hr_spo2_ratio, symptom_count, pp_ratio, dbp_sbp_ratio'),
        ('Squared/Deficit (3)', 'hr_squared, spo2_deficit, spo2_deficit_sq'),
        ('Age Features (1)', 'age_risk'),
        ('Deviations (3)', 'hr_deviation, sbp_deviation, rr_deviation'),
        ('Critical Flags (5)', 'critical_spo2/hr/bp/rr/temp_flag'),
        ('Emergency (2)', 'multi_critical_flag, emergency_score'),
    ]
    w = [55, 135]
    pdf.table_header(['Category', 'Features'], w)
    for i, (cat, feats) in enumerate(feature_cats):
        pdf.table_row([cat, feats], w, fill=(i % 2 == 0))

    pdf.ln(4)
    pdf.sub_section('Top 10 Feature Importance')
    w = [10, 60, 50, 70]
    pdf.table_header(['#', 'Feature', 'Importance', 'Category'], w)
    top_features = [
        ('1', 'emergency_score', '33.46%', 'Emergency'),
        ('2', 'critical_rr_flag', '20.28%', 'Critical Flags'),
        ('3', 'critical_score', '14.29%', 'Composite Scores'),
        ('4', 'total_abnormal_vitals', '13.33%', 'Abnormal Flags'),
        ('5', 'hr_abnormal', '5.39%', 'Abnormal Flags'),
        ('6', 'sbp_deviation', '5.10%', 'Deviations'),
        ('7', 'critical_bp_flag', '1.95%', 'Critical Flags'),
        ('8', 'dbp', '1.52%', 'Basic Vitals'),
        ('9', 'temp_abnormal', '0.64%', 'Abnormal Flags'),
        ('10', 'mews_score', '0.58%', 'Derived Vitals'),
    ]
    for i, (n, f, imp, cat) in enumerate(top_features):
        pdf.table_row([n, f, imp, cat], w, fill=(i % 2 == 0))

    # 5.3 Model Training
    pdf.add_page()
    pdf.section_title('5.3 Model Training & Selection')
    pdf.body_text(
        'Multiple models were trained and compared. The selection criteria prioritized high-risk recall '
        '(the most critical metric for patient safety), followed by overall accuracy, overfitting gap, '
        'and inference speed.'
    )
    pdf.ln(2)
    pdf.sub_section('Training Configuration')
    config_items = [
        ('Train/Test Split', '80% / 20% (stratified by risk level)'),
        ('Feature Scaling', 'StandardScaler'),
        ('Class Weights', '{Low: 1, Medium: 2, High: 8}'),
        ('Cross-Validation', '10-fold stratified'),
        ('Hyperparameters', 'n_estimators=400, max_depth=8, lr=0.1'),
        ('Random State', '42 (reproducible)'),
        ('Training Time', '17 minutes 15 seconds'),
    ]
    for k, v in config_items:
        pdf.key_value(k, v)

    pdf.ln(4)
    pdf.sub_section('Model Comparison')
    w = [50, 30, 30, 30, 25]
    pdf.table_header(['Model', 'Test Acc', 'HR Recall', 'Train Acc', 'Time'], w)
    pdf.table_row(['XGBoost', '99.98%', '100.00%', '100.00%', '57.2s'], w, True)
    pdf.table_row(['Random Forest', '100.00%', '99.99%', '100.00%', '238.7s'], w)
    pdf.table_row(['RF Heavy-Weight', '100.00%', '99.99%', '100.00%', '281.7s'], w, True)
    pdf.table_row(['Extra Trees', '99.75%', '99.98%', '99.89%', '262.2s'], w)
    pdf.ln(2)
    pdf.body_text('Selected Model: XGBoost -- highest high-risk recall with fastest inference time.')

    # 5.4 Performance Metrics
    pdf.section_title('5.4 Performance Metrics')
    pdf.sub_section('Overall Metrics')
    metrics = [
        ('Overall Accuracy', '99.98%'),
        ('Macro F1-Score', '0.9999'),
        ('Weighted F1-Score', '0.9998'),
        ("Cohen's Kappa", '0.9997'),
        ('Matthews Correlation Coefficient', '0.9997'),
        ('ROC-AUC (macro)', '1.0000'),
        ('ROC-AUC (weighted)', '1.0000'),
    ]
    for k, v in metrics:
        pdf.key_value(k, v)

    pdf.ln(4)
    pdf.sub_section('Per-Class Metrics')
    w = [45, 35, 30, 30, 50]
    pdf.table_header(['Class', 'Precision', 'Recall', 'F1', 'Support'], w)
    pdf.table_row(['Low Risk', '99.97%', '100.00%', '0.9999', '162,259'], w, True)
    pdf.table_row(['Medium Risk', '100.00%', '99.95%', '0.9997', '93,578'], w)
    pdf.table_row(['High Risk', '100.00%', '100.00%', '1.0000', '26,351'], w, True)

    pdf.ln(4)
    pdf.sub_section('Confusion Matrix')
    w = [45, 45, 50, 50]
    pdf.table_header(['Actual \\ Pred', 'Low', 'Medium', 'High'], w)
    pdf.table_row(['Low Risk', '162,256', '3', '0'], w, True)
    pdf.table_row(['Medium Risk', '45', '93,533', '0'], w)
    pdf.table_row(['High Risk', '0', '0', '26,351'], w, True)
    pdf.ln(2)
    pdf.body_text('Total errors: 48 / 282,188 (0.02%). Zero high-risk patients were missed.')

    pdf.ln(2)
    pdf.sub_section('Overfitting Analysis')
    pdf.key_value('Train Accuracy', '100.00%')
    pdf.key_value('Test Accuracy', '99.98%')
    pdf.key_value('Gap', '0.02% (well within 3% target)')
    pdf.key_value('CV Mean', '99.98% +/- 0.01% (10-fold)')

    # 5.5 Safety Overrides
    pdf.add_page()
    pdf.section_title('5.5 Safety Override System')
    pdf.body_text(
        'The safety override system acts as a hard-coded clinical safety net that bypasses the ML model entirely '
        'when vital signs breach critical thresholds. This ensures that dangerously abnormal vitals are ALWAYS '
        'classified as High Risk, regardless of what the ML model predicts.'
    )
    pdf.ln(2)
    w = [50, 50, 90]
    pdf.table_header(['Vital Sign', 'Threshold', 'Clinical Significance'], w)
    overrides = [
        ('SpO2', '< 90%', 'Severe hypoxemia'),
        ('Heart Rate', '> 150 or < 40 bpm', 'Critical tachycardia/bradycardia'),
        ('Systolic BP', '> 180 mmHg', 'Hypertensive crisis'),
        ('Systolic BP', '< 90 mmHg', 'Hypotensive shock'),
        ('Diastolic BP', '> 110 mmHg', 'Hypertensive crisis'),
        ('Diastolic BP', '< 60 mmHg', 'Hypotensive crisis'),
        ('Temperature', '> 103 F', 'High fever / Hyperthermia'),
        ('Temperature', '< 95 F', 'Hypothermia'),
    ]
    for i, (vital, thresh, sig) in enumerate(overrides):
        pdf.table_row([vital, thresh, sig], w, fill=(i % 2 == 0))
    pdf.ln(2)
    pdf.body_text(
        'When triggered, the system returns risk_category="High", confidence=1.0, safety_override=true, '
        'and an override_reason describing which threshold was breached.'
    )

    # 5.6 Threshold Optimization
    pdf.section_title('5.6 Threshold Optimization')
    pdf.body_text(
        'The optimal probability threshold for high-risk classification was determined through systematic evaluation. '
        'A threshold of 0.15 was selected (vs default 0.50) to maximize sensitivity for critical patients.'
    )
    pdf.key_value('Optimal Threshold', '0.15')
    pdf.key_value('Default Threshold', '0.50')
    pdf.body_text(
        'At the optimal threshold: High-Risk Recall = 100.00%, High-Risk Precision = 100.00%, '
        'Overall Accuracy = 99.98%. The model maintains perfect performance across all tested thresholds.'
    )

    # 5.7 Clinical Test Cases
    pdf.section_title('5.7 Clinical Test Cases')
    w = [15, 65, 30, 40, 20]
    pdf.table_header(['#', 'Test Case', 'Predicted', 'Expected', 'Result'], w)
    tests = [
        ('1', 'Normal healthy patient', 'Low', 'Low', 'PASS'),
        ('2', 'Moderate risk patient', 'Medium', 'Medium', 'PASS'),
        ('3', 'Critical patient', 'High', 'High', 'PASS'),
        ('4', 'Safety: SpO2=85%', 'High', 'High', 'PASS'),
        ('5', 'Safety: HR=160', 'High', 'High', 'PASS'),
        ('6', 'Safety: SBP=85', 'High', 'High', 'PASS'),
        ('7', 'Borderline case', 'Low', 'Low/Med', 'PASS'),
        ('8', 'Elderly w/ comorbidities', 'Low', 'Medium', 'FAIL'),
        ('9', 'Isolated hypertension', 'High', 'Med/High', 'PASS'),
    ]
    for i, (n, tc, pred, exp, res) in enumerate(tests):
        pdf.table_row([n, tc, pred, exp, res], w, fill=(i % 2 == 0))
    pdf.ln(2)
    pdf.body_text('Results: 8/9 passed. All 3 safety override cases passed. The single failure (elderly with '
                  'comorbidities) is a known edge case where age + comorbidities alone may not trigger elevated risk '
                  'without accompanying vital sign abnormalities.')

    # ===================== 6. BACKEND ARCHITECTURE =====================
    pdf.add_page()
    pdf.chapter_title('6. Backend Architecture (cortex-agent)')
    pdf.body_text(
        'The backend is a Python FastAPI application that serves as the intelligence layer of CORTEX. '
        'It orchestrates ML predictions, LLM-powered chat, document analysis, and persistent data storage.'
    )

    pdf.section_title('6.1 FastAPI Server & Endpoints')
    pdf.body_text('The server exposes the following REST API endpoints:')
    pdf.ln(2)
    w = [30, 55, 105]
    pdf.table_header(['Method', 'Endpoint', 'Description'], w)
    endpoints = [
        ('POST', '/chat', 'Conversational health queries via LLM'),
        ('POST', '/assessment', 'ML risk prediction from vital signs'),
        ('POST', '/upload-document', 'Medical document OCR and analysis'),
        ('GET', '/documents', 'Retrieve user documents'),
        ('DELETE', '/documents/{id}', 'Delete a document'),
        ('POST', '/documents/share', 'Mark document as shared'),
        ('GET', '/dashboard', 'Get user dashboard data'),
        ('POST', '/reminder', 'Create health/medication reminder'),
        ('GET', '/history', 'Get conversation history'),
        ('DELETE', '/history', 'Clear conversation context'),
    ]
    for i, (method, endpoint, desc) in enumerate(endpoints):
        pdf.table_row([method, endpoint, desc], w, fill=(i % 2 == 0))

    pdf.ln(4)
    pdf.section_title('6.2 Cortex Unified Agent')
    pdf.body_text(
        'The CortexUnifiedAgent class (cortex_agent.py) is the central orchestrator that routes requests '
        'between the ML predictor, LLM client, and database layer. It provides four main capabilities:'
    )
    pdf.bullet('handle_chat() - Routes conversational queries to the LLM with assessment context')
    pdf.bullet('handle_assessment() - Runs ML prediction + LLM explanation + database save')
    pdf.bullet('handle_document_upload() - Sends documents to LLM for OCR/analysis + saves results')
    pdf.bullet('handle_create_reminder() - Creates health reminders in Firestore')

    pdf.ln(4)
    pdf.section_title('6.3 ML Predictor Module')
    pdf.body_text(
        'The CortexMLPredictor class (ml_predictor.py) handles the complete ML inference pipeline:'
    )
    pdf.bullet('Safety Override Check - Hard-coded clinical thresholds checked before ML inference')
    pdf.bullet('Feature Engineering - Expands 6 core vitals into the full feature vector')
    pdf.bullet('StandardScaler Transform - Normalizes features using the trained scaler')
    pdf.bullet('XGBoost Prediction - Generates class probabilities [Low, Medium, High]')
    pdf.bullet('Fallback Heuristics - Rule-based prediction if model files are unavailable')

    pdf.ln(4)
    pdf.section_title('6.4 AI Chat Client (LLM Integration)')
    pdf.body_text(
        'The CortexGeminiClient class (gemini_client.py) provides LLM-powered capabilities via OpenRouter:'
    )
    pdf.key_value('Primary Model', 'Llama 3.3 70B Instruct (free tier)')
    pdf.key_value('Fallback Model', 'OpenRouter Auto-Router (free)')
    pdf.key_value('API Provider', 'OpenRouter (OpenAI-compatible API)')
    pdf.ln(2)
    pdf.body_text('The LLM is used for three functions:')
    pdf.bullet('generate_chat_response() - Free-form health Q&A with conversation history')
    pdf.bullet('explain_assessment() - Plain-language explanation of ML risk predictions')
    pdf.bullet('analyze_document() - Medical document OCR, categorization, and key findings extraction')
    pdf.ln(2)
    pdf.body_text(
        'The system prompt defines the AI persona as "Cortex Health Companion" -- warm, empathetic, '
        'patient-facing, with strict safety rules for emergency detection and medical disclaimers.'
    )

    pdf.ln(4)
    pdf.section_title('6.5 Firebase Database Layer')
    pdf.body_text(
        'The Database class (database.py) provides a Firestore persistence layer with mock fallback. '
        'Data is organized under per-user document collections:'
    )
    pdf.bullet('users/{userId}/history - Conversational memory (chat messages)')
    pdf.bullet('users/{userId}/assessments - Risk assessment results with vitals and predictions')
    pdf.bullet('users/{userId}/documents - Uploaded medical document analyses')
    pdf.bullet('users/{userId}/reminders - Health and medication reminders')

    # ===================== 7. FRONTEND =====================
    pdf.add_page()
    pdf.chapter_title('7. Frontend Architecture (React Dashboard)')

    pdf.section_title('7.1 Component Structure')
    pdf.body_text(
        'The frontend is a React 19 SPA built with Vite 7 and styled with Tailwind CSS 4. '
        'It follows a component-based architecture with the main Dashboard component routing '
        'between six tab views.'
    )
    pdf.ln(2)
    pdf.sub_section('Core Components')
    pdf.bullet('App.jsx - Root component with React Router (/, /login, /signup, /dashboard)')
    pdf.bullet('Dashboard.jsx - Main dashboard container with tab routing and data management')
    pdf.bullet('AuthContext.jsx - Authentication provider (signup, login, logout, OTP, Firestore sync)')
    pdf.bullet('Navbar.jsx, Hero.jsx, Features.jsx, etc. - Landing page components')
    pdf.ln(2)
    pdf.sub_section('Dashboard Tab Components')
    pdf.bullet('HomeTab.jsx - Patient overview, Cortex AI score, health summary, care timeline')
    pdf.bullet('HealthChatTab.jsx - AI health companion chat interface')
    pdf.bullet('VitalAssessmentTab.jsx - Vital sign input form with ML risk prediction')
    pdf.bullet('DocumentsTab.jsx - Clinical document management')
    pdf.bullet('DatabaseTab.jsx - Assessment history and biometric logs')
    pdf.bullet('AnalyticsInsights.jsx + BrainMapping.jsx + VitalsGrid.jsx + NextSteps.jsx - Analytics')

    pdf.ln(4)
    pdf.section_title('7.2 Dashboard Tabs Overview')

    tabs = [
        ('Home Tab', 'The main dashboard view showing a personalized greeting, Cortex AI health score '
         '(0-100), health summary cards (appointments, medications, risk level, timeline), latest assessment '
         'results with probability breakdown, care timeline, and user profile with action buttons.'),
        ('Health Chat Tab', 'An AI-powered conversational health assistant. Users can ask any health question '
         'and receive contextual, empathetic responses. The chat maintains conversation history and can reference '
         'the user\'s latest assessment data. Responses are rendered in Markdown format.'),
        ('Assessment Tab', 'A vital sign input form where users enter Heart Rate, SpO2, Blood Pressure, '
         'Temperature, and Respiratory Rate. On submission, the data is sent to the ML backend for real-time '
         'risk prediction. Results show risk category, confidence, and probability breakdown.'),
        ('Documents Tab', 'A clinical document management system supporting upload and AI-powered analysis '
         'of medical documents (lab reports, imaging, clinical notes). Documents are categorized, summarized, '
         'and key findings are extracted using LLM analysis.'),
        ('Database Tab', 'Displays assessment history with timestamps, biometric logs, auto-scan status, '
         'and system statistics. Users can view and manage their historical health data.'),
        ('Analytics Tab', 'Advanced health analytics including: Brain Mapping (SHAP-inspired feature importance '
         'visualization), Personal Risk Gauge, Interactive Vitals Grid with historical trends, and a personalized '
         'Next Steps action plan with recommendations.'),
    ]
    for name, desc in tabs:
        pdf.sub_section(name)
        pdf.body_text(desc)

    pdf.add_page()
    pdf.section_title('7.3 Authentication System')
    pdf.body_text(
        'CORTEX uses Firebase Authentication with a custom OTP verification layer:'
    )
    pdf.bullet('Email/Password Registration with display name')
    pdf.bullet('Email OTP Verification via Firebase Cloud Functions + EmailJS')
    pdf.bullet('Login with "Keep me signed in" option (browser local vs session persistence)')
    pdf.bullet('Password Reset via Firebase sendPasswordResetEmail')
    pdf.bullet('Auth State Caching in localStorage for instant UI restore on page reload')
    pdf.bullet('Real-time Firestore listener (onSnapshot) syncs user data and assessments')
    pdf.bullet('Protected route guards redirect unauthenticated users to the landing page')

    pdf.ln(4)
    pdf.section_title('7.4 UI/UX Design')
    pdf.body_text(
        'The dashboard features a premium, modern design language:'
    )
    pdf.bullet('Clean white background with subtle ambient mesh gradient backgrounds')
    pdf.bullet('Glass morphism panels with soft shadows and rounded corners (32px border radius)')
    pdf.bullet('Inter font family for clean, readable typography')
    pdf.bullet('Consistent color palette: emerald/teal (#00DAAA, #109981) for health indicators')
    pdf.bullet('Animated skeleton loaders during data fetching for smooth UX')
    pdf.bullet('Responsive mobile-first layout using Tailwind CSS grid and flexbox')
    pdf.bullet('Lucide React icons throughout the interface')

    # ===================== 8. SECURITY =====================
    pdf.add_page()
    pdf.chapter_title('8. Security & Compliance')

    pdf.section_title('Authentication & Authorization')
    pdf.bullet('Firebase Authentication with email/password (industry-standard)')
    pdf.bullet('OTP email verification prevents unauthorized account creation')
    pdf.bullet('Session persistence options (local storage vs session-only)')
    pdf.bullet('Auto-logout on token expiration')
    pdf.ln(2)

    pdf.section_title('Firestore Security Rules')
    pdf.body_text('User-scoped access control ensures data isolation:')
    pdf.code_block(
        "rules_version = '2';\n"
        "service cloud.firestore {\n"
        "  match /databases/{database}/documents {\n"
        "    match /otpVerifications/{docId} {\n"
        "      allow read, write: if false;  // Cloud Functions only\n"
        "    }\n"
        "    match /users/{userId}/{document=**} {\n"
        "      allow read, write: if request.auth != null\n"
        "        && request.auth.uid == userId;\n"
        "    }\n"
        "  }\n"
        "}"
    )
    pdf.ln(2)

    pdf.section_title('Data Privacy')
    pdf.bullet('All data scoped to individual users (no cross-user access)')
    pdf.bullet('No PHI stored in frontend localStorage (only auth state)')
    pdf.bullet('All API communication over HTTPS (TLS 1.3)')
    pdf.bullet('CORS middleware enabled on backend')
    pdf.bullet('OTP verification records are Cloud Functions-only (no client access)')
    pdf.bullet('HIPAA-eligible infrastructure (Firebase + GCP)')

    # ===================== 9. DEPLOYMENT =====================
    pdf.add_page()
    pdf.chapter_title('9. Deployment & Infrastructure')

    pdf.section_title('Backend Deployment (Google Cloud Run)')
    pdf.body_text('The backend is containerized using Docker and deployed to Google Cloud Run:')
    pdf.ln(2)
    pdf.sub_section('Dockerfile')
    pdf.code_block(
        "FROM python:3.11-slim\n"
        "ENV PYTHONDONTWRITEBYTECODE=1\n"
        "ENV PYTHONUNBUFFERED=1\n"
        "ENV PORT=8080\n"
        "WORKDIR /app\n"
        "COPY requirements.txt .\n"
        "RUN pip install --no-cache-dir -r requirements.txt\n"
        "COPY . .\n"
        "EXPOSE $PORT\n"
        'CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port $PORT"]'
    )
    pdf.ln(2)
    pdf.sub_section('Cloud Run Configuration')
    pdf.key_value('Region', 'asia-south1 (Mumbai)')
    pdf.key_value('Memory', '2 GB')
    pdf.key_value('CPU', '2 vCPUs')
    pdf.key_value('Timeout', '300 seconds')
    pdf.key_value('Max Instances', '10')
    pdf.key_value('Min Instances', '0 (scales to zero)')
    pdf.key_value('Authentication', 'Allow unauthenticated (public API)')

    pdf.ln(4)
    pdf.section_title('Frontend Deployment')
    pdf.body_text('The frontend can be deployed to Firebase Hosting or Vercel:')
    pdf.ln(2)
    pdf.sub_section('Firebase Hosting')
    pdf.bullet('Build: npm run build (Vite produces optimized dist/ folder)')
    pdf.bullet('Deploy: firebase deploy --only hosting')
    pdf.bullet('SPA rewrites configured for client-side routing')
    pdf.bullet('Cache headers set to no-cache for HTML/JS/CSS')
    pdf.ln(2)
    pdf.sub_section('Vercel')
    pdf.bullet('vercel.json configured with SPA rewrites')
    pdf.bullet('Environment variables set in Vercel dashboard')

    # ===================== 10. API DOCS =====================
    pdf.add_page()
    pdf.chapter_title('10. API Documentation')

    pdf.section_title('Base URLs')
    pdf.key_value('Production', 'https://cortex-agent-472595500035.us-central1.run.app')
    pdf.key_value('Local Dev', 'http://localhost:8000')
    pdf.ln(4)

    pdf.section_title('POST /chat')
    pdf.body_text('Handles free-form conversational health queries via LLM.')
    pdf.sub_section('Request Body')
    pdf.code_block(
        '{\n'
        '  "user_id": "string",\n'
        '  "message": "string",\n'
        '  "latest_assessment": { ... },  // optional\n'
        '  "chat_history": [ ... ]         // optional\n'
        '}'
    )
    pdf.sub_section('Response')
    pdf.code_block('{ "status": "success", "response": "AI response text" }')

    pdf.ln(4)
    pdf.section_title('POST /assessment')
    pdf.body_text('Processes vital signs through the ML model and returns risk prediction with explanation.')
    pdf.sub_section('Request Body')
    pdf.code_block(
        '{\n'
        '  "user_id": "string",\n'
        '  "vitals": {\n'
        '    "hr": 95, "spo2": 97, "sys_bp": 110,\n'
        '    "dia_bp": 70, "rr": 18, "temp": 98.6\n'
        '  }\n'
        '}'
    )
    pdf.sub_section('Response')
    pdf.code_block(
        '{\n'
        '  "status": "success",\n'
        '  "data": {\n'
        '    "prediction": {\n'
        '      "risk_category": "Low",\n'
        '      "risk_score": 1,\n'
        '      "probabilities": { "Low": 85.0, "Medium": 13.0, "High": 2.0 },\n'
        '      "confidence": 0.94,\n'
        '      "safety_override": false\n'
        '    },\n'
        '    "explanation": "AI-generated plain language explanation"\n'
        '  }\n'
        '}'
    )

    pdf.ln(4)
    pdf.section_title('POST /upload-document')
    pdf.body_text('Uploads and analyzes medical documents (multipart form data).')
    pdf.key_value('Content-Type', 'multipart/form-data')
    pdf.key_value('Fields', 'user_id (string), file (binary)')

    # ===================== 11. FILE STRUCTURE =====================
    pdf.add_page()
    pdf.chapter_title('11. Project File Structure')
    pdf.code_block(
        "Cortex/\n"
        "|-- README.md                     # Project documentation\n"
        "|-- train_cortex_v3.py            # Model training script (v3.0)\n"
        "|-- evaluate_cortex_v3.py         # Model evaluation script\n"
        "|-- model_production.pkl          # Trained XGBoost model (2.8 MB)\n"
        "|-- scaler_production.pkl         # StandardScaler artifact\n"
        "|-- feature_names_production.pkl  # 44 feature names\n"
        "|-- threshold_config.json         # Optimal threshold config\n"
        "|-- model_metadata.json           # Full model metadata\n"
        "|-- training_report_production.txt# Training report\n"
        "|\n"
        "|-- cortex-agent/                 # Backend (Python/FastAPI)\n"
        "|   |-- api/\n"
        "|   |   |-- main.py              # FastAPI server + endpoints\n"
        "|   |-- agent/\n"
        "|   |   |-- cortex_agent.py      # Unified agent orchestrator\n"
        "|   |   |-- ml_predictor.py      # ML inference wrapper\n"
        "|   |   |-- gemini_client.py     # LLM client (OpenRouter)\n"
        "|   |   |-- database.py          # Firestore persistence\n"
        "|   |-- models/                   # Model artifacts\n"
        "|   |-- requirements.txt          # Python dependencies\n"
        "|   |-- Dockerfile                # Container definition\n"
        "|\n"
        "|-- Landing Page/                 # Frontend (React/Vite)\n"
        "|   |-- src/\n"
        "|   |   |-- components/\n"
        "|   |   |   |-- Dashboard.jsx     # Main dashboard\n"
        "|   |   |   |-- Hero.jsx, Navbar.jsx, etc.\n"
        "|   |   |   |-- dashboard/\n"
        "|   |   |       |-- HomeTab.jsx\n"
        "|   |   |       |-- HealthChatTab.jsx\n"
        "|   |   |       |-- VitalAssessmentTab.jsx\n"
        "|   |   |       |-- DocumentsTab.jsx\n"
        "|   |   |       |-- DatabaseTab.jsx\n"
        "|   |   |       |-- AnalyticsInsights.jsx\n"
        "|   |   |       |-- BrainMapping.jsx\n"
        "|   |   |       |-- VitalsGrid.jsx\n"
        "|   |   |       |-- NextSteps.jsx\n"
        "|   |   |-- context/AuthContext.jsx\n"
        "|   |   |-- lib/firebase.js, defaultData.js\n"
        "|   |-- login/, signup/           # Auth pages\n"
        "|   |-- functions/                # Firebase Cloud Functions\n"
        "|   |-- firebase.json, firestore.rules\n"
        "|   |-- package.json, vite.config.js\n"
        "|\n"
        "|-- Data/                         # Training data (MIMIC-IV)\n"
        "|-- patient_risk_model/           # Earlier model experiments\n"
        "|-- Assets/                       # Design assets"
    )

    # ===================== 12. PERFORMANCE =====================
    pdf.add_page()
    pdf.chapter_title('12. Performance Benchmarks')

    pdf.section_title('ML Inference Performance')
    w = [55, 35, 35, 35, 35]
    pdf.table_header(['Metric', 'Min', 'Mean', 'P95', 'P99'], w)
    pdf.table_row(['Single Prediction', '0.31ms', '0.37ms', '0.40ms', '0.50ms'], w, True)
    pdf.ln(2)
    pdf.key_value('Batch Throughput', '550,448 predictions/second (10,000 batch)')
    pdf.key_value('Model Size', '2.8 MB')
    pdf.key_value('Model Load Time', '~300ms')

    pdf.ln(4)
    pdf.section_title('Cross-Validation Stability')
    w = [40, 40, 40, 40]
    pdf.table_header(['Fold', 'Accuracy', 'Fold', 'Accuracy'], w)
    cv_data = [
        ('Fold 1', '100.00%', 'Fold 6', '99.98%'),
        ('Fold 2', '99.98%', 'Fold 7', '99.98%'),
        ('Fold 3', '99.98%', 'Fold 8', '99.98%'),
        ('Fold 4', '99.98%', 'Fold 9', '100.00%'),
        ('Fold 5', '99.96%', 'Fold 10', '100.00%'),
    ]
    for i, (f1, a1, f2, a2) in enumerate(cv_data):
        pdf.table_row([f1, a1, f2, a2], w, fill=(i % 2 == 0))
    pdf.ln(2)
    pdf.key_value('CV Mean', '99.98% +/- 0.01%')
    pdf.key_value('Consistency', 'Excellent (range: 99.96% - 100.00%)')

    pdf.ln(4)
    pdf.section_title('Target Verification Summary')
    w = [60, 35, 35, 30]
    pdf.table_header(['Metric', 'Target', 'Achieved', 'Status'], w)
    targets = [
        ('Overall Accuracy', '>= 98%', '99.98%', 'PASS'),
        ('High-Risk Recall', '>= 95%', '100.00%', 'PASS'),
        ('Medium-Risk Recall', '>= 90%', '99.95%', 'PASS'),
        ('Low-Risk Recall', '>= 95%', '100.00%', 'PASS'),
        ('Macro F1-Score', '>= 0.90', '0.9999', 'PASS'),
        ('Train/Test Gap', '< 3%', '0.02%', 'PASS'),
        ('Inference (P95)', '< 100ms', '0.40ms', 'PASS'),
    ]
    for i, (m, t, a, s) in enumerate(targets):
        pdf.table_row([m, t, a, s], w, fill=(i % 2 == 0))
    pdf.ln(2)
    pdf.body_text('All 7/7 production targets met. Model approved for production deployment.')

    # ===================== 13. FUTURE ROADMAP =====================
    pdf.add_page()
    pdf.chapter_title('13. Future Roadmap')

    pdf.section_title('Planned Improvements')
    roadmap = [
        ('Wearable Integration', 'Connect with Apple Watch, Fitbit, and other wearable devices for '
         'continuous vital sign monitoring and automated assessment triggers.'),
        ('Multi-Language Support', 'Extend the AI health companion to support Hindi, Spanish, and other '
         'languages for broader accessibility.'),
        ('Push Notifications', 'Implement real-time push notifications for medication reminders, '
         'abnormal vital alerts, and appointment reminders.'),
        ('Provider Portal', 'Build a separate healthcare provider dashboard for managing multiple '
         'patients, viewing population-level analytics, and receiving critical alerts.'),
        ('FHIR Integration', 'Integrate with HL7 FHIR standards for interoperability with Electronic '
         'Health Record (EHR) systems.'),
        ('Model Retraining Pipeline', 'Automate quarterly model retraining with drift detection, '
         'A/B testing of model versions, and automated rollback capabilities.'),
        ('Explainable AI Dashboard', 'Add SHAP waterfall plots, LIME explanations, and counterfactual '
         'analysis for full model interpretability.'),
        ('Offline Mode', 'Enable offline assessment capability using a lightweight on-device model '
         'for areas with limited connectivity.'),
    ]
    for name, desc in roadmap:
        pdf.sub_section(name)
        pdf.body_text(desc)

    # ===================== FINAL PAGE =====================
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 12, 'End of Documentation', ln=True, align='C')
    pdf.ln(8)
    pdf.set_draw_color(0, 218, 170)
    pdf.set_line_width(1)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.ln(12)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 8, 'CORTEX v3.0 - Clinical Risk Assessment System', ln=True, align='C')
    pdf.cell(0, 8, 'Comprehensive Project Documentation', ln=True, align='C')
    pdf.ln(4)
    pdf.cell(0, 8, 'Model: XGBoost | Accuracy: 99.98% | High-Risk Recall: 100%', ln=True, align='C')
    pdf.cell(0, 8, 'Trained on 1,410,937 real patient records', ln=True, align='C')
    pdf.ln(8)
    pdf.set_font('Helvetica', 'I', 10)
    pdf.cell(0, 8, 'Generated: February 2026', ln=True, align='C')

    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'CORTEX_v3_Project_Documentation.pdf')
    pdf.output(output_path)
    print(f"PDF generated successfully: {output_path}")
    print(f"Total pages: {pdf.page_no()}")
    return output_path

if __name__ == '__main__':
    build_pdf()
