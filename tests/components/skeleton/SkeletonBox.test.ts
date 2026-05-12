import { describe, it, expect } from 'vitest'
import type { Component } from 'vue'
import { mountWithProviders } from '../../helpers/mount'
import SkeletonBoxRaw from '@/components/skeleton/SkeletonBox.vue'

// Vue SFC default exports are typed as object in some tsconfig setups; cast to Component.
const SkeletonBox = SkeletonBoxRaw as unknown as Component

/**
 * Pattern example: selecting by data-testid and asserting element behaviour.
 * Uses mountWithProviders so Pinia + Router are always available even if the
 * component (or a future child) reaches for a store.
 */
describe('SkeletonBox', () => {
  it('renders with data-testid="skeleton-box"', async () => {
    const wrapper = await mountWithProviders(SkeletonBox)
    expect(wrapper.find('[data-testid="skeleton-box"]').exists()).toBe(true)
  })

  it('applies the default width and height via inline style', async () => {
    const wrapper = await mountWithProviders(SkeletonBox, {
      mountOptions: {
        props: { width: '200px', height: '40px' }
      }
    })

    const el = wrapper.find('[data-testid="skeleton-box"]')
    expect(el.attributes('style')).toContain('width: 200px')
    expect(el.attributes('style')).toContain('height: 40px')
  })

  it('applies rounded-full class when radius is "full"', async () => {
    const wrapper = await mountWithProviders(SkeletonBox, {
      mountOptions: {
        props: { radius: 'full' }
      }
    })

    const el = wrapper.find('[data-testid="skeleton-box"]')
    expect(el.classes()).toContain('rounded-full')
  })

  it('defaults to rounded-md when no radius prop is provided', async () => {
    const wrapper = await mountWithProviders(SkeletonBox)

    const el = wrapper.find('[data-testid="skeleton-box"]')
    expect(el.classes()).toContain('rounded-md')
  })
})
