export type GeneratePdfPayload = {
  factory_product: Record<string, unknown>[]
  shared_url: string
}

export type GeneratePdfResponse = {
  pdf: string
  name: string
}
