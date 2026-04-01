from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List, Optional
import os

from core.orchestrator_core import OrchestratorCore, MissionConfig, ScopeAgreement
from datetime import datetime, timezone, timedelta
import uuid

app = FastAPI(title="RedTeam Automation API", description="Core Orchestrator API")

API_KEY = os.getenv("API_KEY", "dev-secret-key")
api_key_header = APIKeyHeader(name="X-API-Key")

def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key_header

orchestrator = OrchestratorCore()

@app.on_event("startup")
def startup_event():
    # Attempt to initialize, but don't crash if DB is not up (for testing)
    orchestrator.initialize()

class MissionRequest(BaseModel):
    client_name: str
    targets: List[str]
    intensity: str = "normal"
    modules: List[str] = ["web_scanner"]

@app.post("/api/scan", dependencies=[Depends(get_api_key)])
def start_scan(request: MissionRequest):
    mission_id = str(uuid.uuid4())
    
    # Create a mock scope agreement for the API request
    scope = ScopeAgreement(
        agreement_id=str(uuid.uuid4()),
        client_name=request.client_name,
        targets=request.targets,
        excluded_targets=[],
        start_time=datetime.now(timezone.utc) - timedelta(days=1),
        end_time=datetime.now(timezone.utc) + timedelta(days=30),
        authorized_tests=request.modules,
        sha256_hash="dummy" # This would be computed properly in real logic
    )
    
    mission = MissionConfig(
        mission_id=mission_id,
        mission_name=f"Scan-{mission_id[:8]}",
        scope_agreement=scope,
        scan_intensity=request.intensity,
        modules_enabled=request.modules,
        notification_endpoints=[]
    )
    
    success = orchestrator.execute_mission(mission)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start mission")
        
    return {"status": "started", "mission_id": mission_id}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "orchestrator_initialized": orchestrator.db is not None}
