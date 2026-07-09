"""
Módulo Hunter — precios y ofertas (Steam / eShop / Xbox) vía IsThereAnyDeal.

Por ahora expone la consulta de precios y un endpoint de diagnóstico. Sobre esto,
una vez verificado que ITAD devuelve datos reales en ARS, se construyen los
"price watches" y las alertas.
"""
from fastapi import APIRouter, HTTPException, Depends
from routers.auth import get_current_user
from models import User
from services import itad

router = APIRouter()


@router.get("/hunter/prices")
async def hunter_prices(title: str, current_user: User = Depends(get_current_user)):
    """Precio actual + mínimo histórico por tienda para un título (en ARS)."""
    try:
        data = await itad.get_prices(title)
    except itad.ITADError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {"title": title, "stores": data}


@router.get("/hunter/raw")
async def hunter_raw(title: str, current_user: User = Depends(get_current_user)):
    """Diagnóstico: respuestas crudas de ITAD para verificar el parseo."""
    try:
        return await itad.get_raw(title)
    except itad.ITADError as e:
        raise HTTPException(status_code=503, detail=str(e))
