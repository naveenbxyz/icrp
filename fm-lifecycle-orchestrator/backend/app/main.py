from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import engine, Base
from .api import clients, onboarding, regulatory, documents, tasks, integrations, regimes, document_requirements, chat, insights, cx_approval
import os

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)
os.makedirs("sample_documents", exist_ok=True)

app = FastAPI(
    title="FM Client Lifecycle Orchestrator",
    description="Financial Markets Client Onboarding and Regulatory Classification Management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clients.router)
app.include_router(onboarding.router)
app.include_router(regulatory.router)
app.include_router(documents.router)
app.include_router(tasks.router)
app.include_router(integrations.router)
app.include_router(regimes.router)
app.include_router(document_requirements.router)
app.include_router(chat.router)
app.include_router(insights.router)
app.include_router(cx_approval.router)


@app.get("/")
def root():
    return {
        "message": "FM Client Lifecycle Orchestrator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Mount static file directories for serving uploaded documents and samples
# This allows the frontend to access PDFs via HTTP
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/sample_documents", StaticFiles(directory="sample_documents"), name="sample_documents")
