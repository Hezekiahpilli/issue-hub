from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./issuehub.db"  # SQLite for local dev
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # App
    PROJECT_NAME: str = "Issue Hub"
    API_V1_STR: str = "/api"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        # Accept empty/None → default
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return ["http://localhost:3000", "http://localhost:8000"]
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            v = value.strip()
            # JSON-style list
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass
            # Comma-separated string or single origin
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return value

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else [self.CORS_ORIGINS]

settings = Settings()
