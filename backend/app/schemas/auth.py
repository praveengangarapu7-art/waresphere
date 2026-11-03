import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.constants.roles import Role

# NOTE: email is a plain `str`, not pydantic.EmailStr. EmailStr requires the
# optional `email-validator` package, which is not in requirements.txt and
# was not installed this stage (no package installs allowed). Recommend
# adding `email-validator` to requirements.txt and switching to EmailStr in
# a future stage for real format validation.


class UserBase(BaseModel):
    name: str
    email: str
    # Remains a plain, unconstrained `str` (no Literal/enum enforcement) so
    # this change stays backward-compatible — see app/constants/roles.py.
    role: str = Role.STAFF.value


class UserCreate(UserBase):
    # Client sends a plaintext password; the server must hash it into
    # password_hash before persisting. password_hash itself is never
    # accepted from — or returned to — the client.
    #
    # NOT used by the public /auth/register endpoint (see RegisterRequest
    # below) precisely because it inherits UserBase.role — this schema is
    # reserved for a future authorized-administrator user-creation endpoint
    # that is allowed to set a role explicitly.
    password: str = Field(min_length=8)

    model_config = ConfigDict(extra="forbid")


class RegisterRequest(BaseModel):
    """
    Public self-registration request. Deliberately has no `role` field at
    all — not merely one that gets silently overridden — so a client cannot
    even attempt to submit a role; extra="forbid" rejects such a request
    outright with a validation error. Every user created through this
    endpoint always gets the default staff role (see app/api/auth.py).
    """

    name: str
    email: str
    password: str = Field(min_length=8)

    model_config = ConfigDict(extra="forbid")


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    # password_hash is deliberately absent from this (and every) schema.
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str

    model_config = ConfigDict(extra="forbid")


class RefreshRequest(BaseModel):
    refresh_token: str

    model_config = ConfigDict(extra="forbid")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
