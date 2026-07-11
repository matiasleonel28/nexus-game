import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
import jwt

# Configuración del esquema de hashing (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Algoritmo (no es secreto, puede tener default) ---
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "15"))

# --- Secretos JWT: REQUERIDOS en producción ---
# En modo DEV_NO_AUTH=1 se permiten valores de desarrollo para no bloquear el workflow local.
# En cualquier otro entorno, si faltan, el proceso falla en startup (no silenciosamente).

def _require_secret(key: str, dev_default: str) -> str:
    """
    Lee una variable de entorno requerida para la seguridad JWT.
    - En modo DEV_NO_AUTH=1: acepta el valor por defecto de desarrollo.
    - En cualquier otro entorno: falla al startup si la variable no está definida.
    """
    value = os.getenv(key)
    if value:
        return value
    if os.getenv("DEV_NO_AUTH") == "1":
        # Solo permitido en desarrollo local; se loguea un aviso claro
        print(f"\u26a0\ufe0f  AVISO DEV: {key} no está definida. Usando valor de desarrollo (solo válido con DEV_NO_AUTH=1).")
        return dev_default
    raise RuntimeError(
        f"Variable de entorno requerida no encontrada: {key}\n"
        f"Definila en backend/.env antes de arrancar el servidor.\n"
        f"(Copiá backend/.env.example y completá los valores.)"
    )

SECRET_KEY = _require_secret(
    "SECRET_KEY",
    "dev_super_secret_key_ONLY_for_DEV_NO_AUTH_mode"
)
REFRESH_SECRET_KEY = _require_secret(
    "REFRESH_SECRET_KEY",
    "dev_super_secret_refresh_key_ONLY_for_DEV_NO_AUTH_mode"
)
PASSWORD_RESET_SECRET_KEY = _require_secret(
    "PASSWORD_RESET_SECRET_KEY",
    "dev_super_secret_reset_key_ONLY_for_DEV_NO_AUTH_mode"
)


def hash_password(password: str) -> str:
    """Genera el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que la contraseña en texto plano coincida con el hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Firma y genera un token JWT de acceso.

    Args:
        data (dict): Payload a encriptar en el token (ej: {"sub": "user@email.com"}).
        expires_delta (timedelta, optional): Tiempo de vida del token.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Firma y genera un token JWT de refresco."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def create_password_reset_token(email: str) -> str:
    """Genera un token JWT específico para el reseteo de contraseña."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": email,
        "scope": "password_reset",  # Diferencia este token de access/refresh
    }
    return jwt.encode(to_encode, PASSWORD_RESET_SECRET_KEY, algorithm=ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verifica un token de reseteo y devuelve el email si es válido."""
    try:
        decoded_token = jwt.decode(token, PASSWORD_RESET_SECRET_KEY, algorithms=[ALGORITHM])
        if decoded_token.get("scope") == "password_reset":
            return decoded_token.get("sub")
    except jwt.InvalidTokenError:
        return None
    return None
