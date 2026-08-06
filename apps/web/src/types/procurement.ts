/**
 * The shapes the procurement endpoints actually return.
 *
 * These mirror the Vendor, Rfq and RfqQuote models. Typing them here is what
 * makes a rename on the server show up as a compile error in the screens rather
 * than as an empty column at runtime — this page previously read `q.vendor` as
 * a string when the API returns a related object, and rendered nothing.
 */

/** Vendor.status — the server's vocabulary, not a display string. */
export type VendorStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED';

export type Vendor = {
  id: string;
  name: string;
  category: string | null;
  /** 0–5. Defaults to 0, which means unrated rather than rated zero. */
  rating: number;
  taxId: string | null;
  status: VendorStatus;
  email: string | null;
  phone: string | null;
};

export type QuoteStatus = 'SUBMITTED' | 'RECOMMENDED' | 'REJECTED';

export type RfqQuote = {
  id: string;
  rfqId: string;
  vendorId: string;
  /** Included by the API; a quote is meaningless without knowing whose it is. */
  vendor: Pick<Vendor, 'id' | 'name'> | null;
  price: string | number;
  warranty: string | null;
  score: number;
  status: QuoteStatus;
};

export type RfqStatus = 'OPEN' | 'EVALUATION' | 'COMPLETE' | 'CANCELLED';

export type Rfq = {
  id: string;
  /** Allocated by the server, in sequence, per year. Never minted here. */
  reference: string;
  description: string;
  status: RfqStatus;
  closingDate: string | null;
  quotes: RfqQuote[];
};

export type PurchaseRequest = {
  id: string;
  itemName: string;
  quantity: number;
  estimatedCost: string | number;
  vendor: string | null;
  status: string;
  createdAt: string;
  /**
   * Included by GET /procurement. Optional because a request seeded without an
   * author has none, which the table renders as "System".
   */
  requestedBy?: { firstName: string; lastName: string; role: string } | null;
};

export type PlanQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type PlanPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type PlanStatus = 'PLANNED' | 'APPROVED' | 'PROCURED' | 'CANCELLED';

export type PlanItem = {
  id: string;
  fiscalYear: number;
  category: string;
  description: string;
  quantity: number;
  unitPrice: string | number;
  /**
   * quantity x unitPrice, computed by the server on read. There is no stored
   * total column: a derived value written once can disagree with its own inputs
   * the moment either is edited.
   */
  totalCost: number;
  quarter: PlanQuarter;
  priority: PlanPriority;
  status: PlanStatus;
  createdBy: { firstName: string; lastName: string } | null;
};

export type GrnCondition = 'GOOD' | 'DAMAGED' | 'PARTIAL';

export type GoodsReceivedNote = {
  id: string;
  reference: string;
  procurementOrderId: string;
  /** The order the delivery was against — a relation, not a typed-in string. */
  procurementOrder: {
    id: string;
    itemName: string;
    quantity: number;
    vendor: string | null;
  } | null;
  deliveryNote: string;
  itemsReceived: string;
  quantity: number;
  condition: GrnCondition;
  inspectionDate: string;
  officer: string;
  remarks: string | null;
  receivedBy: { firstName: string; lastName: string } | null;
};

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export type Contract = {
  id: string;
  reference: string;
  vendorId: string;
  vendor: Pick<Vendor, 'id' | 'name'> | null;
  title: string;
  value: string | number;
  startDate: string;
  endDate: string;
  deliverables: string | null;
  status: ContractStatus;
  createdBy: { firstName: string; lastName: string } | null;
};
