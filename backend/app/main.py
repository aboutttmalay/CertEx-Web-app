from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints

app = FastAPI(title="CertEx API")

# Enable CORS (So React localhost:3000 can talk to FastAPI localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], # Allow your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routes
app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "CertEx Engine Online"}