from app.schemas.care import CrisisResource

# Verify every number with your mentors before the demo. verified stays False until then.
CRISIS_RESOURCES: dict[str, list[CrisisResource]] = {
    "FI": [
        CrisisResource(
            id="fi_emergency",
            name_key="crisis.emergency_number",
            phone="112",
            available="24/7",
            verified=False,
        ),
        CrisisResource(
            id="fi_crisis_line",
            name_key="crisis.crisis_line",
            phone="09 2525 0111",
            available="24/7",
            verified=False,
        ),
    ],
}


def crisis_resources_for(country: str) -> list[CrisisResource]:
    return CRISIS_RESOURCES.get(country.upper(), CRISIS_RESOURCES["FI"])