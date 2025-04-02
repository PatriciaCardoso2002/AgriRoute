from fastapi import APIRouter, HTTPException
from models import RouteRequest
from geopy.distance import geodesic
from config import get_coordinates
from settings import API_KEY, BASE_URL, TOLERANCIA_METROS
import requests

routes = APIRouter(prefix="/v1/routing", tags=["Notifications"])

@routes.post("/get_route")
def get_route(request: RouteRequest):
    """Recebe endereços e retorna a rota entre eles"""
    try:
        origem_coords = get_coordinates(request.origem)
        destino_coords = get_coordinates(request.destino)
        print(f"BASE_URL está definida como: {BASE_URL}")  # Depuração
        route_url = f"https://api.openrouteservice.org/v2/directions/driving-car"
        params = {
            "api_key": API_KEY,
            "start": f"{origem_coords[1]},{origem_coords[0]}",
            "end": f"{destino_coords[1]},{destino_coords[0]}"
        }
        
        response = requests.get(route_url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erro ao calcular rota")
        
        route_data = response.json()
        return {
            "origem": request.origem,
            "destino": request.destino,
            "coordenadas_origem": origem_coords,
            "coordenadas_destino": destino_coords,
            "rota": route_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
                            
@routes.get("/check_arrival")
def verificar_chegada(lon_atual: float, lat_atual: float, lon_destino: float, lat_destino: float):
    """Verifica se o caminhão chegou ao destino"""
    
    posicao_atual = (lat_atual, lon_atual)
    destino = (lat_destino, lon_destino)

    distancia = geodesic(posicao_atual, destino).meters

    if distancia <= TOLERANCIA_METROS:
        return {"status": "Chegou!", "distancia_metros": distancia}
    else:
        return {"status": "Ainda não chegou.", "distancia_metros": distancia}