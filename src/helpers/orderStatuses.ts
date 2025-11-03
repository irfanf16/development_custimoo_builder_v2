export const CustimooOrderFlowStatuses: Record<string, string> = {
  quote_requested: 'Quote Requested',
  quote_rejected: 'Quote Rejected',
  quote_provided: 'Quote Provided',
  pending_for_factory_assignment: 'Pending for Factory Assignment',
  submitted_for_factory_review: 'Submitted for Factory Review',
  order_approve: 'Marked to Factory',
  order_cancel: 'Cancelled',
  factory_approved: 'Factory Approved',
  factory_rejected: 'Factory Rejected',
  submitted_for_customer_review: 'Submitted for Customer Review',
  customer_approved: 'Customer Approved',
  customer_rejected: 'Customer Rejected',
  in_production: 'In Production',
  shipped: 'Shipped',
  completed: 'Completed'
}

export function getOrderOptions(pageType: 'quote' | 'order') {
  const quoteOptions = ['quote_requested', 'quote_rejected', 'quote_provided']
  const options: { value: string; text: string }[] = []

  Object.entries(CustimooOrderFlowStatuses).forEach(([key, value]) => {
    if (pageType === 'quote' && quoteOptions.includes(key)) {
      options.push({ value: key, text: value })
    } else if (pageType === 'order' && !quoteOptions.includes(key)) {
      options.push({ value: key, text: value })
    }
  })

  return options
}
