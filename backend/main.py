import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import create_tables

from scheduler import start_scheduler, stop_scheduler
from routers import search, backlog, wishlist, auth, hunter

from limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()        # crea las tablas si no existen (incluye RefreshToken)
    await start_scheduler()  # arranca el scheduler async en el mismo event loop
    yield
    await stop_scheduler()   # detiene el scheduler al apagar el servidor


app = FastAPI(title="Nexus API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Permite CORS dinámico según entorno
allowed_origins = []
if os.getenv("DEV_NO_AUTH") == "1" or os.getenv("ENV") == "development":
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
    ]
else:
    origins_env = os.getenv("ALLOWED_ORIGINS", "")
    if origins_env:
        allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip() and o.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router,   prefix="/api")
app.include_router(backlog.router,  prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(hunter.router,   prefix="/api", tags=["Hunter"])
app.include_router(auth.router,     prefix="/api/auth", tags=["Auth"])