import os
from kafka import KafkaConsumer
import json
import time
from kafka.errors import KafkaError
from policies import aplicar_politicas
import requests

def garantir_cliente_sistema():
    nome = "AgrirouteNotificationService"
    email = "notifier@agriroute.internal"
    senha = "12345678"

    base_url = "http://kong:8000/agriRoute/v1/notifications"

    for i in range (5):
        try:
            resp = requests.get(f"{base_url}/api_keys?page=1&size=10")
            if resp.status_code == 200:
                lista = resp.json().get("api_keys", [])
                for entry in lista:
                    if entry["email"] == email:
                        os.environ["API_KEY"] = entry["key"]
                        print(f"✅ Cliente já existe com API Key: {entry['key']}")
                        return
            else:
                print(f"⚠️ Falha ao obter lista de clientes: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"❌ Erro ao consultar clientes: {e}")
            return
        time.sleep(3)

    try:
        payload = {
            "nome": nome,
            "email": email,
            "senha": senha
        }
        resp = requests.post(f"{base_url}/auth/register", json=payload)
        if resp.status_code in (200, 201):
            data = resp.json()
            api_key = data.get("api_key")
            if api_key:
                os.environ["API_KEY"] = api_key
                print(f"✅ Cliente criado com API Key: {api_key}")
            else:
                print(f"⚠️ Cliente criado, mas API Key não retornada: {data}")
    except Exception as e:
            print(f"❌ Exceção ao criar cliente: {e}")

garantir_cliente_sistema()

# Retry loop para garantir que o Kafka está pronto
tentativas = 0
while tentativas < 60:
    try:
        consumer = KafkaConsumer(
            'notificacoes',
            bootstrap_servers='kafka:9092',
            group_id='notificacoes-group',
            value_deserializer=lambda v: json.loads(v.decode('utf-8'))
        )
        print("✅ Conectado ao Kafka com sucesso")
        break
    except KafkaError as e:
        print(f"❌ Kafka ainda não disponível... Tentativa {tentativas+1}/60 - {e}")
        tentativas += 1
        time.sleep(3)
else:
    raise RuntimeError("❌ Kafka não ficou disponível após várias tentativas")

print("📡 À escuta de eventos...")

for mensagem in consumer:
    evento = mensagem.value
    nome_evento = evento["tipo"]
    print(f"📥 Evento recebido: {nome_evento}")
    aplicar_politicas(nome_evento, evento)
