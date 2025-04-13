from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from backend.sync_to_sheets import sync_to_google_sheets

app = FastAPI()

# Allow CORS for Streamlit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Lead(BaseModel):
    name: str
    phone: str
    note: str
    timestamp: str

@app.post("/sync")
async def sync_leads(leads: list[Lead]):
    try:
        lead_dicts = [lead.dict() for lead in leads]
        sync_to_google_sheets(lead_dicts)
        return JSONResponse(content={"message": "Leads synced"}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
