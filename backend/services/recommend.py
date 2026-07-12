import json
import random
from datetime import datetime
from sqlalchemy.orm import Session
from models import Game, User
from schemas import GameResponse
from routers.backlog import _to_response

# Géneros considerados de mayor estrés o frustración
HIGH_STRESS_GENRES = [
    "Fighting", 
    "Platform", 
    "Shooter", 
    "Hack and slash/Beat 'em up", 
    "Tactical",
    "Souls-like"
]

def get_recommendation(db: Session, current_user: User) -> list[GameResponse]:
    """
    Devuelve recomendaciones personalizadas del backlog (status='backlog')
    basadas en las preferencias del usuario.
    """
    query = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.status == "backlog"
    )
    games = query.all()

    if not games:
        return []

    filtered_games = games

    # Si la tolerancia al estrés es baja, filtramos géneros frustrantes
    if current_user.stress_level_tolerance == "baja":
        def is_low_stress(g: Game) -> bool:
            if not g.genres:
                return True
            game_genres = [x.strip() for x in g.genres.split(",")]
            for hsg in HIGH_STRESS_GENRES:
                if hsg in game_genres:
                    return False
            return True
        
        filtered_games = [g for g in filtered_games if is_low_stress(g)]

    # Si no queda ninguno tras el filtro (ej: todos son de estrés alto), usamos todos
    if not filtered_games:
        filtered_games = games

    # Evaluar constraints de tiempo
    is_time_constrained = current_user.available_hours_per_week is not None and current_user.available_hours_per_week < 15

    # Géneros preferidos
    preferred = []
    if current_user.preferred_genres:
        try:
            preferred = json.loads(current_user.preferred_genres)
        except Exception:
            pass

    # Ordenar por:
    # 1. Menos horas (si time_constrained)
    # 2. Preferidos (si los hay)
    # 3. Factor diario de rotación
    daily_seed = datetime.now().date().toordinal()

    def sort_key(g: Game):
        random.seed(f"{daily_seed}_{g.id}")
        random_factor = random.random() * 20  # factor aleatorio hasta 20
        
        hours = g.hltb_main_hours or 50.0
        time_score = hours if is_time_constrained else 0
        
        genre_bonus = 0
        if preferred and g.genres:
            game_genres = [x.strip() for x in g.genres.split(",")]
            if any(p in game_genres for p in preferred):
                genre_bonus = -30  # bonus importante

        return time_score + genre_bonus + random_factor

    filtered_games.sort(key=sort_key)
    top_recommendations = filtered_games[:3]
    
    responses = []
    for g in top_recommendations:
        resp = _to_response(g)
        
        reasons = []
        if is_time_constrained and (g.hltb_main_hours or 0) <= 10:
            reasons.append(f"Corto ({g.hltb_main_hours}h)")
            
        if current_user.stress_level_tolerance == "baja":
            reasons.append("Relajante")
            
        if preferred and g.genres:
            game_genres = [x.strip() for x in g.genres.split(",")]
            if any(p in game_genres for p in preferred):
                reasons.append("Tu género favorito")
                
        if not reasons:
            reasons.append("Para tu backlog")
            
        resp.recommendation_reason = " — ".join(reasons)
        responses.append(resp)

    return responses
