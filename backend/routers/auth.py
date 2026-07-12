"""
Router de autenticación — estrategia de seguridad:

- Access token: JWT de 60 min en cookie httpOnly (inaccesible desde JS).
- Refresh token: JWT de 7 días en cookie httpOnly + registro en DB (RefreshToken).
- Refresh token rotation: cada /refresh invalida el token anterior y emite uno nuevo.
  Un token robado queda inutilizable la primera vez que se intenta reusar.
- "Recordarme": si remember_me=true → cookies persistentes (max_age); si false →
  cookies de sesión (se borran al cerrar el browser).
- DEV_NO_AUTH=1: bypass total para desarrollo local.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
import jwt
import hashlib
from datetime import timedelta, datetime, timezone
from typing import Optional, cast

from database import get_db
from schemas import UserCreate, UserResponse, UserUpdate, ForgotPasswordRequest, ResetPasswordRequest
from models import User, RefreshToken
from security import (
    verify_password, hash_password, create_access_token, create_refresh_token,
    SECRET_KEY, ALGORITHM, REFRESH_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_password_reset_token, verify_password_reset_token
)
from limiter import limiter

router = APIRouter()

# ── Constantes de cookie ──────────────────────────────────────────────────────

COOKIE_ACCESS   = "access_token"
COOKIE_REFRESH  = "refresh_token"
COOKIE_SAMESITE = "lax"    # Compatible con Vite dev en localhost:5173
COOKIE_SECURE   = os.getenv("COOKIE_SECURE", "false").lower() == "true"  # True solo en HTTPS


# ── Helpers de cookie ─────────────────────────────────────────────────────────

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, remember: bool) -> None:
    """Establece las cookies httpOnly de access y refresh token."""
    max_age_access  = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    max_age_refresh = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600

    common = dict(httponly=True, samesite=COOKIE_SAMESITE, secure=COOKIE_SECURE, path="/")

    response.set_cookie(COOKIE_ACCESS, access_token,
                        max_age=max_age_access, **common)
    response.set_cookie(COOKIE_REFRESH, refresh_token,
                        max_age=max_age_refresh if remember else None, **common)


def _clear_auth_cookies(response: Response) -> None:
    """Elimina las cookies de autenticación."""
    response.delete_cookie(COOKIE_ACCESS,  path="/")
    response.delete_cookie(COOKIE_REFRESH, path="/")


def _hash_token(token: str) -> str:
    """SHA-256 del token para guardarlo en DB sin exponer el valor real."""
    return hashlib.sha256(token.encode()).hexdigest()


# ── Dependency: usuario actual ────────────────────────────────────────────────

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # --- Bypass SOLO para desarrollo local (activar con DEV_NO_AUTH=1) ---
    # Permite probar la app sin login. Usa un usuario fijo "dev@local".
    # En producción NO se define esta variable y la auth funciona normal.
    if os.getenv("DEV_NO_AUTH") == "1":
        # En dev-mode, si hay un token en cookie lo verificamos igual.
        # Si no hay ninguno, usamos dev@local.
        token = request.cookies.get(COOKIE_ACCESS)
        if not token:
            dev_user = db.query(User).filter(User.email == "dev@local").first()
            if dev_user is None:
                dev_user = User(email="dev@local", password_hash=hash_password("dev"))
                db.add(dev_user)
                db.commit()
                db.refresh(dev_user)
            return dev_user
    # ---------------------------------------------------------------------

    token = request.cookies.get(COOKIE_ACCESS)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not isinstance(email, str):
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_users_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.available_hours_per_week is not None:
        current_user.available_hours_per_week = user_update.available_hours_per_week
    if user_update.stress_level_tolerance is not None:
        current_user.stress_level_tolerance = user_update.stress_level_tolerance
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me")
@limiter.limit("5/minute")
def delete_users_me(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Elimina la cuenta del usuario y todos sus datos en cascada."""
    db.delete(current_user)
    db.commit()
    _clear_auth_cookies(response)
    return {"message": "Cuenta eliminada exitosamente."}


