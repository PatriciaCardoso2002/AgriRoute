import json
import requests
import os
from dotenv import load_dotenv

load_dotenv()

def carregar_politica(evento: str):
    with open("policies.json") as f:
        politicas = json.load(f)
    return politicas.get(evento, {}).get("destinatarios", {})

def enviar_via_endpoint(canal: str, payload: dict):
    url = f"http://localhost:8002/v1/notifications/{canal}"
    api_key = os.getenv("API_KEY")
    print("Api key>", api_key)

    headers = {
        "api-key": api_key
    }
    try:
        r = requests.post(url, json=payload, headers=headers)
        if canal == "push" and r.status_code == 400:
            print(f"⚠️ Push ignorado (usuário offline): {payload['recipient']}")
            return
        r.raise_for_status()
        print(f"✅ Enviado via {canal} para {payload['recipient']}")
    except Exception as e:
        print(f"❌ Falha ao enviar via {canal}: {e}")

def aplicar_politicas(nome_evento: str, evento: dict):
    print(f"🔄 A carregar política para evento: {nome_evento}")
    politica = carregar_politica(nome_evento)
    print(f"✅ Política carregada: {politica}")

    if nome_evento in ["prev_chegada"]:
        hora_estimada = evento.get("hora_estimada")
        tempo_estimado = evento.get("tempo_estimado")

        print("🕒 Hora estimada:", hora_estimada)

    for role, canais in politica.items():
        contactos = evento.get(role, {})

        for canal in canais:
            contacto = contactos.get(canal)
            if not contacto:
                continue

            body = f"O evento '{nome_evento}' foi acionado para o papel '{role}'."

            if nome_evento == "estado_pedido" and evento.get("estado"):
                body += f"\nEstado: {evento['estado']}"

            if nome_evento in ["prev_chegada", "booking_aceite"]:
                body += f"\nHora estimada: {evento.get('hora_estimada')}\nTempo estimado: {evento.get('tempo_estimado')}"

            payload = {
                "recipient": contacto,
                "title": f"Notificação - {nome_evento.replace('_', ' ').title()}",
                "body": body,
                "notification_type": nome_evento
            }

            enviar_via_endpoint(canal, payload)



