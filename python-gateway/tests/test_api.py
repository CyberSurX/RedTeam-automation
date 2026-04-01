import pytest
from fastapi.testclient import TestClient
from api import app, orchestrator
import os
from unittest.mock import MagicMock

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_orchestrator(mocker):
    # Mock database, broker, cache so it doesn't crash on unit tests
    mocker.patch.object(orchestrator, 'initialize', return_value=True)
    orchestrator.db = MagicMock()
    orchestrator.broker = MagicMock()
    orchestrator.cache = MagicMock()
    orchestrator.dispatcher = MagicMock()
    
    # execute_mission will be mocked or we mock the inner calls
    orchestrator.db.store_mission.return_value = True
    orchestrator.cache.set_mission_status.return_value = True
    orchestrator.dispatcher.dispatch_web_scan.return_value = "task1"
    
    # We also need to patch ScopeValidator to always return True for testing
    mocker.patch('core.orchestrator_core.ScopeValidator.is_target_authorized', return_value=True)
    
def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_start_scan_unauthorized():
    response = client.post("/api/scan", json={"client_name": "Test", "targets": ["example.com"]})
    assert response.status_code in [401, 403]

def test_start_scan_authorized():
    headers = {"X-API-Key": os.getenv("API_KEY", "dev-secret-key")}
    payload = {
        "client_name": "Acme Corp",
        "targets": ["example.com"],
        "intensity": "normal",
        "modules": ["web_scanner"]
    }
    response = client.post("/api/scan", headers=headers, json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "started"
    assert "mission_id" in response.json()
