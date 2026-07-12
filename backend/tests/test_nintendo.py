import pytest
from unittest.mock import patch, MagicMock
from services.nintendo import get_eshop_price

# Payload real de ejemplo de la eShop de Nintendo para Argentina (ARS)
# Juego en oferta (ej. Hollow Knight u otro)
MOCK_ESHOP_RESPONSE = {
    "prices": [
        {
            "title_id": 70010000000000,
            "sales_status": "onsale",
            "regular_price": {
                "amount": "$ 1000,00",
                "currency": "ARS",
                "raw_value": "1000.00"
            },
            "discount_price": {
                "amount": "$ 750,00",
                "currency": "ARS",
                "raw_value": "750.00",
                "start_datetime": "2023-01-01T00:00:00Z",
                "end_datetime": "2023-01-15T00:00:00Z"
            }
        }
    ]
}

@pytest.mark.asyncio
@patch("services.nintendo.aiohttp.ClientSession.get")
async def test_get_eshop_price_with_discount(mock_get):
    """
    Verifica que el parsing extraiga correctamente el descuento y calcule
    el porcentaje en base a un payload simulado en ARS de Nintendo.
    """
    # Mockear la respuesta asíncrona de aiohttp
    mock_response = MagicMock()
    mock_response.status = 200
    
    # Creamos un future-like object para el await json()
    async def mock_json():
        return MOCK_ESHOP_RESPONSE
    mock_response.json = mock_json
    
    # ClientSession.get retorna un context manager asíncrono
    mock_ctx_mgr = MagicMock()
    mock_ctx_mgr.__aenter__.return_value = mock_response
    mock_get.return_value = mock_ctx_mgr

    # Ejecutar la función
    result = await get_eshop_price("70010000000000", "AR", "es")
    
    # Verificar el resultado esperado
    assert result is not None
    assert result["currency"] == "ARS"
    assert result["regular"] == 1000.0
    assert result["current"] == 750.0
    # cut = 1 - (750 / 1000) = 0.25 -> 25%
    assert result["cut"] == 25
    assert result["lowest"] is None
