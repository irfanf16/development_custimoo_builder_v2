import { ref, computed } from 'vue'
import cartProductsData from '@/cart-products.json'

export interface CartProduct {
  product_id: number
  product_name: string
  design_id: number
  quantity: number
  price: number
  style: string
  addons: Array<{ id: number; name: string }>
}

export function useCart() {
  const products = ref<CartProduct[]>(cartProductsData.products)

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`
  }

  const formatAddons = (addons: Array<{ id: number; name: string }>): string => {
    return addons.map(addon => addon.name).join(', ')
  }

  const removeProduct = (productId: number): void => {
    products.value = products.value.filter(p => p.product_id !== productId)
  }

  const editProduct = (productId: number): void => {
    // Handle edit action - can be implemented later
    console.log('Edit product:', productId)
  }

  const addProduct = (product: CartProduct): void => {
    products.value.push(product)
  }

  const updateProductQuantity = (productId: number, quantity: number): void => {
    const product = products.value.find(p => p.product_id === productId)
    if (product) {
      product.quantity = quantity
    }
  }

  const totalItems = computed(() => {
    return products.value.reduce((sum, product) => sum + product.quantity, 0)
  })

  const totalPrice = computed(() => {
    return products.value.reduce((sum, product) => sum + product.price * product.quantity, 0)
  })

  return {
    products,
    formatPrice,
    formatAddons,
    removeProduct,
    editProduct,
    addProduct,
    updateProductQuantity,
    totalItems,
    totalPrice
  }
}
