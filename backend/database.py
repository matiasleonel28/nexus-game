from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./games.db"  # crea el archivo en la carpeta del proyecto

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # necesario para SQLite con FastAPI
)

SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

def create_tables():
    from models import Game, Platform, Price, User  # import acá para evitar circular
    Base.metadata.create_all(bind=engine)

# Dependency: le da una sesión de DB a cada endpoint y la cierra al terminar
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()