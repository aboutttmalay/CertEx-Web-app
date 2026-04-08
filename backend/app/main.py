from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.config import settings

app = FastAPI(title=settings.APP_NAME)

# Enable CORS (So React localhost:3000 can talk to FastAPI localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routes
app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "CertEx Engine Online"}