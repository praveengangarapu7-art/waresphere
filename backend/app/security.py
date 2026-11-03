"""Password hashing, email normalization, and JWT utilities.

Password hashing uses pwdlib with Argon2id specifically — not passlib.
passlib is effectively unmaintained and has a known compatibility break
against bcrypt>=4.1 (it inspects an attribute removed from modern bcrypt);
pwdlib is the actively maintained modern replacement and is used here with
Argon2id, the current OWASP-recommended default for new systems.

JWT support uses python-jose, already a project dependency (Phase 0). Access
and refresh tokens are both plain signed JWTs distinguished only by a "type"
claim — there is no server-side token store, so neither can be revoked
before its natural expiry. Refresh-token rotation/revocation is explicitly
out of scope for Phase 2A; see app/api/auth.py for how this limitation is
handled at the /auth/refresh endpoint.
"""

import uuid
from datetime import datetime, timedelta, timezone

from email_validator import EmailNotValidError, validate_email
from jose import JWTError, jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.config import settings

_password_hasher = PasswordHash((Argon2Hasher(),))

MIN_PASSWORD_LENGTH = 8

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def hash_password(password: str) -> str:
    """Hash a plaintext password. Never store or log the return value's input."""
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored hash."""
    return _password_hasher.verify(password, password_hash)


def validate_and_normalize_email(email: str) -> str:
    """
    Validate and normalize an email address using the email-validator
    package. check_deliverability is explicitly disabled: this is a
    syntax/normalization check, not a mailbox-existence check, and must not
    depend on network/DNS access or leak query timing as a side channel.

    The normalized address is additionally lowercased in full (not just the
    domain, which is all email-validator normalizes by default) so that the
    existing case-sensitive `users.email` UNIQUE constraint behaves as users
    actually expect — "Admin@x.com" and "admin@x.com" are the same account.

    Raises ValueError (not a project-specific exception) so this function
    stays reusable across call sites (CLI bootstrap, HTTP registration) that
    each want to translate a bad email into their own error type.
    """
    try:
        result = validate_email(email, check_deliverability=False)
    except EmailNotValidError as exc:
        raise ValueError(f"invalid email address: {exc}") from exc
    return result.normalized.lower()


class TokenError(Exception):
    """Raised for any missing, malformed, expired, or wrong-type JWT."""


def _require_jwt_secret() -> str:
    if not settings.jwt_secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured. Set it via environment variable "
            "or .env before issuing or verifying tokens — see .env.example."
        )
    return settings.jwt_secret_key


def _create_token(user_id: uuid.UUID, token_type: str, expires_delta: timedelta) -> str:
    secret = _require_jwt_secret()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID) -> str:
    return _create_token(
        user_id, ACCESS_TOKEN_TYPE, timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(user_id: uuid.UUID) -> str:
    return _create_token(
        user_id, REFRESH_TOKEN_TYPE, timedelta(days=settings.refresh_token_expire_days)
    )


def decode_token(token: str, *, expected_type: str) -> uuid.UUID:
    """
    Decode and validate a JWT, returning its subject as a user id.

    Raises TokenError for anything wrong with the token — invalid
    signature, expired, malformed, missing/invalid subject, or a token of
    the wrong type (e.g. a refresh token presented where an access token is
    required). Callers translate TokenError into an HTTP 401; this function
    never itself distinguishes these cases in a way that would let a caller
    leak more detail than "the token is not usable" to a client.
    """
    secret = _require_jwt_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise TokenError("invalid or expired token") from exc

    if payload.get("type") != expected_type:
        raise TokenError(f"expected a {expected_type!r} token")

    sub = payload.get("sub")
    if not sub:
        raise TokenError("token is missing its subject claim")

    try:
        return uuid.UUID(sub)
    except (ValueError, AttributeError, TypeError) as exc:
        raise TokenError("token subject is not a valid user id") from exc
