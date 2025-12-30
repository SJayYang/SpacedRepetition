from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.collections.router import router as collections_router
from app.items.router import router as items_router
from app.reviews.router import router as reviews_router
from app.analytics.router import router as analytics_router
from app.presets.router import router as presets_router
from app.database import connect_db, disconnect_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to database
    await connect_db()
    yield
    # Shutdown: Disconnect from database
    await disconnect_db()


app = FastAPI(
    title="SpaceRep API",
    description="Spaced repetition scheduling for LeetCode and more",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(collections_router, prefix="/api/collections", tags=["collections"])
app.include_router(items_router, prefix="/api/items", tags=["items"])
app.include_router(reviews_router, prefix="/api/reviews", tags=["reviews"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(presets_router, prefix="/api/presets", tags=["presets"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
