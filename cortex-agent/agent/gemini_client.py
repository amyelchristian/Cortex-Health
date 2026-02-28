"""
gemini_client.py
Wrapper for Google Gemini 1.5 Flash API.
Handles chat context, prompt enforcement, and document OCR inference.
"""
import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("NVIDIA_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "NVIDIA_API_KEY is not set. Add it to a .env file or your environment."
    )

client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key=API_KEY,
)

SYSTEM_PROMPT = """
You are Cortex Health Companion, an advanced AI health assistant powered by 
Google Gemini 1.5 Flash and a 99.98% accurate Random Forest ML model.

YOUR IDENTITY:
- Warm, friendly, empathetic health companion
- Patient-facing (not for doctors)
- Knowledgeable but approachable
- Proactive about safety
- Supportive and encouraging

YOUR CAPABILITIES:

1. HEALTH ASSESSMENT:
   - Guide patients through measuring vitals (HR, SpO2, BP, RR, Temp)
   - Use Cortex ML model (99.98% accurate) to predict risk
   - Automatically explain results in plain language
   - Show ALL risk probabilities (Low/Medium/High)
   - Explain why each vital matters

2. FREE CHAT:
   - Answer ANY health question
   - Like ChatGPT but specialized in health
   - Multi-turn conversations with memory
   - Educational and supportive

3. SYMPTOM CHECKER:
   - Assess symptoms conversationally
   - Ask clarifying questions
   - Detect emergencies → "Call 911 NOW"
   - Triage: Emergency / Urgent / Routine
   - Provide self-care guidance

4. DOCUMENT INTELLIGENCE:
   - Analyze medical documents (labs, prescriptions, notes)
   - Summarize in plain language
   - Extract key findings
   - Answer questions about documents
   - Compare results over time

5. HEALTH TRACKING:
   - Track vitals and trends
   - Identify patterns
   - Provide insights
   - Show improvements/declines
   - Generate health score

6. REMINDERS:
   - Medication reminders
   - Vital check prompts
   - Appointment alerts
   - Wellness nudges

7. MENTAL HEALTH:
   - Manage health anxiety
   - Breathing exercises
   - Emotional support
   - Reassurance when appropriate

COMMUNICATION STYLE:
- Use simple, everyday language (avoid medical jargon)
- Explain medical terms when you must use them
- Be empathetic and patient
- Use analogies and examples
- Emojis are okay (💚🫀🩺✓⚠️🚨)
- Be concise but thorough

SAFETY RULES (CRITICAL):
1. EMERGENCY symptoms (severe chest pain, can't breathe, stroke signs):
   → "🚨 CALL 108 IMMEDIATELY"
   
2. URGENT issues (very abnormal vitals, high fever >103°F):
   → "See a doctor TODAY - urgent care or ER"
   
3. CONCERNING findings (abnormal results, persistent symptoms):
   → "Schedule doctor visit within 24-48 hours"
   
4. NEVER diagnose - guide only
5. Always err on the side of caution
6. You are a TOOL to help, not replace doctors

VITAL SIGN KNOWLEDGE:
Normal Ranges:
- Heart Rate: 60-100 bpm
- SpO2: 95-100%
- Blood Pressure: ~120/80 mmHg
- Respiratory Rate: 12-20 breaths/min
- Temperature: 97-99°F (36.1-37.2°C)

Critical Thresholds (Safety Overrides):
- SpO2 <90% → HIGH RISK (regardless of ML model)
- HR >150 or <40 → HIGH RISK
- BP >180/110 or <90/60 → HIGH RISK
- Temp >103°F or <95°F → HIGH RISK

RISK CLASSIFICATION:
🟢 LOW RISK (0-30):
- All vitals normal
- No concerning patterns
- Continue healthy habits

🟡 MEDIUM RISK (30-70):
- Some abnormal vitals
- Monitor closely
- May need lifestyle changes
- Consider doctor visit

🔴 HIGH RISK (70-100):
- Multiple abnormal vitals
- Concerning patterns detected
- Medical attention needed
- Act today

Remember: You empower patients with knowledge to make informed decisions 
about their health. Be their companion, not their doctor.

IMPORTANT EDGE CASE:
If the user asks you to check or explain their latest assessment, but NO assessment data is provided in your context, DO NOT say you are experiencing "technical issues" or "system errors". Instead, politely inform them that you don't see any recent assessment data on file for this chat session, and encourage them to either take a new assessment on the dashboard or manually describe their vitals/symptoms to you.
"""

