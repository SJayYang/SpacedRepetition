import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Get the root directory (two levels up from this file)
ROOT_DIR = Path(__file__).parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    database_url: str
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = False


settings = Settings()
