from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    games         = relationship("Game", back_populates="owner", cascade="all, delete-orphan")

class Game(Base):
    __tablename__ = "games"

    id                      = Column(Integer, primary_key=True)
    user_id                 = Column(Integer, ForeignKey("users.id"))
    igdb_id                 = Column(Integer, nullable=False)
    title                   = Column(String, nullable=False)
    cover_url               = Column(String)          # URL cruda de IGDB
    release_date            = Column(DateTime)
    status                  = Column(String, default="pendiente")
    # wishlist | pendiente | jugando | completado | abandonado
    owned_platform          = Column(String)   # tu copia: pc | switch2 | xbox | ps5

    hltb_main_hours         = Column(Float)           # duración historia principal
    hltb_completionist_hours = Column(Float)          # duración 100%

    has_coop                = Column(Boolean, default=False)
    has_splitscreen         = Column(Boolean, default=False)

    created_at              = Column(DateTime, default=datetime.utcnow)

    owner     = relationship("User", back_populates="games")
    platforms = relationship("Platform", back_populates="game",
                             cascade="all, delete-orphan")
    prices    = relationship("Price",    back_populates="game",
                             cascade="all, delete-orphan")


class Platform(Base):
    __tablename__ = "game_platforms"

    id            = Column(Integer, primary_key=True)
    game_id       = Column(Integer, ForeignKey("games.id"))
    platform_name = Column(String)   # 'PC', 'PS5', 'Switch', etc.

    game = relationship("Game", back_populates="platforms")


class Price(Base):
    __tablename__ = "game_prices"

    id            = Column(Integer, primary_key=True)
    game_id       = Column(Integer, ForeignKey("games.id"))
    store_name    = Column(String)   # 'Steam', 'PSN', 'eShop'
    current_price = Column(Float)
    lowest_price  = Column(Float)
    currency      = Column(String, default="USD")
    updated_at    = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="prices")