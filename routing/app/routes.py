from fastapi import APIRouter, HTTPException
from app.models import RouteRequest
from geopy.distance import geodesic
from app.config import get_coordinates
from fastapi import Query
from app.settings import API_KEY, BASE_URL, TOLERANCIA_METROS
import requests
from datetime import datetime, timedelta
from kafka import KafkaProducer
from kafka.errors import KafkaError
import time
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("routing")

def criar_kafka_producer():
    for tentativa in range(10):
        try:
            producer = KafkaProducer(
                bootstrap_servers='kafka:9092',
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("✅ Kafka Producer conectado com sucesso")
            return producer
        except KafkaError as e:
            logger.warning(f"⚠️ Kafka não disponível. Tentativa {tentativa+1}/10: {e}")
            time.sleep(3)
    raise RuntimeError("❌ Kafka não ficou disponível após várias tentativas")

producer = criar_kafka_producer()

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

from datetime import datetime, timedelta

@routes.get("/prev_Arrival")
def prev_arrival(
    origem: str,
    destino: str,
    agendado_para: str = Query(...),  
    email_produtor: str = "",
    telemovel_produtor: str = "",
    email_consumidor: str = "",
    telemovel_consumidor: str = ""
):
    try:
        origem_coords = get_coordinates(origem)
        destino_coords = get_coordinates(destino)

        route_url = "https://api.openrouteservice.org/v2/directions/driving-car"
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

        agendamento = datetime.fromisoformat(agendado_para)
        hora_chegada = agendamento + timedelta(seconds=duration_sec)

        horas = duration_sec // 3600
        minutos = (duration_sec % 3600) // 60
        tempo_formatado = f"{horas}h {minutos}min" if horas > 0 else f"{minutos}min"

        print("📤 A enviar notificação prev_chegada para Kafka...")

        mensagem = {
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
        }

        producer.send("notificacoes", mensagem)
        logger.info(f"[Kafka] Enviado para tópico 'notificacoes': {mensagem}")

        print("✅ Notificação enviada com sucesso!")

        return {
            "distancia_km": round(distance_m / 1000, 2),
            "tempo_estimado_formatado": tempo_formatado,
            "hora_estimada_chegada": hora_chegada.strftime("%H:%M")
        }

    except Exception as e:
        print("❌ Erro ao prever chegada:", e)
        raise HTTPException(status_code=500, detail=str(e))

