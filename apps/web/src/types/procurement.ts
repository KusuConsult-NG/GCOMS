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

/**
 * Not a server model. The Contracts tab collects these but there is no Contract
 * table or endpoint behind it, so they live only in component state. Kept as a
 * named type so the absence is explicit rather than an untyped array.
 */
export type ContractDraft = {
  vendor: string;
  title: string;
  value: string;
  startDate: string;
  endDate: string;
  deliverables: string;
  status: string;
};
