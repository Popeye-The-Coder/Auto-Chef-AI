import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.database.session import engine, Base
from backend.app.models import entities  # ensure models registered

# Ensure DB tables created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="An Intelligent Ingredient Recognition and Personalized Recipe Recommendation System Using Machine Learning and Deep Learning.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health & root endpoints MUST be registered BEFORE static-file mounts ──────
@app.get("/health", tags=["System"])
def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": "AutoChef Core ML API",
        "version": "1.0.0",
        "database": "sqlite_ready",
    })

@app.get("/api-info", tags=["System"])
def api_info():
    return {
        "message": "Welcome to AutoChef API — Intelligent Ingredient Recognition & Recipe Recommendation System",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "health": "/health",
    }

# Mount static uploads directory
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include versioned API router  (/api/v1/...)
app.include_router(api_router, prefix=settings.API_V1_STR)

# ── Serve compiled frontend (must come LAST so API routes are not shadowed) ───
frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../frontend/dist")
)
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "message": "AutoChef API is running. Frontend not built yet.",
            "docs": "/docs",
            "api_v1": settings.API_V1_STR,
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)

