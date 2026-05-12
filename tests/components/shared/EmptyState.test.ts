import { describe, it, expect } from 'vitest'
import type { Component } from 'vue'
import { mountWithProviders } from '../../helpers/mount'
import EmptyStateRaw from '@/components/shared/EmptyState.vue'

// Vue SFC default exports are typed as object in some tsconfig setups; cast to Component.
const EmptyState = EmptyStateRaw as unknown as Component

describe('EmptyState', () => {
  it('renders the root element with the correct data-testid', async () => {
    const wrapper = await mountWithProviders(EmptyState, {
      mountOptions: {
        props: {
          title: 'Nothing here'
        }
      }
    })

    expect(wrapper.find('[data-testid="shared-empty-state"]').exists()).toBe(true)
  })

  it('renders the title prop', async () => {
    const wrapper = await mountWithProviders(EmptyState, {
      mountOptions: {
        props: {
          title: 'No results found'
        }
      }
    })

    expect(wrapper.text()).toContain('No results found')
  })

  it('renders an optional description', async () => {
    const wrapper = await mountWithProviders(EmptyState, {
      mountOptions: {
        props: {
          title: 'Empty',
          description: 'Try adjusting your search filters.'
        }
      }
    })

    expect(wrapper.text()).toContain('Try adjusting your search filters.')
  })

  it('does not render a description paragraph when omitted', async () => {
    const wrapper = await mountWithProviders(EmptyState, {
      mountOptions: {
        props: {
          title: 'Empty'
        }
      }
    })

    // Only the title <p> should be present inside .space-y-1; no description <p>
    const textParagraphs = wrapper.findAll('.space-y-1 p')
    expect(textParagraphs).toHaveLength(1)
    expect(textParagraphs[0].text()).toBe('Empty')
  })
})
