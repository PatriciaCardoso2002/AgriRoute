import smtplib
from fastapi import HTTPException
from email.mime.text import MIMEText
from app.config import SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
from app.models import Notification

def send_email(notification: Notification):
    """ Função para enviar email """
    if not isinstance(notification, Notification):
        raise ValueError("Invalid notification type. Must be 'pickup' or 'delivery'.")
    if not SMTP_USER or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Configuração de SMTP ausente")
    
    if notification.is_pickup:
        subject = f"🚛 Pickup Notification: {notification.product_name}"
        message = (
            f"Dear Supplier,\n\n"
            f"Your product **{notification.product_name}** (Quantity: {notification.quantity}) "
            f"is scheduled for pickup from **{notification.warehouse}** on {notification.event_date}.\n\n"
            f"If there are any changes, please contact us.\n\n"
            f"Best regards,\nAgriRoute"
        )
    else:
        subject = f"📦 Delivery Notification: {notification.product_name}"
        message = (
            f"Dear Producer,\n\n"
            f"Your product **{notification.product_name}** (Quantity: {notification.quantity}) "
            f"has arrived at **{notification.warehouse}** on {notification.event_date}.\n\n"
            f"If you have any questions, please contact us.\n\n"
            f"Best regards,\nAgriRoute"
        )
    try:
        msg = MIMEText(message)
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = notification.email

        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, notification.email, msg.as_string())

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=401, detail="Falha na autenticação do servidor SMTP")

    except smtplib.SMTPRecipientsRefused:
        raise HTTPException(status_code=400, detail="Email inválido ou destinatário rejeitado")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
