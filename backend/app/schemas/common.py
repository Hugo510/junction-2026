from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for all API models: Python snake_case in, camelCase JSON out."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    
class Reason(CamelModel):
    """Explains a score or recommendation. The app can translate `key` itself."""

    key: str
    text: str
    weight: float | None = None