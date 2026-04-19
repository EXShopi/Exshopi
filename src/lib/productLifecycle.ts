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

function normalizeLifecycleValue(value: any) {
  return String(value || '').trim().toLowerCase();
}

export function isSoftDeletedProduct(product: any) {
  const deletionMeta = product?.specs?.__deletion || {};
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

  let effectiveStatus: ProductLifecycleState['effectiveStatus'] = 'pending';

  if (normalizedProductStatus === 'draft' || normalizedStatus === 'draft') {
    effectiveStatus = 'draft';
  } else if (
    normalizedProductStatus === 'rejected' ||
    normalizedApprovalStatus === 'rejected' ||
    normalizedStatus === 'rejected'
  ) {
    effectiveStatus = 'rejected';
  } else if (
    normalizedProductStatus === 'archived' ||
    normalizedVisibilityStatus === 'archived' ||
    normalizedStatus === 'archived'
  ) {
    effectiveStatus = 'archived';
  } else if (
    normalizedProductStatus === 'live' ||
    normalizedStatus === 'live'
  ) {
    effectiveStatus = 'live';
  } else if (
    normalizedProductStatus === 'approved' ||
    normalizedApprovalStatus === 'approved' ||
    normalizedStatus === 'approved'
  ) {
    effectiveStatus = 'approved';
  } else if (
    normalizedProductStatus === 'pending_approval' ||
    normalizedProductStatus === 'pending' ||
    normalizedApprovalStatus === 'pending' ||
    normalizedStatus === 'pending'
  ) {
    effectiveStatus = 'pending';
  }

  let exclusionReason = '';
  let isCustomerVisible = false;

  if (isDeleted) {
    exclusionReason = 'deleted';
  } else if (effectiveStatus === 'draft') {
    exclusionReason = 'status:draft';
  } else if (effectiveStatus === 'rejected') {
    exclusionReason = 'status:rejected';
  } else if (effectiveStatus === 'archived') {
    exclusionReason = 'status:archived';
  } else if (
    normalizedVisibilityStatus &&
    !['live', 'public', 'visible'].includes(normalizedVisibilityStatus)
  ) {
    exclusionReason = `visibility:${normalizedVisibilityStatus}`;
  } else if (
    effectiveStatus === 'live' ||
    ((effectiveStatus === 'approved' || normalizedApprovalStatus === 'approved') &&
      (!normalizedVisibilityStatus || ['live', 'public', 'visible'].includes(normalizedVisibilityStatus)))
  ) {
    isCustomerVisible = true;
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

