import firebase_admin
from firebase_admin import credentials, auth
import os

SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

if not SERVICE_ACCOUNT_PATH:
    raise ValueError("Firebase service account path is not configured")

cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

print("Firebase Admin SDK initialized successfully!")