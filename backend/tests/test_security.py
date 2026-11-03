"""Tests for app.security — password hashing and verification."""

from app.security import hash_password, verify_password


def test_hash_password_produces_argon2id_hash():
    hashed = hash_password("correct horse battery staple")
    assert hashed.startswith("$argon2id$")


def test_hash_password_never_returns_the_plaintext():
    plaintext = "correct horse battery staple"
    hashed = hash_password(plaintext)
    assert plaintext not in hashed


def test_verify_password_accepts_correct_password():
    hashed = hash_password("correct horse battery staple")
    assert verify_password("correct horse battery staple", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("correct horse battery staple")
    assert verify_password("incorrect password", hashed) is False


def test_hash_password_is_salted_and_nondeterministic():
    # Two hashes of the same password must differ (random salt per hash),
    # but both must still verify correctly against that same password.
    hash_one = hash_password("same password")
    hash_two = hash_password("same password")
    assert hash_one != hash_two
    assert verify_password("same password", hash_one) is True
    assert verify_password("same password", hash_two) is True
