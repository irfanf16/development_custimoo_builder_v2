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
// src/helpers/statusColors.ts
export function getStatusColor(status: string = '') {
  const normalized = status.toLowerCase()

  const colorMap: Record<string, { bg: string; text: string }> = {
    submitted_for_factory_review: { bg: '#8B5CF6', text: '#fff' },
    order_approve: { bg: '#F59E0B', text: '#fff' },
    quote_requested: { bg: '#B997C6', text: '#fff' },
    pending_for_factory_assignment: { bg: '#F97316', text: '#fff' },
    submitted_for_customer_review: { bg: '#EAB308', text: '#fff' },

    quote_provided: { bg: '#57A2AC', text: '#fff' },
    factory_approved: { bg: '#22C55E', text: '#fff' },
    customer_approved: { bg: '#10B981', text: '#fff' },

    factory_rejected: { bg: '#F43F5E', text: '#fff' },
    quote_rejected: { bg: '#CE2220', text: '#fff' },
    customer_rejected: { bg: '#EC4899', text: '#fff' },

    in_production: { bg: '#0EA5E9', text: '#fff' },
    shipped: { bg: '#3B82F6', text: '#fff' },
    completed: { bg: '#14A892', text: '#fff' },
    order_cancel: { bg: '#EF4444', text: '#fff' }
  }

  // Default gray color
  return colorMap[normalized] || { bg: '#E3E3E3', text: '#555' }
}
