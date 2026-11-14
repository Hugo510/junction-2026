from fastapi import APIRouter, Query

from app.schemas.care import CrisisResource
from app.services.crisis import crisis_resources_for

router = APIRouter(tags=["care"])


@router.get("/crisis-resources", response_model=list[CrisisResource])
def get_crisis_resources(country: str = Query(default="FI")):
    return crisis_resources_for(country)