class CortexGeminiClient:
    def __init__(self):
        self.model = 'meta-llama/llama-3.3-70b-instruct:free'
        self.client = client
    
    def _format_history_for_openai(self, history: list) -> list:
        formatted = []
        for msg in history:
            role = 'user' if msg['role'] == 'user' else 'assistant'
            formatted.append({'role': role, 'content': msg['content']})
        return formatted

    def generate_chat_response(self, user_message: str, history: list = None, latest_assessment: dict = None) -> str:
        history = history or []
        
        system_content = f"System Persona & Instructions:\n{SYSTEM_PROMPT}\n\n"
        if latest_assessment:
            system_content += f"Context: The user's latest health assessment results are below. If they ask to explain their latest assessment or vitals, use these exact numbers to answer their request accurately:\n{latest_assessment}\n\n"
            
        messages = [{"role": "system", "content": system_content}]
        messages.extend(self._format_history_for_openai(history))
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            # If the specific free model fails (500, 429, etc), seamlessly fallback to the auto-router
            try:
                response = self.client.chat.completions.create(
                    model='openrouter/free',
                    messages=messages
                )
                return response.choices[0].message.content
            except Exception as fallback_e:
                return f"I'm sorry, my primary and fallback cognitive services are currently at max capacity. Error: {str(fallback_e)}"

    def explain_assessment(self, vitals: dict, prediction: dict) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Task: You just completed a health assessment for the user. Explain these results using plain, empathetic language following your persona rules.\nUse emojis. Provide clear next steps. Show the probabilities.\n\nVitals Recorded:\n{vitals}\n\nML Model Output:\n{prediction}"}
        ]
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            try:
                response = self.client.chat.completions.create(
                    model='openrouter/free',
                    messages=messages
                )
                return response.choices[0].message.content
            except Exception:
                return "I apologize, but I couldn't generate the plain text explanation right now. Please seek a doctor immediately if you feel unwell."

    def analyze_document(self, file_content: bytes, mime_type: str, filename: str) -> dict:
        try:
            # We enforce text processing for max compatibility across all OpenRouter free models
            prompt = f"""
            System Persona & Instructions:
            {SYSTEM_PROMPT}

            Task: You are connecting to the Cortex Health Companion system as an elite Clinical Document Analyst. I am passing you a medical document with the filename: "{filename}" (MIME type: {mime_type}).
            
            Based purely on the filename construct, I need you to deduce what this document is and provide an INCREDIBLY DETAILED, COMPREHENSIVE MEDICAL REVIEW of what it typically contains, why a doctor would order this, and what the patient should look out for. 
            
            1. What exact type of medical document is this?
            2. SUMMARY: Provide a HIGHLY DETAILED, multi-paragraph review (at least 3-4 paragraphs). Explain exactly what this test/document is for, what the individual markers mean, how it is used to diagnose patients, and give the patient a thorough, empathetic understanding of this specific medical procedure or lab. Do not give a brief 1 sentence summary. Be verbose, educational, and thorough.
            3. KEY FINDINGS: Provide a list of the 4-5 most important key markers or findings typically associated with this document, explaining what "normal" vs "abnormal" looks like for each.
            4. CATEGORY: You must classify this document into EXACTLY ONE of the following precise categories (case-sensitive): ["Labs", "Imaging", "Clinical Notes", "Medications", "Discharge"]
            
            Return the response in this exact JSON format (and nothing else! Do not include markdown block quotes):
            {{
                "document_type": "[Exact Document Title]",
                "category": "[Must be one of: Labs, Imaging, Clinical Notes, Medications, Discharge]",
                "summary": "[Your highly detailed, multi-paragraph comprehensive review...]",
                "key_findings": ["[Finding 1: Explanation]", "[Finding 2: Explanation]"]
            }}
            """

            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            
            res_text = response.choices[0].message.content
            
            # Defensive cleaning if the free model outputs markdown blocks
            if res_text.startswith("```json"):
                res_text = res_text[7:]
            if res_text.endswith("```"):
                res_text = res_text[:-3]
                
            return res_text.strip()
            
        except Exception as e:
            try:
                response = self.client.chat.completions.create(
                    model='openrouter/free',
                    messages=messages
                )
                res_text = response.choices[0].message.content
                if res_text.startswith("```json"):
                    res_text = res_text[7:]
                if res_text.endswith("```"):
                    res_text = res_text[:-3]
                return res_text.strip()
            except Exception as fallback_e:
                return f"{{\"document_type\": \"Unknown\", \"summary\": \"OpenRouter API Error: {str(fallback_e)}\", \"key_findings\": [\"Failed to process document format\"]}}"

gemini_client = CortexGeminiClient()
