export type Style3DMap = {
  composition: 'multiply' | 'screen' | null
  file_url: string
  id: number
  thumb_sm_url: string | null
  type: string
}

export type StyleLogoTechnology = string

export type StyleLogoEntry = {
  // minimal structure until backend spec is formalized
  id?: number
  name?: string
  url?: string
}
