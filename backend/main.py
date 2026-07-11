from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import create_tables
from scheduler import start_scheduler, stop_scheduler
from routers import search, backlog, wishlist, auth, hunter


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()        # crea las tablas si no existen (incluye RefreshToken)
    await start_scheduler()  # arranca el scheduler async en el mismo event loop
    yield
    await stop_scheduler()   # detiene el scheduler al apagar el servidor


app = FastAPI(title="Nexus API", lifespan=lifespan)

# Permite que el frontend en localhost:5173/5174 consuma la API con cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Puerto por defecto de Vite
        "http://localhost:5174",  # Puerto alternativo de Vite
    ],
    allow_credentials=True,   # Requerido para que el browser envíe cookies cross-origin
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router,   prefix="/api")
app.include_router(backlog.router,  prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(hunter.router,   prefix="/api", tags=["Hunter"])
app.include_router(auth.router,     prefix="/api/auth", tags=["Auth"])