@router.get("/me/export")
@limiter.limit("5/minute")
def export_users_me(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Devuelve todos los datos del usuario en formato JSON."""
    user_data = {
        "email": current_user.email,
        "region": current_user.region,
        "currency": current_user.currency,
        "available_hours_per_week": current_user.available_hours_per_week,
        "stress_level_tolerance": current_user.stress_level_tolerance,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "games": [],
        "alerts": []
    }
    
    for game in current_user.games:
        game_data = {
            "igdb_id": game.igdb_id,
            "title": game.title,
            "status": game.status,
            "owned_platform": game.owned_platform,
            "hours_played": game.hours_played,
            "enjoyment": game.enjoyment,
            "target_price": game.target_price,
            "watch_store": game.watch_store,
            "added_at": game.created_at.isoformat() if game.created_at else None,
        }
        user_data["games"].append(game_data)
        
    for alert in current_user.alerts:
        alert_data = {
            "game_id": alert.game_id,
            "store": alert.store,
            "alert_type": alert.alert_type,
            "price": alert.price,
            "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None,
        }
        user_data["alerts"].append(alert_data)
        
    return user_data


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
def register(
    request: Request,
    user_data: UserCreate,
    response: Response,
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    new_user = User(email=user_data.email, password_hash=hash_password(user_data.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token  = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})
    _store_refresh_token(db, new_user.id, refresh_token)

    # Registro siempre recuerda (cookie persistente)
    _set_auth_cookies(response, access_token, refresh_token, remember=True)
    return new_user


@router.post("/login", response_model=UserResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """
    Login con form-data (OAuth2PasswordRequestForm).
    Campo: username (email), password, + parámetro opcional remember_me en query string.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, cast(str, user.password_hash or "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # remember_me viene como campo extra del form (scopes field se ignora, usamos el primero)
    remember = "remember_me" in (form_data.scopes or []) or \
               form_data.client_id == "remember"  # fallback por si el frontend lo pasa distinto

    access_token  = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    _store_refresh_token(db, user.id, refresh_token)

    _set_auth_cookies(response, access_token, refresh_token, remember=remember)
    return user


@router.post("/refresh", response_model=UserResponse)
def refresh_token_endpoint(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Refresh token rotation:
    1. Lee el refresh token de la cookie httpOnly.
    2. Lo verifica en DB (que no esté revocado ni expirado).
    3. Lo invalida (revoca en DB).
    4. Emite nuevos access + refresh tokens (rotation).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token de refresco",
        headers={"WWW-Authenticate": "Bearer"},
    )

    raw_refresh = request.cookies.get(COOKIE_REFRESH)
    if not raw_refresh:
        raise credentials_exception

    try:
        payload = jwt.decode(raw_refresh, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not isinstance(email, str):
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    # Verificar que el token existe en DB y no está revocado
    token_hash = _hash_token(raw_refresh)
    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user.id,
        RefreshToken.revoked == False,  # noqa: E712
    ).first()

    if not stored or stored.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        # Token no encontrado o expirado → posible ataque de reuse
        # Revocar TODOS los tokens del usuario como medida de seguridad
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"revoked": True})
        db.commit()
        raise credentials_exception

    # Revocar el token actual (rotation)
    stored.revoked = True
    db.commit()

    # Emitir nuevos tokens
    new_access  = create_access_token(data={"sub": user.email})
    new_refresh = create_refresh_token(data={"sub": user.email})
    _store_refresh_token(db, user.id, new_refresh)

    # Mantener la persistencia de la cookie refresh anterior
    remember = stored.expires_at is not None  # si tenía max_age, mantenerla persistente
    _set_auth_cookies(response, new_access, new_refresh, remember=remember)
    return user


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Cierra la sesión revocando el refresh token en DB y limpiando las cookies."""
    raw_refresh = request.cookies.get(COOKIE_REFRESH)
    if raw_refresh:
        token_hash = _hash_token(raw_refresh)
        stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if stored:
            stored.revoked = True
            db.commit()

    _clear_auth_cookies(response)
    return {"message": "Sesión cerrada correctamente."}


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, request_body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request_body.email).first()
    # Por seguridad, no revelamos si el email existe o no.
    # Siempre devolvemos una respuesta exitosa.
    if user:
        password_reset_token = create_password_reset_token(email=request_body.email)
        reset_link = f"http://localhost:5173/reset-password/{password_reset_token}"
        print("--- ENLACE DE RESETEO DE CONTRASEÑA (SOLO PARA DESARROLLO) ---")
        print(reset_link)
        print("-------------------------------------------------------------")

    return {"message": "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña."}


@router.post("/reset-password")
def reset_password(request_body: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_password_reset_token(token=request_body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    setattr(user, 'password_hash', hash_password(request_body.new_password))

    # Revocar todos los refresh tokens al resetear la contraseña (seguridad)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"revoked": True})

    db.commit()
    return {"message": "Contraseña actualizada exitosamente."}


# ── Helpers privados ──────────────────────────────────────────────────────────

def _store_refresh_token(db: Session, user_id: int, raw_token: str) -> RefreshToken:
    """Guarda un hash del refresh token en DB con su fecha de expiración."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(
        user_id    = user_id,
        token_hash = _hash_token(raw_token),
        expires_at = expires_at,
        revoked    = False,
    )
    db.add(rt)
    db.commit()
    return rt