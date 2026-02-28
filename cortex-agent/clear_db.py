import os
import firebase_admin
from firebase_admin import credentials, firestore

cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    print("Fetching users to clear raw JSON strings from DB...")
    users = db.collection('users').stream()
    for user in users:
        print(f"Clearing user {user.id} documents...")
        docs = db.collection('users').document(user.id).collection('documents').stream()
        count = 0
        for doc in docs:
            doc.reference.delete()
            count += 1
        print(f"Deleted {count} documents.")
except Exception as e:
    print(f"Error: {e}")
