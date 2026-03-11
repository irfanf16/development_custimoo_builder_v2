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
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormTextField
  } from '@/components/ui/form'
  import { useForm } from 'vee-validate'
  import { toTypedSchema } from '@vee-validate/zod'
  import { z } from 'zod'
  import { API } from '@/services'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { computed } from 'vue'
  import {
    auth_placeholder_first_name,
    auth_placeholder_last_name,
    auth_placeholder_email,
    auth_placeholder_company_name,
    auth_placeholder_select_country,
    auth_placeholder_select_sales_rep,
    auth_placeholder_create_password,
    auth_placeholder_confirm_password,
    auth_create_account,
    auth_creating_account,
    auth_cancel,
    auth_password_label,
    auth_confirm_password_label,
    profile_first_name,
    profile_last_name,
    profile_email,
    profile_company_name,
    profile_country,
    msg_select_valid_country,
    auth_agree_privacy_policy,
    privacy_policy_title,
    sales_rep_label
  } from '@/paraglide/messages'
  import PrivacyPolicyDialog from './PrivacyPolicyDialog.vue'
  import { type SalesReps } from '@/services/authentication/types'
  import { hasCompanyPermission } from '@/helpers/permissionHelper'

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
  const profileStore = useProfileStore()

  const { isLoading, error: authError } = storeToRefs(authStore)
  const locale = computed(() => profileStore.currentLocale || 'en')

  // Reactive state
  const isOpen = ref(props.open)
  const countries = ref<{ id: number; name: string }[]>([])
  const isLoadingCountries = ref(false)
  const salesReps = ref<SalesReps[]>([])

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
      confirmPassword: z.string().min(1, 'Please confirm your password'),
      salesRepId: z.string().optional()
    })
    .refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
    .refine(
      data => {
        if (salesReps.value.length > 0 && hasCompanyPermission('show_admin_salerep')) {
          return !!data.salesRepId
        }
        return true
      },
      {
        message: 'Please select a sales representative',
        path: ['salesRepId']
      }
    )

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
      confirmPassword: '',
      salesRepId: ''
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

  //Fetch sales reps
  const fetchSalesReps = async () => {
    try {
      const res = await API.authentication.getSalesReps()
      if (res) {
        salesReps.value = res.data || []
      }
    } catch (error) {
      console.error('Failed to fetch sales reps:', error)
    }
  }

  // Fetch countries on mount
  onMounted(() => {
    fetchCountries()
    fetchSalesReps()
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
            confirmPassword: '',
            salesRepId: ''
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
      authStore.setError(msg_select_valid_country({}, { locale: locale.value }))
      return
    }

    const result = await authStore.register({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      password: values.password,
      password_confirmation: values.confirmPassword,
      company_name: values.company_name,
      country: { id: selectedCountry.id, label: selectedCountry.name },
      admin_salesrep_id: values.salesRepId ? Number(values.salesRepId) : undefined
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
          confirmPassword: '',
          salesRepId: ''
        }
      })
      emit('success')
    }
  })

  const handleCancel = () => {
    isOpen.value = false
  }

  const isPrivacyPolicyOpen = ref(false)
</script>

<template>
  <Dialog :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-md h-full md:h-fit">
      <DialogHeader>
        <DialogTitle>{{ auth_create_account({}, { locale }) }}</DialogTitle>
        <DialogDescription> Enter your information to create a new account. </DialogDescription>
      </DialogHeader>
      <component :is="isMobile ? 'div' : ScrollArea" class="h-full max-h-[70vh] overflow-y-auto">
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormTextField
            name="first_name"
            :label="profile_first_name({}, { locale })"
            type="text"
            :placeholder="auth_placeholder_first_name({}, { locale })"
            autocomplete="given-name"
          />
          <FormTextField
            name="last_name"
            :label="profile_last_name({}, { locale })"
            type="text"
            :placeholder="auth_placeholder_last_name({}, { locale })"
            autocomplete="family-name"
          />
          <FormTextField
            name="email"
            :label="profile_email({}, { locale })"
            type="email"
            :placeholder="auth_placeholder_email({}, { locale })"
            autocomplete="email"
          />
          <FormTextField
            name="company_name"
            :label="profile_company_name({}, { locale })"
            type="text"
            :placeholder="auth_placeholder_company_name({}, { locale })"
            autocomplete="organization"
          />
          <FormField v-slot="{ field }" name="countryId">
            <FormItem>
              <FormLabel>{{ profile_country({}, { locale }) }}</FormLabel>
              <Select :model-value="field.value" @update:model-value="field.onChange">
                <FormControl>
                  <SelectTrigger id="country" class="w-full" @blur="field.onBlur">
                    <SelectValue :placeholder="auth_placeholder_select_country({}, { locale })" />
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
          <div v-show="salesReps.length > 0 && hasCompanyPermission('show_admin_salerep')">
            <FormField v-slot="{ field }" name="salesRepId">
              <FormItem>
                <FormLabel>{{ sales_rep_label({}, { locale }) }}</FormLabel>
                <Select :model-value="field.value" @update:model-value="field.onChange">
                  <FormControl>
                    <SelectTrigger id="salesRep" class="w-full" @blur="field.onBlur">
                      <SelectValue
                        :placeholder="auth_placeholder_select_sales_rep({}, { locale })"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent class="max-h-60">
                    <SelectItem v-for="rep in salesReps" :key="rep.id" :value="String(rep.id)">
                      {{ rep.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
          <FormTextField
            name="password"
            :label="auth_password_label({}, { locale })"
            type="password"
            :placeholder="auth_placeholder_create_password({}, { locale })"
            autocomplete="new-password"
          />
          <FormTextField
            name="confirmPassword"
            :label="auth_confirm_password_label({}, { locale })"
            type="password"
            :placeholder="auth_placeholder_confirm_password({}, { locale })"
            autocomplete="new-password"
          />
          <div v-if="authError" class="text-sm text-red-600">
            {{ authError }}
          </div>
          <DialogFooter>
            <div class="flex flex-row gap-4 md:flex-col md:w-full pb-4">
              <Button class="w-full" type="button" variant="default" @click="handleCancel">
                {{ auth_cancel({}, { locale }) }}
              </Button>
              <Button class="w-full" type="submit" :disabled="isLoading">
                <span v-if="isLoading">{{ auth_creating_account({}, { locale }) }}</span>
                <span v-else>{{ auth_create_account({}, { locale }) }}</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </component>
      <div class="text-center text-xs text-muted-foreground px-6 pb-4">
        {{ auth_agree_privacy_policy({}, { locale }) }}
        <button
          type="button"
          class="text-primary hover:underline font-medium"
          @click="isPrivacyPolicyOpen = true"
        >
          {{ privacy_policy_title({}, { locale }) }}
        </button>
      </div>
    </DialogContent>
  </Dialog>

  <PrivacyPolicyDialog :open="isPrivacyPolicyOpen" @update:open="isPrivacyPolicyOpen = $event" />
</template>
