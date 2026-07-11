from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    region        = Column(String, default="AR")
    currency         = Column(String, default="ARS")
    available_hours_per_week = Column(Integer, nullable=True)
    stress_level_tolerance   = Column(String, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    games          = relationship("Game", back_populates="owner", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (
        # Previene duplicados de (igdb_id, user_id) ante requests concurrentes
        UniqueConstraint("igdb_id", "user_id", name="uq_game_user"),
    )

    id                       = Column(Integer, primary_key=True)
    user_id                  = Column(Integer, ForeignKey("users.id"), index=True)
    igdb_id                  = Column(Integer, nullable=False)
    title                    = Column(String, nullable=False)
    cover_url                = Column(String)
    release_date             = Column(DateTime)
    status                   = Column(String, default="backlog")
    owned_platform           = Column(String)
    genres                   = Column(String)  # Almacena string separado por comas
    hltb_main_hours          = Column(Float)
    hltb_completionist_hours = Column(Float)
    has_coop                 = Column(Boolean, default=False)

    target_price             = Column(Float)
    watch_store              = Column(String)
    eshop_nsuid              = Column(String)
    created_at               = Column(DateTime(timezone=True), server_default=func.now())

    owner     = relationship("User", back_populates="games")
    platforms = relationship("Platform", back_populates="game", cascade="all, delete-orphan")
    prices    = relationship("Price",    back_populates="game", cascade="all, delete-orphan")


class Platform(Base):
    __tablename__ = "game_platforms"

    id            = Column(Integer, primary_key=True)
    game_id       = Column(Integer, ForeignKey("games.id"), index=True)
    platform_name = Column(String)

    game = relationship("Game", back_populates="platforms")


class Alert(Base):
    __tablename__ = "alerts"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), index=True)
    game_id      = Column(Integer, ForeignKey("games.id"), index=True)
    store        = Column(String)
    alert_type   = Column(String)   # target_reached | historical_low  (renombrado de 'type' para evitar shadow del builtin)
    price        = Column(Float)
    is_read      = Column(Boolean, default=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())

    game = relationship("Game")


class Price(Base):
    __tablename__ = "game_prices"

    id            = Column(Integer, primary_key=True)
    game_id       = Column(Integer, ForeignKey("games.id"), index=True)
    store_name    = Column(String)
    current_price = Column(Float)
    lowest_price  = Column(Float)
    currency      = Column(String, default="ARS")
    updated_at    = Column(DateTime(timezone=True), server_default=func.now())

    game = relationship("Game", back_populates="prices")


class RefreshToken(Base):
    """
    Persiste los refresh tokens activos por usuario.
    Permite refresh token rotation: al hacer refresh, el token anterior
    se invalida y se emite uno nuevo. Un token robado queda inutilizable.
    """
    __tablename__ = "refresh_tokens"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    token_hash = Column(String, unique=True, nullable=False)  # SHA-256 del token
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked    = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")
