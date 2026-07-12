from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
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
    owned_platform: Optional[Literal["pc", "switch2", "xbox", "ps5"]] = None   # pc | switch2 | xbox | ps5

# Lo que se manda para editar un juego (todo opcional: se actualiza lo que venga)
class UpdateGameRequest(BaseModel):
    status: Optional[Literal["backlog", "playing", "completed", "abandoned", "wishlist"]] = None
    owned_platform: Optional[Literal["pc", "switch2", "xbox", "ps5"]] = None
    hours_played: Optional[float] = Field(None, ge=0)
    enjoyment: Optional[int] = Field(None, ge=1, le=5)         # 1-5
    target_price: Optional[float] = Field(None, ge=0)    # precio objetivo del Hunter
    watch_store: Optional[Literal["steam", "eshop", "xbox"]] = None
    abandon_reason: Optional[str] = None

# Lo que devuelve la API para cada juego guardado
class GameResponse(BaseModel):
    id:                       int
    igdb_id:                  int
    title:                    str
    cover_url:                Optional[str]
    platforms:                list[str]
    status:                   str
    genres:                   Optional[str] = None
    owned_platform:           Optional[str] = None
    target_price:             Optional[float] = None
    watch_store:              Optional[str] = None
    eshop_nsuid:              Optional[str] = None
    hltb_main_hours:          Optional[float]
    hltb_completionist_hours: Optional[float]
    current_price:            Optional[float]
    lowest_price:             Optional[float]
    price_store:              Optional[str]
    price_currency:           Optional[str] = None
    has_coop:                 bool
    has_crossplay:            bool = False
    hours_played:             Optional[float] = None
    enjoyment:                Optional[int] = None
    cost_per_hour:            Optional[float] = None
    enjoyment_per_hour:       Optional[float] = None
    release_date:             Optional[datetime]
    recommendation_reason:    Optional[str] = None
    abandon_reason:           Optional[str] = None

    class Config:
        from_attributes = True  # permite leer desde objetos SQLAlchemy

class BacklogStatsResponse(BaseModel):
    counts: dict[str, int]
    abandoned_by_genre: dict[str, int]

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserResponse(BaseModel):
    id: int
    email: str
    available_hours_per_week: Optional[int] = None
    stress_level_tolerance: Optional[str] = None
    preferred_genres: Optional[str] = None
    onboarding_dismissed_count: Optional[int] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    available_hours_per_week: Optional[int] = None
    stress_level_tolerance: Optional[str] = None
    preferred_genres: Optional[str] = None
    onboarding_dismissed_count: Optional[int] = None

# Token ya no se usa en las respuestas (los tokens van en httpOnly cookies)
# Se mantiene por compatibilidad con código legado / tests
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(...)
    new_password: str = Field(..., min_length=8, max_length=128)

# --- Hunter ---
class AlertResponse(BaseModel):
    id:           int
    game_id:      int
    title:        str
    store:        str
    alert_type:   str          # target_reached | historical_low
    price:        Optional[float]
    is_read:      bool
    triggered_at: datetime

    class Config:
        from_attributes = True