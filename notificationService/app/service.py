import smtplib
from fastapi import HTTPException
from email.mime.text import MIMEText
from app.config import SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
from app.models import Notification

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
    
def send_sms(recipient: str, body: str):
    pass

def send_push_notification(recipient: str, body: str):
    pass
