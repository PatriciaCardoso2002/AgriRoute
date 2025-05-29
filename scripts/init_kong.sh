#!/bin/sh

echo "🔄 Aguardando o Kong estar disponível..."

until curl -s http://kong:8001/status >/dev/null; do
  echo "Aguardando o Kong ficar pronto..."
  sleep 2
done

echo "✅ Kong pronto!"

criar_servico() {
  nome=$1
  url=$2

  status=$(curl -s -o /dev/null -w "%{http_code}" http://kong:8001/services/$nome)
  if [ "$status" -eq 404 ]; then
    echo "🚀 Criando serviço '$nome' -> $url"
    curl -s -X POST http://kong:8001/services \
      --data name=$nome \
      --data url=$url
    echo "✅ Serviço '$nome' criado!"
  else
    echo "ℹ️ Serviço '$nome' já existe, ignorando..."
  fi
}

criar_rota() {
  nome_rota=$1
  servico=$2
  caminho=$3
  strip=${4:-false}

  status=$(curl -s -o /dev/null -w "%{http_code}" http://kong:8001/routes/$nome_rota)
  if [ "$status" -eq 404 ]; then
    echo "🚀 Criando rota '$nome_rota' para o serviço '$servico' com path '$caminho'"
    curl -s -X POST http://kong:8001/services/$servico/routes \
      --data name=$nome_rota \
      --data paths[]=$caminho \
      --data strip_path=$strip
    echo "✅ Rota '$nome_rota' criada!"
  else
    echo "ℹ️ Rota '$nome_rota' já existe, ignorando..."
  fi
}

# === Serviços e Rotas ===

# Notifications
criar_servico "fastapi-service" "http://fastapi_service:8009"
criar_rota "fastapi-route" "fastapi-service" "/agriRoute/v1/notifications" false

# WebSocket Notifications
criar_rota "fastapi-ws" "fastapi-service" "/v1/notifications/ws"

# Routing
criar_servico "routing" "http://routing:8003"
criar_rota "routing-route" "routing" "/v1/routing"

# Booking
criar_servico "booking-service" "http://booking_service:8005"
criar_rota "booking-route" "booking-service" "/v1/bookings" false

criar_servico "booking-clients-service" "http://booking_service:8005"
criar_rota "booking-clients-route" "booking-clients-service" "/v1/clients" false

# Payments
criar_servico "payments-service" "http://payments:8000"
criar_rota "payments-route" "payments-service" "/agriRoute/v1/payments"

# Frontend (com strip_path=true para servir corretamente os assets)
criar_servico "frontend-service" "http://frontend:3000"
criar_rota "frontend-route" "frontend-service" "/agriRoute/v1/frontend" true

# Rota raiz (necessária para Auth0 redirecionar corretamente para "/")
criar_rota "frontend-root-route" "frontend-service" "/" false

echo "🎉 Todos os serviços e rotas foram criados com sucesso!"