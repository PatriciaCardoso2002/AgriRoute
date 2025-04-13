from kafka import KafkaConsumer
import json
import time
from kafka.errors import NoBrokersAvailable
from policies import aplicar_politicas

# Retry loop para garantir que o Kafka está pronto
while True:
    try:
        consumer = KafkaConsumer(
            'notificacoes',
            bootstrap_servers='kafka:29092',
            group_id='notificacoes-group',
            value_deserializer=lambda v: json.loads(v.decode('utf-8'))
        )
        print("✅ Conectado ao Kafka com sucesso")
        break
    except NoBrokersAvailable:
        print("❌ Kafka não disponível ainda... a tentar de novo em 5 segundos")
        time.sleep(5)

print("📡 À escuta de eventos...")

for mensagem in consumer:
    evento = mensagem.value
    nome_evento = evento["tipo"]
    print(f"📥 Evento recebido: {nome_evento}")
    aplicar_politicas(nome_evento, evento)
