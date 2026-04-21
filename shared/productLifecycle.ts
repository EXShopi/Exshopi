export type ProductLifecycleState = {
  rawStatus: string;
  rawProductStatus: string;
  rawApprovalStatus: string;
  rawVisibilityStatus: string;
  normalizedStatus: string;
  normalizedProductStatus: string;
  normalizedApprovalStatus: string;
  normalizedVisibilityStatus: string;
  effectiveStatus: 'draft' | 'pending' | 'approved' | 'live' | 'rejected' | 'archived';
  isDeleted: boolean;
  isCustomerVisible: boolean;
  isAdminVisible: boolean;
  exclusionReason?: string;
};

const LIVE_ALIASES = new Set(['live', 'published', 'public', 'visible', 'active']);
const APPROVED_ALIASES = new Set(['approved', 'approve', 'accepted']);
const DRAFT_ALIASES = new Set(['draft', 'new']);
const PENDING_ALIASES = new Set(['pending', 'pending_approval', 'pending-review', 'pending_review', 'review']);
const REJECTED_ALIASES = new Set(['rejected', 'declined', 'denied']);
const ARCHIVED_ALIASES = new Set(['archived', 'archive', 'disabled']);
const HIDDEN_ALIASES = new Set(['hidden', 'private', 'invisible']);

function normalizeLifecycleValue(value: any) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function valueInSet(value: string, set: Set<string>) {
  return Boolean(value && set.has(value));
}

export function isSoftDeletedProduct(product: any) {
  const deletionMeta = product?.specs?.__deletion || product?.specsJson?.__deletion || {};
  return Boolean(
    product?.isDeleted ||
      product?.deletedAt ||
      deletionMeta?.isDeleted ||
      deletionMeta?.deletedAt
  );
}

export function getProductLifecycleState(product: any): ProductLifecycleState {
  const rawStatus = String(product?.status || product?.productStatus || product?.product_status || '');
  const rawProductStatus = String(product?.productStatus || product?.product_status || product?.status || '');
  const rawApprovalStatus = String(product?.approvalStatus || product?.approval_status || '');
  const rawVisibilityStatus = String(product?.visibilityStatus || product?.visibility_status || '');

  const normalizedStatus = normalizeLifecycleValue(rawStatus);
  const normalizedProductStatus = normalizeLifecycleValue(rawProductStatus);
  const normalizedApprovalStatus = normalizeLifecycleValue(rawApprovalStatus);
  const normalizedVisibilityStatus = normalizeLifecycleValue(rawVisibilityStatus);
  const isDeleted = isSoftDeletedProduct(product);

  const draftLike =
    valueInSet(normalizedStatus, DRAFT_ALIASES) || valueInSet(normalizedProductStatus, DRAFT_ALIASES);
  const rejectedLike =
    valueInSet(normalizedStatus, REJECTED_ALIASES) ||
    valueInSet(normalizedProductStatus, REJECTED_ALIASES) ||
    valueInSet(normalizedApprovalStatus, REJECTED_ALIASES);
  const archivedLike =
    valueInSet(normalizedStatus, ARCHIVED_ALIASES) ||
    valueInSet(normalizedProductStatus, ARCHIVED_ALIASES) ||
    valueInSet(normalizedVisibilityStatus, ARCHIVED_ALIASES);
  const liveLike =
    valueInSet(normalizedStatus, LIVE_ALIASES) ||
    valueInSet(normalizedProductStatus, LIVE_ALIASES);
  const approvedLike =
    liveLike ||
    valueInSet(normalizedStatus, APPROVED_ALIASES) ||
    valueInSet(normalizedProductStatus, APPROVED_ALIASES) ||
    valueInSet(normalizedApprovalStatus, APPROVED_ALIASES);
  const pendingLike =
    !draftLike &&
    !rejectedLike &&
    !archivedLike &&
    (valueInSet(normalizedStatus, PENDING_ALIASES) ||
      valueInSet(normalizedProductStatus, PENDING_ALIASES) ||
      valueInSet(normalizedApprovalStatus, PENDING_ALIASES));
  const visibilityVisible =
    !normalizedVisibilityStatus ||
    valueInSet(normalizedVisibilityStatus, LIVE_ALIASES) ||
    valueInSet(normalizedVisibilityStatus, APPROVED_ALIASES);
  const visibilityHidden =
    valueInSet(normalizedVisibilityStatus, HIDDEN_ALIASES) ||
    valueInSet(normalizedVisibilityStatus, DRAFT_ALIASES) ||
    valueInSet(normalizedVisibilityStatus, PENDING_ALIASES);

  let effectiveStatus: ProductLifecycleState['effectiveStatus'] = 'pending';
  if (draftLike) {
    effectiveStatus = 'draft';
  } else if (rejectedLike) {
    effectiveStatus = 'rejected';
  } else if (archivedLike) {
    effectiveStatus = 'archived';
  } else if (liveLike) {
    effectiveStatus = 'live';
  } else if (approvedLike) {
    effectiveStatus = 'approved';
  } else if (pendingLike) {
    effectiveStatus = 'pending';
  }

  let exclusionReason = '';
  let isCustomerVisible = false;

  if (isDeleted) {
    exclusionReason = 'deleted';
  } else if (draftLike) {
    exclusionReason = 'status:draft';
  } else if (rejectedLike) {
    exclusionReason = 'status:rejected';
  } else if (archivedLike) {
    exclusionReason = 'status:archived';
  } else if (liveLike) {
    isCustomerVisible = true;
  } else if (approvedLike && visibilityVisible) {
    isCustomerVisible = true;
  } else if (approvedLike && visibilityHidden) {
    exclusionReason = `visibility:${normalizedVisibilityStatus}`;
  } else {
    exclusionReason = 'not-live-or-approved';
  }

  return {
    rawStatus,
    rawProductStatus,
    rawApprovalStatus,
    rawVisibilityStatus,
    normalizedStatus,
    normalizedProductStatus,
    normalizedApprovalStatus,
    normalizedVisibilityStatus,
    effectiveStatus,
    isDeleted,
    isCustomerVisible,
    isAdminVisible: !isDeleted,
    exclusionReason: exclusionReason || undefined,
  };
}

export function isCustomerVisibleProduct(product: any) {
  return getProductLifecycleState(product).isCustomerVisible;
}

export function isAdminVisibleProduct(product: any) {
  return getProductLifecycleState(product).isAdminVisible;
}
