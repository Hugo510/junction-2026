from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention={
        "ix": "ix_%(table_name)s_%(column_0_name)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    })


def include_application_object(obj, name, type_, reflected, compare_to):
    """Alembic bookkeeping is not application metadata.

    PostgreSQL reflects the default public schema as None. Exclude the technical
    table in either representation so autogenerate never proposes dropping it.
    This filter does not hide other schemas or application objects.
    """
    return not (
        type_ == "table" and name == "alembic_version" and reflected
        and compare_to is None and obj.schema in (None, "public")
    )
