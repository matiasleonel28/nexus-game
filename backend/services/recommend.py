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
    "Tactical"
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

    # Si el tiempo semanal es bajo (< 15h), priorizar juegos cortos (hltb_main_hours asc)
    # De lo contrario, priorizar los de mejor relación valor/precio (o dejar default)
    is_time_constrained = current_user.available_hours_per_week is not None and current_user.available_hours_per_week < 15

    def sort_key(g: Game):
        hours = g.hltb_main_hours or 999.0
        if is_time_constrained:
            return hours
        else:
            return hours

    filtered_games.sort(key=sort_key)

    # Devolvemos el top 1 para la sugerencia del día (o lista corta)
    top_recommendations = filtered_games[:3]
    return [_to_response(g) for g in top_recommendations]
