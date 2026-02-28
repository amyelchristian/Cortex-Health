"""
cortex_agent.py
The Unified Agent that orchestrates routing between:
- Conversational chat (via Gemini)
- Health Assessments (via ML Model + Gemini explanation)
- Document analysis (via Gemini Vision/OCR)
- Reminders and Memory (via Database)
"""
from datetime import datetime
from agent.database import db
from agent.gemini_client import gemini_client
from agent.ml_predictor import ml_predictor

class CortexUnifiedAgent:
    
    def handle_chat(self, user_id: str, message: str, frontend_assessment: dict = None, chat_history: list = None) -> str:
        """Handles standard free-form conversational queries with context."""
        # 1. Fetch user's latest assessment context (prioritize frontend if passing directly)
        latest_assessment = frontend_assessment or db.get_latest_assessment(user_id)
        print(f"DEBUG - Chat user_id: {user_id}")
        print(f"DEBUG - Frontend Assessment received: {frontend_assessment is not None}")
        print(f"DEBUG - Latest Assessment resolved: {latest_assessment is not None}")
        
        # 2. Store user message globally
        db.append_message(user_id, "user", message)
        
        # 3. Get history (Prioritize isolated frontend session over global history)
        if chat_history is not None:
             history = chat_history
        else:
             history = db.get_conversation(user_id)
        
        # 4. Generate response via Gemini
        response = gemini_client.generate_chat_response(message, history, latest_assessment)
        
        # 4. Store AI response
        db.append_message(user_id, "model", response)
        
        return response

    def handle_assessment(self, user_id: str, vitals: dict) -> dict:
        """Handles ML Risk prediction and explanation generation."""
        # 1. Run ML Prediction (handles safety overrides)
        prediction = ml_predictor.predict(vitals)
        
        # 2. Generate plain-language explanation via Gemini
        explanation = gemini_client.explain_assessment(vitals, prediction)
        
        # 3. Save to database
        db.save_assessment(user_id, vitals, prediction, explanation)
        
        return {
            "prediction": prediction,
            "explanation": explanation
        }

    def handle_document_upload(self, user_id: str, file_content: bytes, mime_type: str, filename: str) -> str:
        """Handles Document Vision and OCR via Gemini."""
        # 1. Route to Gemini 1.5 Flash Vision capabilities
        analysis_str = gemini_client.analyze_document(file_content, mime_type, filename)
        
        try:
            import json
            data = json.loads(analysis_str)
            summary = data.get("summary", analysis_str)
            key_findings = data.get("key_findings", [])
            category = data.get("category", "Clinical Notes")
        except:
            summary = analysis_str
            key_findings = []
            category = "Clinical Notes"
            
        # 2. Record action
        doc_id = f"doc_{int(datetime.utcnow().timestamp())}"
        db.save_document_record(user_id, doc_id, filename, summary, key_findings, category)
        
        return analysis_str

    def handle_create_reminder(self, user_id: str, rem_type: str, time: str, message: str) -> dict:
        """Local memory setting for wellness/medication prompts."""
        rem_id = f"rem_{int(datetime.utcnow().timestamp())}"
        db.add_reminder(user_id, rem_id, rem_type, time, message)
        return {"status": "success", "reminder_id": rem_id}

# Global unified agent instance
cortex_agent = CortexUnifiedAgent()
