from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import heat

app = FastAPI(
    title="NabhaSense API",
    description="Urban Heat Mitigation AI/ML System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://nabha-sense.vercel.app",
        "https://nabha-sense-bi4a0tojv-dashami-jituri-s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(heat.router, prefix="/heat", tags=["heat"])

@app.get("/")
async def root():
    return {
        "message": "NabhaSense API running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}