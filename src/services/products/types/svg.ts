export type OutputSvgGroup = {
  id: number
  name: string
  svg_parts: string[]
}

export type OutputSvgGroupColor = {
  id: string
  color: string
  pantone: string
  name: string
  count: number
  gradient_colors?: Array<{ color: string; pantone: string; name: string }>
}
