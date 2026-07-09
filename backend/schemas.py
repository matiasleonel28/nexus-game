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
    owned_platform: Optional[str] = None   # pc | switch2 | xbox | ps5

# Lo que se manda para editar un juego (todo opcional: se actualiza lo que venga)
class UpdateStatusRequest(BaseModel):
    status: Optional[str] = None            # pendiente | jugando | completado | abandonado | wishlist
    owned_platform: Optional[str] = None    # pc | switch2 | xbox | ps5
    target_price: Optional[float] = None    # precio objetivo del Hunter
    watch_store: Optional[str] = None       # steam | eshop | xbox

# Lo que devuelve la API para cada juego guardado
class GameResponse(BaseModel):
    id:                       int
    igdb_id:                  int
    title:                    str
    cover_url:                Optional[str]
    platforms:                list[str]
    status:                   str
    owned_platform:           Optional[str] = None
    target_price:             Optional[float] = None
    watch_store:              Optional[str] = None
    eshop_nsuid:              Optional[str] = None
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

# --- Hunter ---
class AlertResponse(BaseModel):
    id:           int
    game_id:      int
    title:        str
    store:        str
    type:         str          # target_reached | historical_low
    price:        Optional[float]
    is_read:      bool
    triggered_at: datetime

    class Config:
        from_attributes = True