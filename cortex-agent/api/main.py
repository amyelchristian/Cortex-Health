"""
main.py
FastAPI Server Backend for the Cortex Health Companion Agent.
Exposes endpoints for chat, assessment, documents, and reminders.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
import os
import sys

# Ensure agent module is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent.cortex_agent import cortex_agent
from agent.database import db

app = FastAPI(title="Cortex Health Companion API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    user_id: str
    message: str
    latest_assessment: Optional[Dict[str, Any]] = None
    chat_history: Optional[List[Dict[str, str]]] = None

class AssessmentRequest(BaseModel):
    user_id: str
    vitals: Dict[str, float]

class ReminderRequest(BaseModel):
    user_id: str
    rem_type: str
    time: str
    message: str

# --- Endpoints ---
@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """Handles free-form conversational queries."""
    if not req.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    response = cortex_agent.handle_chat(req.user_id, req.message, req.latest_assessment, req.chat_history)
    return {"status": "success", "response": response}

@app.post("/assessment")
async def assessment_endpoint(req: AssessmentRequest):
    """Processes vitals through ML model and returns explained risk."""
    if not req.vitals:
        raise HTTPException(status_code=400, detail="Vitals data is required")
        
    result = cortex_agent.handle_assessment(req.user_id, req.vitals)
    return {"status": "success", "data": result}

@app.post("/upload-document")
async def upload_document_endpoint(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Processes medical documents via Gemini Vision."""
    try:
        content = await file.read()
        analysis = cortex_agent.handle_document_upload(
            user_id=user_id,
            file_content=content,
            mime_type=file.content_type,
            filename=file.filename
        )
        return {"status": "success", "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def get_documents_endpoint(user_id: str):
    """Retrieves all medical documents for the user."""
    docs = db.get_documents(user_id)
    return {"status": "success", "documents": docs}

@app.get("/dashboard")
async def get_dashboard_endpoint(user_id: str):
    """Retrieves all health insights and recent history for the user."""
    history = db.get_assessment_history(user_id)
    latest = db.get_latest_assessment(user_id)
    reminders = db.get_reminders(user_id)
    
    return {
        "status": "success",
        "data": {
            "total_assessments": len(history),
            "latest_assessment": latest,
            "active_reminders": len([r for r in reminders if r.get('active')]),
            "history": history[-5:] # Return last 5
        }
    }

class ShareRequest(BaseModel):
    user_id: str
    doc_id: str

@app.post("/documents/share")
async def share_document_endpoint(req: ShareRequest):
    """Marks a document as securely shared."""
    success = db.mark_document_shared(req.user_id, req.doc_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to share document.")

@app.post("/reminder")
async def create_reminder_endpoint(req: ReminderRequest):
    """Creates a new health or medication reminder."""
    result = cortex_agent.handle_create_reminder(
        req.user_id, req.rem_type, req.time, req.message
    )
    return result

@app.get("/history")
async def get_history_endpoint(user_id: str):
    """Gets raw conversation history for context debugging."""
    return {"history": db.get_conversation(user_id)}

@app.delete("/history")
async def clear_history_endpoint(user_id: str):
    """Clears conversation context."""
    db.clear_conversation(user_id)
    return {"status": "success"}

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
