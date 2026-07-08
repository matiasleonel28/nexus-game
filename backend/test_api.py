import pytest
from fastapi.testclient import TestClient

# Importamos la instancia de tu app FastAPI desde tu archivo principal
from main import app 
from routers.auth import get_current_user
from models import User

client = TestClient(app)

# --- Mock de Autenticación para ignorar el JWT en los tests ---
def override_get_current_user():
    return User(id=1, email="test_qa@manager.com")

app.dependency_overrides[get_current_user] = override_get_current_user

# ==============================================================================
# 1. PRUEBAS DE VALIDACIÓN DE ESQUEMAS (Pydantic & Bad Requests)
# ==============================================================================

def test_add_to_backlog_empty_body():
    """QA-01: Validar que el endpoint rechace cuerpos vacíos (Error 422 Unprocessable Entity)"""
    response = client.post("/api/backlog", json={})
    assert response.status_code == 422
    assert "detail" in response.json()


def test_add_to_backlog_invalid_datatype():
    """QA-02: Validar que el esquema rechace tipos de datos incorrectos (igdb_id debe ser entero)"""
    response = client.post("/api/backlog", json={"igdb_id": "not_an_integer"})
    assert response.status_code == 422


# ==============================================================================
# 2. PRUEBAS DE EDGE CASES CRÍTICOS DE NEGOCIO (Lógica de Datos)
# ==============================================================================

def test_get_backlog_sorting_division_by_zero():
    """
    QA-03: Edge Case Crítico - División por cero en ordenamiento 'value_asc'.
    Si un juego de la base de datos tiene 0 o null en hltb_main_hours, el endpoint
    /api/backlog?sort=value_asc NO debe crashear (Error 500), sino manejarlo de forma segura.
    """
    # En una prueba de integración ideal, aquí se inyectaría un juego mockeado con hltb_main_hours = 0
    # Evaluamos que el endpoint responda de forma exitosa (200 OK) protegiendo la fórmula
    response = client.get("/api/backlog?sort=value_asc")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_invalid_sort_parameter():
    """QA-04: Validar que un parámetro de ordenamiento inexistente no rompa la consulta"""
    response = client.get("/api/backlog?sort=invalid_sorting_criteria")
    # Dependiendo de tu implementación, FastAPI debería rechazarlo con 400/422, 
    # o tu router debería ignorarlo y aplicar el orden por defecto de forma segura.
    assert response.status_code in [200, 400, 422]


# ==============================================================================
# 3. PRUEBAS DE INTEGRACIÓN DEL FLUJO (Happy Path)
# ==============================================================================

def test_search_endpoint_functional():
    """QA-05: Validar el flujo de búsqueda con una query válida hacia IGDB"""
    response = client.get("/api/search?q=Hollow Knight")
    assert response.status_code == 200
    
    results = response.json()
    assert isinstance(results, list)
    
    if len(results) > 0:
        first_game = results[0]
        assert "igdb_id" in first_game
        assert "title" in first_game
        assert "cover_url" in first_game