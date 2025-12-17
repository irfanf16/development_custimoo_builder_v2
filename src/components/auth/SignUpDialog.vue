<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
  import { useForm } from 'vee-validate'
  import { toTypedSchema } from '@vee-validate/zod'
  import { z } from 'zod'
  import { API } from '@/services'

  const uiStore = useUIStore()
  const isMobile = uiStore.isMobile

  const props = withDefaults(
    defineProps<{
      open?: boolean
    }>(),
    {
      open: false
    }
  )

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'success'): void
  }>()

  const authStore = useAuthStore()

  const { isLoading, error: authError } = storeToRefs(authStore)

  // Reactive state
  const isOpen = ref(props.open)
  const countries = ref<{ id: number; name: string }[]>([])
  const isLoadingCountries = ref(false)

  // Validation schema
  const formSchema = z
    .object({
      first_name: z
        .string()
        .trim()
        .min(1, 'First name is required')
        .min(2, 'First name must be at least 2 characters'),
      last_name: z
        .string()
        .trim()
        .min(1, 'Last name is required')
        .min(2, 'Last name must be at least 2 characters'),
      email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
      company_name: z.string().trim().min(1, 'Company name is required'),
      countryId: z.string().min(1, 'Please select a country'),
      password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string().min(1, 'Please confirm your password')
    })
    .refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    validationSchema: toTypedSchema(formSchema),
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      company_name: '',
      countryId: '',
      password: '',
      confirmPassword: ''
    }
  })

  const { handleSubmit, resetForm } = form

  // Fetch countries
  const fetchCountries = async () => {
    isLoadingCountries.value = true
    try {
      const res = await API.customer.getCountries()
      if (res.success) {
        countries.value = res.result || []
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err)
    } finally {
      isLoadingCountries.value = false
    }
  }

  // Fetch countries on mount
  onMounted(() => {
    fetchCountries()
  })

  // Watch for prop changes
  watch(
    () => props.open,
    (newValue, oldValue) => {
      isOpen.value = newValue

      // Only reset when transitioning from closed -> open to avoid wiping inputs mid-typing
      if (newValue && !oldValue) {
        resetForm({
          values: {
            first_name: '',
            last_name: '',
            email: '',
            company_name: '',
            countryId: '',
            password: '',
            confirmPassword: ''
          }
        })
        authStore.setError(null)
        if (countries.value.length === 0) {
          fetchCountries()
        }
      }
    }
  )

  // Watch for internal state changes and emit
  watch(isOpen, newValue => {
    emit('update:open', newValue)
  })

  // Methods
  const onSubmit = handleSubmit(async (values: FormValues) => {
    authStore.setError(null)

    const selectedCountry = countries.value.find(c => String(c.id) === values.countryId)

    if (!selectedCountry) {
      authStore.setError('Please select a valid country')
      return
    }

    const result = await authStore.register({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      password: values.password,
      password_confirmation: values.confirmPassword,
      company_name: values.company_name,
      country: { id: selectedCountry.id, label: selectedCountry.name }
    })
    if (result.success) {
      isOpen.value = false
      resetForm({
        values: {
          first_name: '',
          last_name: '',
          email: '',
          company_name: '',
          countryId: '',
          password: '',
          confirmPassword: ''
        }
      })
      emit('success')
    }
  })

  const handleCancel = () => {
    isOpen.value = false
  }
</script>

<template>
  <Dialog :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-md h-full md:h-fit">
      <DialogHeader>
        <DialogTitle>Create Account</DialogTitle>
        <DialogDescription> Enter your information to create a new account. </DialogDescription>
      </DialogHeader>
      <component :is="isMobile ? 'div' : ScrollArea" class="h-full overflow-y-auto">
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ componentField }" name="first_name">
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  autocomplete="given-name"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="last_name">
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Enter your last name"
                  autocomplete="family-name"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autocomplete="email"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="company_name">
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="Enter your company name"
                  autocomplete="organization"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ field }" name="countryId">
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select :model-value="field.value" @update:model-value="field.onChange">
                <FormControl>
                  <SelectTrigger id="country" class="w-full" @blur="field.onBlur">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent class="max-h-60">
                  <SelectItem
                    v-for="country in countries"
                    :key="country.id"
                    :value="String(country.id)"
                  >
                    {{ country.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  autocomplete="new-password"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  autocomplete="new-password"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div v-if="authError" class="text-sm text-red-600">
            {{ authError }}
          </div>
          <DialogFooter>
            <div class="flex flex-row gap-4 md:flex-col md:w-full">
              <Button class="w-full" type="button" variant="default" @click="handleCancel">
                Cancel
              </Button>
              <Button class="w-full" type="submit" :disabled="isLoading">
                <span v-if="isLoading">Creating Account...</span>
                <span v-else>Create Account</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </component>
      <div class="text-center text-xs text-muted-foreground px-6 pb-4">
        By signing up, you agree to our
        <a href="#" class="text-primary hover:underline">Terms of Service</a>
        and
        <a href="#" class="text-primary hover:underline">Privacy Policy</a>
      </div>
    </DialogContent>
  </Dialog>
</template>
