FROM python:3.11

WORKDIR /app

COPY requirements.txt .

RUN apt-get update

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8009

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8009", "--reload"]
