export type OutputSvgGroup = {
  id: number
  name: string
  svg_parts: string[]
}

export type GradientColor = {
  color: string
  pantone: string
  name: string
  percentage?: number
}

export type OutputSvgGroupColor = {
  id: string
  color: string
  pantone: string
  name: string
  count: number
  gradient_colors?: Array<GradientColor>
}
