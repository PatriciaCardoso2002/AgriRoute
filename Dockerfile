FROM kong:3.6.1

USER root

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY ./scripts/init_kong.sh /init_kong.sh
RUN chmod +x /init_kong.sh

CMD /bin/sh -c "\
  kong migrations bootstrap && \
  kong start & \
  echo '⏳ Aguardando o Kong...' && \
  until curl -s http://localhost:8001/status >/dev/null; do \
    echo 'Kong ainda não disponível...'; \
    sleep 2; \
  done && \
  echo '✅ Kong disponível! Executando init_kong.sh...' && \
  /init_kong.sh && \
  tail -f /dev/null"
