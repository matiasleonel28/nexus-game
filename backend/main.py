from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import create_tables
from scheduler import start_scheduler
from routers import search, backlog, wishlist, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()       # crea las tablas si no existen
    start_scheduler()     # arranca el cron job
    yield

app = FastAPI(title="GameManager API", lifespan=lifespan)

# Permite que el frontend en localhost:5173 consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router,   prefix="/api")
app.include_router(backlog.router,  prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(auth.router,     prefix="/api/auth", tags=["Auth"])