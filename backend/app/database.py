import os
from prisma import Prisma
from contextlib import asynccontextmanager
from .config import settings

# Ensure DATABASE_URL is set in environment for Prisma
# Prisma reads from env("DATABASE_URL") in schema.prisma
os.environ["DATABASE_URL"] = settings.database_url

# Global Prisma client instance
# Prisma will read DATABASE_URL from environment
db = Prisma()


async def connect_db():
    """Connect to the database."""
    if not db.is_connected():
        await db.connect()


async def disconnect_db():
    """Disconnect from the database."""
    if db.is_connected():
        await db.disconnect()


@asynccontextmanager
async def get_db():
    """Context manager for database sessions."""
    await connect_db()
    try:
        yield db
    finally:
        pass  # Keep connection alive for reuse
