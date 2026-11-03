from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.batches import router as batches_router
from app.api.copilot import router as copilot_router
from app.api.inbound_orders import router as inbound_orders_router
from app.api.inventory import router as inventory_router
from app.api.outbound_orders import router as outbound_orders_router
from app.api.products import router as products_router
from app.api.stock_movements import router as stock_movements_router
from app.api.warehouses import router as warehouses_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(warehouses_router)
api_router.include_router(products_router)
api_router.include_router(batches_router)
api_router.include_router(inventory_router)
api_router.include_router(stock_movements_router)
api_router.include_router(inbound_orders_router)
api_router.include_router(outbound_orders_router)
api_router.include_router(copilot_router)
