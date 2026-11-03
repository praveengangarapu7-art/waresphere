export enum InboundStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  RECEIVING = 'Receiving',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum OutboundStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  PICKING = 'Picking',
  PACKED = 'Packed',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum TransferStatus {
  REQUESTED = 'Requested',
  APPROVED = 'Approved',
  IN_TRANSIT = 'In Transit',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export enum CycleCountStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  PENDING_REVIEW = 'Pending Review',
  COMPLETED = 'Completed'
}
