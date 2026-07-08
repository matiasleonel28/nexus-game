from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Lo que devuelve el buscador (viene de IGDB, aún no está en DB)
class SearchResult(BaseModel):
    igdb_id:    int
    title:      str
    cover_url:  Optional[str]
    platforms:  list[str]
    has_coop:   bool
    release_date: Optional[datetime]

# Lo que se manda para agregar un juego
class AddGameRequest(BaseModel):
    igdb_id: int

# Lo que se manda para cambiar estado
class UpdateStatusRequest(BaseModel):
    status: str   # 'backlog' | 'wishlist' | 'finished' | 'waiting_sale'

# Lo que devuelve la API para cada juego guardado
class GameResponse(BaseModel):
    id:                       int
    igdb_id:                  int
    title:                    str
    cover_url:                Optional[str]
    platforms:                list[str]
    status:                   str
    hltb_main_hours:          Optional[float]
    hltb_completionist_hours: Optional[float]
    current_price:            Optional[float]
    lowest_price:             Optional[float]
    price_store:              Optional[str]
    has_coop:                 bool
    release_date:             Optional[datetime]

    class Config:
        from_attributes = True  # permite leer desde objetos SQLAlchemy

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str