import datetime
import logging
import secrets
import smtplib
import uuid
import bcrypt
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import Config
from app.db import get_db

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when an OTP cannot be delivered to the user's email."""


def generate_otp_code(length: int = 6) -> str:
    """Generates a cryptographically secure numeric OTP."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))


def create_and_send_otp(email: str, purpose: str = 'login', extra_fields: dict | None = None) -> dict:
    """
    Creates a new OTP in the database and sends it via SMTP.
    The OTP is never returned to the client.
    """
    db = get_db()
    otp_code = generate_otp_code(6)
    temp_token = str(uuid.uuid4())
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(minutes=Config.OTP_EXPIRATION_MINUTES)

    # Invalidate any existing active OTP for this email and purpose
    db.otps.delete_many({'email': email, 'purpose': purpose})

    # Save OTP record
    otp_record = {
        'email': email,
        # Never persist the usable OTP; a database read must not be enough to log in.
        'otp_hash': bcrypt.hashpw(otp_code.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        'temp_token': temp_token,
        'purpose': purpose,
        'attempts': 0,
        'created_at': now.isoformat(),
        'last_resend_at': now.isoformat(),
        'expires_at': expires_at.isoformat()
    }
    if extra_fields:
        otp_record.update(extra_fields)
    db.otps.insert_one(otp_record)

    try:
        send_otp_email(email, otp_code, purpose)
    except Exception:
        db.otps.delete_one({'_id': otp_record['_id']})
        raise

    return {
        'temp_token': temp_token,
        'expires_in_seconds': Config.OTP_EXPIRATION_MINUTES * 60,
    }


def verify_otp(email: str, otp: str, temp_token: str, purpose: str = 'login') -> tuple[bool, str]:
    """
    Verifies the provided OTP against the database record.
    Returns (success: bool, error_message: str | None)
    """
    db = get_db()
    record = db.otps.find_one({'email': email, 'temp_token': temp_token, 'purpose': purpose})

    if not record:
        return False, "Invalid or expired verification session. Please log in again."

    # Check expiration
    now = datetime.datetime.utcnow()
    expires_at = datetime.datetime.fromisoformat(record['expires_at'])
    if now > expires_at:
        db.otps.delete_one({'_id': record['_id']})
        return False, "The verification code has expired. Please request a new code."

    # Check maximum failed attempts (limit 3)
    if record.get('attempts', 0) >= 3:
        db.otps.delete_one({'_id': record['_id']})
        return False, "Too many incorrect attempts. For security, please sign in again."

    if not otp or not otp.isdigit() or len(otp) != 6:
        db.otps.update_one({'_id': record['_id']}, {'$inc': {'attempts': 1}})
        remaining = 2 - record.get('attempts', 0)
        if remaining > 0:
            return False, f"Incorrect verification code. {remaining} attempt(s) remaining."
        db.otps.delete_one({'_id': record['_id']})
        return False, "Incorrect verification code. Maximum attempts exceeded."

    # Check code match without storing the code in plaintext.
    if not bcrypt.checkpw(otp.encode('utf-8'), record['otp_hash'].encode('utf-8')):
        db.otps.update_one({'_id': record['_id']}, {'$inc': {'attempts': 1}})
        remaining = 2 - record.get('attempts', 0)
        if remaining > 0:
            return False, f"Incorrect verification code. {remaining} attempt(s) remaining."
        else:
            db.otps.delete_one({'_id': record['_id']})
            return False, "Incorrect verification code. Maximum attempts exceeded."

    # Valid: Delete record to prevent replay
    db.otps.delete_one({'_id': record['_id']})
    return True, None


def resend_otp(email: str, temp_token: str, purpose: str = 'login') -> tuple[bool, dict | str]:
    """
    Resends an OTP with rate limiting (minimum 45 seconds between requests).
    Returns (success: bool, result_dict_or_error_message)
    """
    db = get_db()
    record = db.otps.find_one({'email': email, 'temp_token': temp_token, 'purpose': purpose})

    if not record:
        return False, "Active verification session not found. Please log in again."

    now = datetime.datetime.utcnow()
    last_resend = datetime.datetime.fromisoformat(record.get('last_resend_at', record['created_at']))
    elapsed = (now - last_resend).total_seconds()

    if elapsed < 45:
        wait_seconds = int(45 - elapsed)
        return False, f"Please wait {wait_seconds} seconds before requesting a new code."

    # Send the replacement before replacing the active database record. If SMTP
    # fails, the current challenge remains usable and the user can retry.
    new_otp = generate_otp_code(6)
    new_expires = now + datetime.timedelta(minutes=Config.OTP_EXPIRATION_MINUTES)
    send_otp_email(email, new_otp, purpose)

    db.otps.update_one(
        {'_id': record['_id']},
        {
            '$set': {
                'otp_hash': bcrypt.hashpw(new_otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                'attempts': 0,
                'last_resend_at': now.isoformat(),
                'expires_at': new_expires.isoformat()
            }
        }
    )

    return True, {
        'temp_token': temp_token,
        'expires_in_seconds': Config.OTP_EXPIRATION_MINUTES * 60,
    }


def send_otp_email(recipient_email: str, otp_code: str, purpose: str = 'login') -> dict:
    """
    Dispatches OTP via SMTP. Development console fallback is intentionally
    disabled so OTPs cannot be exposed outside the user's email inbox.
    """
    subject = "Your ML Laboratory Verification Code"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 30px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6366f1; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ML Laboratory</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Two-Factor Authentication Security</p>
        </div>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          You requested a login verification code for your account. Please use the 6-digit code below to complete authentication:
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 14px 28px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #a5b4fc;">
            {otp_code}
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          ⏱ This code will expire in <strong>{Config.OTP_EXPIRATION_MINUTES} minutes</strong>.<br>
          If you did not initiate this login request, please change your password immediately.
        </p>
      </div>
    </body>
    </html>
    """

    if not Config.SMTP_USER or not Config.SMTP_PASSWORD:
        raise EmailDeliveryError(
            "Email OTP is not configured. Set SMTP_USER and SMTP_PASSWORD in backend/.env."
        )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{Config.SMTP_FROM_NAME} <{Config.SMTP_FROM_EMAIL or Config.SMTP_USER}>"
        msg["To"] = recipient_email

        part_text = MIMEText(
            f"Your verification code is: {otp_code}. "
            f"Valid for {Config.OTP_EXPIRATION_MINUTES} minutes.",
            "plain"
        )
        part_html = MIMEText(html_content, "html")
        msg.attach(part_text)
        msg.attach(part_html)

        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            server.sendmail(Config.SMTP_USER, recipient_email, msg.as_string())

        logger.info("Successfully sent OTP email to %s", recipient_email)
    except Exception as exc:
        logger.error("Failed to deliver OTP email to %s: %s", recipient_email, exc)
        raise EmailDeliveryError(
            "Unable to send the verification email. Please try again later."
        ) from exc
