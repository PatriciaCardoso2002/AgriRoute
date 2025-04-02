import openrouteservice
from fastapi import FastAPI, HTTPException
from settings import API_KEY, BASE_URL
import requests

client = openrouteservice.Client(key=API_KEY)

def get_coordinates(address: str):
    """Converte um endereço em latitude e longitude usando OpenRouteService."""
    url = f"{BASE_URL}/geocode/search?api_key={API_KEY}&text={address}"
    response = requests.get(url)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao buscar coordenadas")
    
    data = response.json()
    if "features" in data and len(data["features"]) > 0:
        coords = data["features"][0]["geometry"]["coordinates"]
        return coords[1], coords[0]  # Retorna (latitude, longitude)
    
    raise HTTPException(status_code=404, detail="Endereço não encontrado")
