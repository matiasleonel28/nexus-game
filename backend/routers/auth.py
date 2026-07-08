from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
import jwt

from database import get_db
from schemas import UserCreate, Token
from models import User
from security import verify_password, hash_password, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter()

# auto_error=False permite que el token sea opcional para poder aplicar el
# bypass de desarrollo de abajo. Con DEV_NO_AUTH apagado el comportamiento es
# idéntico al original (token faltante => 401).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # --- Bypass SOLO para desarrollo local (activar con DEV_NO_AUTH=1) ---
    # Permite probar la app sin login. Usa un usuario fijo "dev@local".
    # En producción NO se define esta variable y la auth funciona normal.
    if os.getenv("DEV_NO_AUTH") == "1" and not token:
        dev_user = db.query(User).filter(User.email == "dev@local").first()
        if dev_user is None:
            dev_user = User(email="dev@local", password_hash=hash_password("dev"))
            db.add(dev_user)
            db.commit()
            db.refresh(dev_user)
        return dev_user
    # ---------------------------------------------------------------------

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    new_user = User(email=user_data.email, password_hash=hash_password(user_data.password))
    db.add(new_user)
    db.commit()
    
    token = create_access_token(data={"sub": user_data.email})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}