from alembic import context
from sqlalchemy.pool import NullPool

from app.db.base import Base, include_application_object
from app.db.config import TARGET_SCHEMA
from app.db import models  # noqa: F401 - register all nine tables


def run_offline():
    # Deliberately no settings, engine, credentials, or network access.
    context.configure(dialect_name="postgresql", target_metadata=Base.metadata,
                      literal_binds=True, dialect_opts={"paramstyle": "named"},
                      compare_type=True, transactional_ddl=True, version_table_schema=TARGET_SCHEMA)
    with context.begin_transaction():
        context.run_migrations()


def run_online():
    from sqlalchemy import create_engine
    from app.db.config import DatabaseSettings
    settings = DatabaseSettings()
    if settings.name != "Hiillos":
        raise RuntimeError("Alembic target database must be Hiillos")
    engine = create_engine(settings.url(), connect_args=settings.connect_args(),
                           poolclass=NullPool, echo=False, hide_parameters=True)
    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=Base.metadata,
                              compare_type=True, compare_server_default=True, version_table_schema=TARGET_SCHEMA,
                              include_object=include_application_object)
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_offline()
else:
    run_online()
