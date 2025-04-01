import smtplib
from fastapi import HTTPException
from email.mime.text import MIMEText
from app.config import SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
from twilio.rest import Client
from app.socket_service import active_connections

def send_email(recipient: str, title: str, body: str):
    """ Function to send email """
    if not SMTP_USER or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="SMTP configuration missing")

    try:
        msg = MIMEText(body)
        msg["Subject"] = title
        msg["From"] = SMTP_USER
        msg["To"] = recipient

        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipient, msg.as_string())

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=401, detail="SMTP Authentication Failed")

    except smtplib.SMTPRecipientsRefused:
        raise HTTPException(status_code=400, detail="Invalid email or recipient rejected")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
    
def send_sms(to: str, message: str):
    """Envia um SMS usando Twilio"""
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        raise ValueError("Configuração do Twilio está incompleta!")

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    try:
        message = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to
        )
        return {"status": "success", "sid": message.sid, "message": "SMS enviado com sucesso!"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

async def send_push_notification(user_id: str, body: str):
    """Envia uma notificação para um usuário específico via WebSocket"""
    print(f"🔍 Buscando WebSocket para {user_id}...")

    if user_id in active_connections:
        websocket = active_connections[user_id]
        print(f"✅ WebSocket encontrado para {user_id}. Enviando mensagem...")

        await websocket.send_text(f"🔔 Notificação para {user_id}: {body}")
        print(f"✅ Mensagem enviada para {user_id}: {body}")
    else:
        print(f"⚠ ERRO: Usuário {user_id} não está conectado ao WebSocket!")

