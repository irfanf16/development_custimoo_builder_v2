import type { CustomLogo } from '@/services/logos/types'

/** Use `incoming` asset (id, url, colors, …) while keeping canvas / placement fields from `parent`. */
export function mergeLogoPreservePlacement(parent: CustomLogo, incoming: CustomLogo): CustomLogo {
  return {
    ...incoming,
    name_of_placement: parent.name_of_placement,
    placement: parent.placement,
    x_axis: parent.x_axis,
    y_axis: parent.y_axis,
    x_axis_3d: parent.x_axis_3d ?? incoming.x_axis_3d,
    y_axis_3d: parent.y_axis_3d ?? incoming.y_axis_3d,
    height: parent.height,
    width: parent.width,
    rotation: parent.rotation,
    side: parent.side ?? incoming.side,
    pinned: parent.pinned,
    scaleX: parent.scaleX,
    scaleY: parent.scaleY,
    logo_technology: parent.logo_technology ?? incoming.logo_technology,
    product_id: parent.product_id,
    product_style_id: parent.product_style_id ?? incoming.product_style_id,
    following_product_ids: parent.following_product_ids ?? incoming.following_product_ids,
    logos_follows_product: parent.logos_follows_product ?? incoming.logos_follows_product,
    logo_index: parent.logo_index,
    haveControls: parent.haveControls ?? incoming.haveControls,
    is_locked: parent.is_locked ?? incoming.is_locked
  } as CustomLogo
}
