"""Safety tests preventing PostgreSQL-backed tests from ever falling back to
DATABASE_URL (the application's runtime connection string).

Context: this project's test suite once silently connected to and ran real
DDL/DML against `accident_db` — an unrelated project's PostgreSQL
container that happened to be listening on DATABASE_URL's default
host/port with credentials that happened to satisfy it. These tests make
that failure mode structurally impossible to reintroduce, rather than
relying on future contributors remembering not to do it.
"""

import ast
from pathlib import Path

import pytest

from app.config import Settings
from tests.pg_test_utils import get_test_database_url, postgres_test_engine_or_skip

TESTS_DIR = Path(__file__).resolve().parent
POSTGRES_TEST_FILES = [
    TESTS_DIR / "pg_test_utils.py",
    TESTS_DIR / "test_cli_bootstrap_postgres_concurrency.py",
    TESTS_DIR / "test_rbac_postgres_migrations.py",
    TESTS_DIR / "test_rbac_migrations_lifecycle.py",
]


def _accesses_database_url_attribute(source: str) -> bool:
    """
    True if `source` contains real code (not a comment or docstring) that
    accesses an attribute literally named `database_url` — e.g.
    `settings.database_url`. Parsed via ast rather than a substring search
    so prose *describing* the forbidden pattern (as this file's own
    docstrings and comments do) is never mistaken for the pattern itself.
    """
    tree = ast.parse(source)
    return any(
        isinstance(node, ast.Attribute) and node.attr == "database_url" for node in ast.walk(tree)
    )


@pytest.mark.parametrize("path", POSTGRES_TEST_FILES, ids=lambda p: p.name)
def test_postgres_test_file_never_accesses_database_url_attribute(path):
    """
    Every PostgreSQL-backed test module (and their shared helper) must
    never access a `.database_url` attribute in actual code — the only
    connection string they may use is `settings.test_database_url`,
    obtained through tests.pg_test_utils. Static check: does not depend on
    TEST_DATABASE_URL being set and never connects to anything.
    """
    source = path.read_text(encoding="utf-8")
    assert not _accesses_database_url_attribute(source), (
        f"{path.name} accesses a `.database_url` attribute — PostgreSQL-backed "
        "tests must only ever use settings.test_database_url."
    )


@pytest.mark.parametrize("path", POSTGRES_TEST_FILES[1:], ids=lambda p: p.name)
def test_postgres_test_module_uses_the_shared_safe_helper(path):
    """
    Every PostgreSQL-backed test module (excluding the helper itself) must
    obtain its connection through tests.pg_test_utils rather than building
    its own ad hoc reachability/connection logic — the exact pattern that
    let the accident_db incident happen (three independent, slightly
    different copies of "connect to settings.database_url or skip").
    """
    source = path.read_text(encoding="utf-8")
    assert "from tests.pg_test_utils import" in source


def test_settings_test_database_url_has_no_default():
    """
    TEST_DATABASE_URL must never have a built-in default value — a default
    would defeat the entire point of requiring it to be explicit, and could
    itself accidentally coincide with a real, shared database somewhere.
    """
    assert Settings.model_fields["test_database_url"].default is None


def test_get_test_database_url_returns_none_when_unset(monkeypatch):
    monkeypatch.setattr("tests.pg_test_utils.settings.test_database_url", None)
    assert get_test_database_url() is None


def test_postgres_test_engine_or_skip_never_calls_create_engine_when_unset(monkeypatch):
    """
    When TEST_DATABASE_URL is unset, postgres_test_engine_or_skip() must
    skip immediately without constructing an engine at all — not just
    "without successfully connecting". This proves there is no code path
    that could accidentally reach out to some other database first.
    """
    monkeypatch.setattr("tests.pg_test_utils.settings.test_database_url", None)

    def _fail_if_called(*args, **kwargs):
        raise AssertionError("create_engine must not be called when TEST_DATABASE_URL is unset")

    monkeypatch.setattr("tests.pg_test_utils.create_engine", _fail_if_called)

    with pytest.raises(pytest.skip.Exception):
        postgres_test_engine_or_skip()
