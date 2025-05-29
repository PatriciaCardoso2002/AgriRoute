import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: ['kafka:9092'],
});

export const producer = kafka.producer({
  createPartitioner: () => () => 0, // envia sempre para a partição 0
});

let isConnected = false;
export async function startKafkaProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }

}

export async function enviarEvento(tipo: string, payload: any) {
  if (!isConnected) {
    console.warn('⚠️ Kafka producer não conectado. Tentando conectar...');
    await startKafkaProducer();
  }

  try {
    await producer.send({
      topic: 'notificacoes',
      messages: [
        {
          value: JSON.stringify({
            tipo,
            ...payload,
          }),
        },
      ],
    });
    console.log(`📤 Evento "${tipo}" enviado com sucesso.`);
  } catch (err) {
    console.error('❌ Falha ao enviar evento para o Kafka:', err);
  }
}
