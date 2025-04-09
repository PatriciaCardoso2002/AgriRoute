import smtplib
from fastapi import HTTPException
from email.mime.text import MIMEText
from app.config import SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client
from app.socket_service import active_connections
import traceback
import re

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
            print("📨 A enviar email")

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=401, detail="SMTP Authentication Failed")

    except smtplib.SMTPRecipientsRefused:
        raise HTTPException(status_code=400, detail="Invalid email or recipient rejected")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
    
async def send_sms(to: str, message: str):
    """Envia um SMS usando Twilio"""

    print("📱 TWILIO_FROM:", TWILIO_PHONE_NUMBER)
    print("📱 TWILIO_TO:", to)

    # Verifica configurações do Twilio
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        raise HTTPException(status_code=500, detail="❌ Configuração do Twilio está incompleta!")

    # Valida número no formato E.164
    if not re.fullmatch(r"^\+?[1-9]\d{7,14}$", to):
        raise HTTPException(
            status_code=400,
            detail="❌ Número de telemóvel inválido. Exemplo esperado: +351912345678"
        )

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    try:
        sms = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to
        )
        print(f"📨 SMS enviado para {to} (SID: {sms.sid})")
        return {
            "status": "success",
            "sid": sms.sid,
            "message": f"SMS enviado com sucesso para {to}!"
        }

    except TwilioRestException as e:
        print(f"❌ Twilio error full: {e}")
        print(f"❌ Twilio error code: {e.code} | message: {e.msg}")
        raise HTTPException(
            status_code=500,
            detail=f"❌ Twilio Error {e.code}: {e.msg}"
        )

    except Exception as e:
        print("❌ Erro inesperado ao enviar SMS:", str(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"❌ Erro inesperado ao enviar SMS: {str(e)}"
        )



async def send_push_notification(user_id: str,type: str, body: str):
    """Envia uma notificação para um usuário específico via WebSocket"""

    if user_id in active_connections:
        websocket = active_connections[user_id]
        print(f"✅ WebSocket encontrado para {user_id}. Enviando mensagem...")

        await websocket.send_text(f"{type}: {body}")
        print(f"✅ Mensagem enviada para {user_id}: {body}")
    else:
        print(f"⚠ ERRO: Usuário {user_id} não está conectado ao WebSocket!")

