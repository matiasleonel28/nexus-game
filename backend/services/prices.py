import aiohttp

async def get_price(title: str) -> dict:
    url = "https://www.cheapshark.com/api/1.0/games"
    params = {"title": title, "limit": 1}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as r:
            games = await r.json()

    if not games:
        return {"current": None, "lowest": None, "store": "Steam"}

    game = games[0]
    current = float(game.get("cheapest", 0))
    game_id = game.get("gameID")

    # Buscar el precio histórico más bajo con el gameID
    lowest_price = current
    if game_id:
        deal_url = "https://www.cheapshark.com/api/1.0/games"
        async with aiohttp.ClientSession() as session:
            async with session.get(deal_url, params={"id": game_id}) as r:
                detail = await r.json()

        # El precio histórico viene en el campo cheapestPriceEver
        if detail and "cheapestPriceEver" in detail:
            lowest_price = float(detail["cheapestPriceEver"]["price"])

    return {
        "current": current,
        "lowest":  lowest_price,
        "store":   "Steam",
    }
