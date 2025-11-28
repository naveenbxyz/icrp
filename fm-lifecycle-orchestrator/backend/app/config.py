from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # LLM Configuration
    llm_api_key: str = ""
    llm_api_endpoint: str = "https://api.openai.com/v1"  # OpenAI-compatible endpoint
    llm_model: str = "gpt-4o-mini"
    llm_enabled: bool = False  # Set to True to use real LLM instead of simulation

    # Legacy OpenAI fields (kept for backward compatibility)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Application Configuration
    database_url: str = "sqlite:///./fm_orchestrator.db"
    upload_dir: str = "./uploads"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated string to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
