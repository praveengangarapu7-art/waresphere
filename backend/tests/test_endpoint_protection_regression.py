"""Structural regression guard: every route in the real app must require
authentication (get_current_user, directly or via require_permission /
get_current_user_id, which both depend on it) except a small, explicitly
documented list of intentionally public routes.

This walks FastAPI's actual dependency tree on the real `app` object rather
than re-testing each route individually — so a future endpoint added
without any auth dependency fails this test immediately, regardless of
which file it's added to.

Implementation note: this FastAPI version (0.141.1) resolves included
sub-routers lazily — `app.routes` contains internal `_IncludedRouter`
wrapper objects rather than flattened APIRoute instances directly. This was
verified empirically (see Phase 2B Stage 3 report) by walking
`_IncludedRouter.original_router.routes` recursively, which yields the same
APIRoute objects the app actually serves. If a future FastAPI upgrade
changes this internal shape, this test's route-enumeration helper is the
one place that would need updating — the protection check itself
(dependant tree traversal for get_current_user) is unaffected.
"""

from fastapi.routing import APIRoute

from app.dependencies import get_current_user
from app.main import app

# (method, path) pairs that are intentionally NOT authenticated:
#   - /auth/register, /auth/login: public by design (Phase 2A) — there is
#     no token to present before these succeed.
#   - /auth/refresh, /auth/logout: still 501 stubs from Phase 2A (refresh-
#     token rotation was explicitly deferred) — pre-existing, out of scope
#     for Phase 2B Stage 3's endpoint-wiring work, not a new gap it
#     introduced. Revisit once refresh-token handling is implemented.
#   - /health: infrastructure liveness check, deliberately public.
PUBLIC_ROUTES = {
    ("POST", "/auth/register"),
    ("POST", "/auth/login"),
    ("POST", "/auth/refresh"),
    ("POST", "/auth/logout"),
    ("GET", "/health"),
}


def _iter_api_routes(routes):
    """Recursively yields every real APIRoute the app serves, unwrapping
    this FastAPI version's lazy `_IncludedRouter` wrappers."""
    for route in routes:
        if isinstance(route, APIRoute):
            yield route
        elif hasattr(route, "original_router"):
            yield from _iter_api_routes(route.original_router.routes)


def _collect_dependency_calls(dependant) -> set:
    """All callables anywhere in a route's dependency tree, including
    nested Depends(...) used inside other dependencies (e.g.
    require_permission's returned function itself depending on
    get_current_user)."""
    calls = set()
    if dependant.call is not None:
        calls.add(dependant.call)
    for sub_dependant in dependant.dependencies:
        calls |= _collect_dependency_calls(sub_dependant)
    return calls


def test_every_non_public_route_requires_authentication():
    unprotected = []
    for route in _iter_api_routes(app.routes):
        for method in route.methods or ():
            key = (method, route.path)
            if key in PUBLIC_ROUTES:
                continue
            calls = _collect_dependency_calls(route.dependant)
            if get_current_user not in calls:
                unprotected.append(key)

    assert not unprotected, (
        f"Route(s) with no authentication dependency: {sorted(unprotected)}. "
        "Add Depends(get_current_user) or Depends(require_permission(...)), "
        "or add the route to PUBLIC_ROUTES above with a documented reason."
    )


def test_public_routes_list_has_no_stale_entries():
    """
    The inverse check: every entry in PUBLIC_ROUTES must still exist as a
    real route. Prevents this allowlist from silently growing stale (e.g.
    a route being renamed/removed while its old path lingers here,
    quietly widening what the test above considers acceptable).
    """
    real_routes = {
        (method, route.path)
        for route in _iter_api_routes(app.routes)
        for method in (route.methods or ())
    }
    stale = PUBLIC_ROUTES - real_routes
    assert not stale, f"PUBLIC_ROUTES contains entries with no matching real route: {stale}"
