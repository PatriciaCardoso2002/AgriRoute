import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: ['localhost:9092'],
});

export const producer = kafka.producer();

export async function startKafkaProducer() {
  await producer.connect();
}

export async function enviarEvento(tipo: string, payload: any) {
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
}
