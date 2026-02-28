"""
database.py
Firebase Firestore persistence layer for the Cortex Health Companion Agent.
Manages conversations, assessments, documents, and reminders in the cloud.
"""
from datetime import datetime
from typing import Dict, List, Any, Optional
import os
import firebase_admin
from firebase_admin import credentials, firestore

class Database:
    def __init__(self):
        self.mode = "mock"
        self.db = None
        
        # Initialize Firebase
        cred_path = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
        try:
            if os.path.exists(cred_path):
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.mode = "firebase"
                print("Connected to Firebase Firestore!")
            else:
                print(f"WARNING: No serviceAccountKey.json found at {cred_path}.")
                print("Please download it from Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key.")
                print("Falling back to empty/mock responses for now.")
        except Exception as e:
            print(f"Firebase Init Error: {e}")

    # --- Conversational Memory ---
    def get_conversation(self, user_id: str) -> List[Dict]:
        if self.mode != "firebase": return []
        docs = self.db.collection('users').document(user_id).collection('history').order_by('timestamp').stream()
        return [doc.to_dict() for doc in docs]

    def append_message(self, user_id: str, role: str, content: str):
        if self.mode != "firebase": return
        msg = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        self.db.collection('users').document(user_id).collection('history').add(msg)

    def clear_conversation(self, user_id: str):
        if self.mode != "firebase": return
        docs = self.db.collection('users').document(user_id).collection('history').stream()
        for doc in docs:
            doc.reference.delete()

    # --- Assessments ---
    def save_assessment(self, user_id: str, vitals: dict, prediction: dict, explanation: str):
        if self.mode != "firebase": return
        assessment_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "vitals": vitals,
            "prediction": prediction,
            "explanation": explanation
        }
        self.db.collection('users').document(user_id).collection('assessments').add(assessment_record)

    def get_latest_assessment(self, user_id: str) -> Optional[Dict]:
        if self.mode != "firebase": return None
        docs = self.db.collection('users').document(user_id).collection('assessments').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    def get_assessment_history(self, user_id: str) -> List[Dict]:
        if self.mode != "firebase": return []
        docs = self.db.collection('users').document(user_id).collection('assessments').order_by('timestamp').stream()
        return [doc.to_dict() for doc in docs]

    # --- Documents ---
    def save_document_record(self, user_id: str, doc_id: str, filename: str, analysis: str, key_findings: List[str], category: str = "Clinical Notes"):
        if self.mode != "firebase": return
        doc_record = {
            "id": doc_id,
            "title": filename,
            "filename": filename,
            "upload_date": datetime.utcnow().isoformat() + "Z",
            "date": datetime.utcnow().strftime('%b %d, %Y'),
            "analysis": analysis,
            "summary": analysis,
            "key_findings": key_findings,
            "category": category,
            "status": "Reviewed",
            "urgency": "Low"
        }
        self.db.collection('users').document(user_id).collection('documents').document(doc_id).set(doc_record)

    def get_documents(self, user_id: str) -> List[Dict]:
        if self.mode != "firebase": return []
        docs = self.db.collection('users').document(user_id).collection('documents').order_by('upload_date', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]

    def mark_document_shared(self, user_id: str, doc_id: str) -> bool:
        if self.mode != "firebase": return False
        try:
            self.db.collection('users').document(user_id).collection('documents').document(doc_id).update({"isShared": True})
            return True
        except Exception:
            return False

    # --- Reminders ---
    def add_reminder(self, user_id: str, rem_id: str, type: str, time: str, message: str):
        if self.mode != "firebase": return
        rem_record = {
            "id": rem_id,
            "type": type,
            "time": time,
            "message": message,
            "active": True
        }
        self.db.collection('users').document(user_id).collection('reminders').document(rem_id).set(rem_record)

    def get_reminders(self, user_id: str) -> List[Dict]:
        if self.mode != "firebase": return []
        docs = self.db.collection('users').document(user_id).collection('reminders').stream()
        return [doc.to_dict() for doc in docs]

# Global db instance
db = Database()
