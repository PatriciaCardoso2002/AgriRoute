from fastapi import APIRouter, HTTPException
from app.models import RouteRequest
from geopy.distance import geodesic
from app.config import get_coordinates
from fastapi import Query
from app.settings import API_KEY, BASE_URL, TOLERANCIA_METROS
import requests
from datetime import datetime, timedelta
from kafka import KafkaProducer
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("routing")

producer = KafkaProducer(
    bootstrap_servers='kafka:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

logger.info("Kafka Producer inicializado com sucesso ✅")

routes = APIRouter(prefix="/v1/routing", tags=["Notifications"])

@routes.post("/get_route")
def get_route(request: RouteRequest):
    """Recebe endereços e retorna a rota entre eles"""
    try:
        origem_coords = get_coordinates(request.origem)
        destino_coords = get_coordinates(request.destino)
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
def verificar_chegada(
    lon_atual: float,
    lat_atual: float,
    lon_destino: float,
    lat_destino: float,
    email_produtor: str = Query(...),
    telemovel_produtor: str = Query(...),
    email_consumidor: str = Query(...),
    telemovel_consumidor: str = Query(...)
):
    """Verifica se o caminhão chegou ao destino"""

    posicao_atual = (lat_atual, lon_atual)
    destino = (lat_destino, lon_destino)
    distancia = geodesic(posicao_atual, destino).meters

    if distancia <= TOLERANCIA_METROS:
        # Enviar evento para Kafka
        producer.send("notificacoes", {
            "tipo": "produto_entregue",
            "produtor": {
                "email": email_produtor,
                "sms": telemovel_produtor
            },
            "consumidor": {
                "email": email_consumidor,
                "sms": telemovel_consumidor
            }
        })

        return {"status": "Chegou!", "distancia_metros": distancia}
    else:
        return {"status": "Ainda não chegou.", "distancia_metros": distancia}

@routes.get("/v1/routing/prev_Arrival")
def prev_arrival(
    origem: str,
    destino: str,
    datetime: str = Query(...),
    email_produtor: str = "",
    telemovel_produtor: str = "",
    email_consumidor: str = "",
    telemovel_consumidor: str = ""
):
    """Prevê tempo de chegada com base na data agendada e endereços"""
    try:
        origem_coords = get_coordinates(origem)
        destino_coords = get_coordinates(destino)

        route_url = f"https://api.openrouteservice.org/v2/directions/driving-car"
        params = {
            "api_key": API_KEY,
            "start": f"{origem_coords[1]},{origem_coords[0]}",
            "end": f"{destino_coords[1]},{destino_coords[0]}"
        }

        response = requests.get(route_url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erro ao calcular previsão de chegada")

        data = response.json()
        summary = data['features'][0]['properties']['summary']
        duration_sec = int(summary['duration'])
        distance_m = summary['distance']

        # Usa a data/hora da marcação como base, não o datetime.now()
        agendamento = datetime.fromisoformat(datetime)
        hora_chegada = agendamento + timedelta(seconds=duration_sec)

        horas = duration_sec // 3600
        minutos = (duration_sec % 3600) // 60

        tempo_formatado = f"{horas}h {minutos}min" if horas > 0 else f"{minutos}min"

        # DEBUG LOG
        print("📤 Enviando evento para Kafka com os seguintes dados:")
        print(f"📩 Email produtor: {email_produtor}")
        print(f"📱 Telemóvel produtor: {telemovel_produtor}")
        print(f"📩 Email consumidor: {email_consumidor}")
        print(f"📱 Telemóvel consumidor: {telemovel_consumidor}")
        print(f"📅 Agendamento: {agendamento}")
        print(f"🕒 Hora estimada: {hora_chegada.strftime('%H:%M')} | Tempo estimado: {tempo_formatado}")

        producer.send("notificacoes", {
            "tipo": "prev_chegada",
            "hora_estimada": hora_chegada.strftime("%H:%M"),
            "tempo_estimado": tempo_formatado,
            "produtor": {
                "email": email_produtor,
                "sms": telemovel_produtor
            },
            "consumidor": {
                "email": email_consumidor,
                "sms": telemovel_consumidor
            }
        })

        print("✅ Evento enviado com sucesso")

        return {
            "distancia_km": round(distance_m, 2) / 1000,
            "tempo_estimado_formatado": tempo_formatado,
            "hora_estimada_chegada": hora_chegada.strftime("%H:%M")
        }

    except Exception as e:
        print("❌ Erro ao prever chegada:", e)
        raise HTTPException(status_code=500, detail=str(e))
