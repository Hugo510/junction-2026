"""Explicit factories only. Importing this module never opens a connection."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.config import DatabaseSettings


def build_engine(settings: DatabaseSettings):
    return create_engine(settings.url(), connect_args=settings.connect_args(),
                         pool_pre_ping=True, pool_size=2, max_overflow=2,
                         echo=False, hide_parameters=True)


def build_session_factory(settings: DatabaseSettings):
    return sessionmaker(bind=build_engine(settings), expire_on_commit=False)
