"""ORM model registry.

Importing this package ensures every model class below is registered on
`Base.metadata`, which is required before `Base.metadata.create_all(...)` can
create all tables.
"""

from app.models.batch import Batch
from app.models.bin import Bin
from app.models.inbound_order import InboundOrder
from app.models.inbound_order_line_item import InboundOrderLineItem
from app.models.inventory import Inventory
from app.models.outbound_order import OutboundOrder
from app.models.outbound_order_line_item import OutboundOrderLineItem
from app.models.permission import Permission
from app.models.product import Product
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.stock_movement import StockMovement
from app.models.supplier import Supplier
from app.models.user import User
from app.models.warehouse import Warehouse
from app.models.zone import Zone

__all__ = [
    "Batch",
    "Bin",
    "InboundOrder",
    "InboundOrderLineItem",
    "Inventory",
    "OutboundOrder",
    "OutboundOrderLineItem",
    "Permission",
    "Product",
    "Role",
    "RolePermission",
    "StockMovement",
    "Supplier",
    "User",
    "Warehouse",
    "Zone",
]
