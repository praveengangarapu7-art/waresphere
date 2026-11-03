"""Pydantic request/response schemas.

Unlike app/models/__init__.py, this package does not need to import every
submodule eagerly — schemas are not registered on any shared metadata object,
so each API router simply imports the schema module(s) it needs.
"""
