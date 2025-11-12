<template>
  <div class="space-y-6">
    <Tabs v-model="profileStore.addressTabs" class="w-full">
      <TabsList class="flex w-full border-b border-border bg-muted rounded-lg overflow-hidden">
        <TabsTrigger
          value="personal"
          class="w-1/2 px-4 py-2 text-center text-sm font-medium transition-colors"
          :class="tabClass('personal')"
        >
          {{ t.personal }}
        </TabsTrigger>
        <TabsTrigger
          value="business"
          class="w-1/2 px-4 py-2 text-center text-sm font-medium transition-colors"
          :class="tabClass('business')"
        >
          {{ t.business }}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid gap-4 md:grid-cols-2">
        <FormField v-slot="{ field }" name="first_name">
          <FormItem>
            <FormLabel>
              {{ t.firstName }}
              <span v-if="isPersonal" class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                id="first_name"
                type="text"
                autocomplete="given-name"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ field }" name="last_name">
          <FormItem>
            <FormLabel>
              {{ t.lastName }}
              <span v-if="isPersonal" class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                id="last_name"
                type="text"
                autocomplete="family-name"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <FormField v-slot="{ field }" name="email">
          <FormItem>
            <FormLabel>{{ t.email }}</FormLabel>
            <FormControl>
              <Input
                id="email"
                type="email"
                autocomplete="email"
                :model-value="field.value"
                placeholder="name@example.com"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ field }" name="phone_number">
          <FormItem>
            <FormLabel>{{ t.phoneNumber }}</FormLabel>
            <FormControl>
              <Input
                id="phone_number"
                type="tel"
                autocomplete="tel"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <TransitionGroup name="fade" tag="div">
        <FormField v-if="isBusiness" v-slot="{ field }" key="company" name="company_name">
          <FormItem>
            <FormLabel>
              {{ t.companyName }}
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                id="company_name"
                type="text"
                autocomplete="organization"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </TransitionGroup>

      <FormField v-slot="{ field }" name="address1">
        <FormItem>
          <FormLabel>
            {{ t.addressLine1 }}
            <span class="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Input
              id="address1"
              type="text"
              autocomplete="address-line1"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ field }" name="address2">
        <FormItem>
          <FormLabel>{{ t.addressLine2 }}</FormLabel>
          <FormControl>
            <Input
              id="address2"
              type="text"
              autocomplete="address-line2"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="grid gap-4 md:grid-cols-2">
        <FormField v-slot="{ field }" name="city">
          <FormItem>
            <FormLabel>
              {{ t.city }}
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                id="city"
                type="text"
                autocomplete="address-level2"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ field }" name="zip_code">
          <FormItem>
            <FormLabel>
              {{ t.zipCode }}
              <span class="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                id="zip_code"
                type="text"
                inputmode="numeric"
                autocomplete="postal-code"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>
      <FormField v-slot="{ field }" name="country">
        <FormItem>
          <FormLabel>
            {{ t.country }}
            <span class="text-destructive">*</span>
          </FormLabel>
          <Select :model-value="field.value" @update:model-value="field.onChange">
            <FormControl>
              <SelectTrigger class="w-full" @blur="field.onBlur">
                <SelectValue :placeholder="t.selectCountry" />
              </SelectTrigger>
            </FormControl>
            <SelectContent class="max-h-60">
              <SelectItem
                v-for="country in profileStore.countries"
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
      <FormField v-slot="{ field }" name="state">
        <FormItem>
          <FormLabel>{{ t.state }}</FormLabel>
          <FormControl>
            <Input
              id="state"
              type="text"
              autocomplete="address-level1"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-if="!props.address || !props.address.default" v-slot="{ field }" name="default">
        <FormItem class="flex flex-row items-center gap-3 space-y-0">
          <FormControl>
            <Checkbox
              id="checkbox-default"
              :checked="field.value"
              @update:checked="field.onChange"
              @blur="field.onBlur"
            />
          </FormControl>
          <FormLabel for="checkbox-default" class="cursor-pointer">
            {{ t.setAsDefaultAddress }}
          </FormLabel>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex gap-2 justify-end">
        <Button type="button" variant="outline" @click="handleCancel">{{ t.cancel }}</Button>
        <Button type="submit" class="bg-primary text-white hover:text-white">{{ t.save }}</Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useForm } from 'vee-validate/dist/vee-validate'
  import { toTypedSchema } from '@vee-validate/zod/dist/vee-validate-zod'
  import { z } from 'zod'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
  import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { Address, AddressPayload } from '@/services/customers/types'
  import { m as messages } from '@/paraglide/messages'

  const props = defineProps<{ address?: Address | null }>()
  const emit = defineEmits<{
    (e: 'save', payload: AddressPayload): void
    (e: 'cancel'): void
  }>()

  const profileStore = useProfileStore()

  const requiredMessage = (label: string) => `${label} is required`
  const emailMessage = (label: string) => `${label} must be a valid email address`
  const phoneMessage = (label: string) => `${label} must contain at least 6 numbers`

  const t = computed(() => ({
    personal: messages.profile_personal({}, { locale: profileStore.currentLocale }),
    business: messages.profile_business({}, { locale: profileStore.currentLocale }),
    firstName: messages.profile_first_name({}, { locale: profileStore.currentLocale }),
    lastName: messages.profile_last_name({}, { locale: profileStore.currentLocale }),
    email: messages.profile_email({}, { locale: profileStore.currentLocale }),
    phoneNumber: messages.profile_phone_number({}, { locale: profileStore.currentLocale }),
    companyName: messages.profile_company_name({}, { locale: profileStore.currentLocale }),
    addressLine1: messages.profile_address_line_1({}, { locale: profileStore.currentLocale }),
    addressLine2: messages.profile_address_line_2({}, { locale: profileStore.currentLocale }),
    city: messages.profile_city({}, { locale: profileStore.currentLocale }),
    zipCode: messages.profile_zip_code({}, { locale: profileStore.currentLocale }),
    country: messages.profile_country({}, { locale: profileStore.currentLocale }),
    selectCountry: messages.profile_select_country({}, { locale: profileStore.currentLocale }),
    state: messages.profile_state({}, { locale: profileStore.currentLocale }),
    setAsDefaultAddress: messages.profile_set_as_default_address(
      {},
      { locale: profileStore.currentLocale }
    ),
    cancel: messages.profile_cancel({}, { locale: profileStore.currentLocale }),
    save: messages.profile_save({}, { locale: profileStore.currentLocale })
  }))

  const formSchema = z
    .object({
      id: z.number().optional(),
      first_name: z.string().trim().optional().default(''),
      last_name: z.string().trim().optional().default(''),
      email: z
        .string()
        .trim()
        .optional()
        .default('')
        .refine(
          (value: string) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          () => ({ message: emailMessage(t.value.email) })
        ),
      phone_number: z
        .string()
        .trim()
        .optional()
        .default('')
        .refine(
          (value: string) => value.length === 0 || value.replace(/\D/g, '').length >= 6,
          () => ({ message: phoneMessage(t.value.phoneNumber) })
        ),
      company_name: z.string().trim().optional().default(''),
      address1: z.string().trim().min(1, requiredMessage(t.value.addressLine1)),
      address2: z.string().trim().optional().default(''),
      city: z.string().trim().min(1, requiredMessage(t.value.city)),
      state: z.string().trim().optional().default(''),
      zip_code: z.string().trim().min(1, requiredMessage(t.value.zipCode)),
      country: z.string().trim().min(1, requiredMessage(t.value.country)),
      default: z.boolean().optional().default(false)
    })
    .superRefine((values, ctx) => {
      if (profileStore.addressTabs === 'personal') {
        if (!values.first_name || !values.first_name.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: requiredMessage(t.value.firstName),
            path: ['first_name']
          })
        }
        if (!values.last_name || !values.last_name.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: requiredMessage(t.value.lastName),
            path: ['last_name']
          })
        }
      }

      if (profileStore.addressTabs === 'business') {
        if (!values.company_name || !values.company_name.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: requiredMessage(t.value.companyName),
            path: ['company_name']
          })
        }
      }
    })

  type AddressFormValues = z.infer<typeof formSchema>

  const createFormValuesFromStore = (): AddressFormValues => ({
    id: profileStore.addressForm.id ? Number(profileStore.addressForm.id) : undefined,
    first_name: profileStore.addressForm.first_name || '',
    last_name: profileStore.addressForm.last_name || '',
    email: profileStore.addressForm.email || '',
    phone_number: profileStore.addressForm.phone_number || '',
    company_name: profileStore.addressForm.company_name || '',
    address1: profileStore.addressForm.address1 || '',
    address2: profileStore.addressForm.address2 || '',
    city: profileStore.addressForm.city || '',
    state: profileStore.addressForm.state || '',
    zip_code: profileStore.addressForm.zip_code || '',
    country: profileStore.addressForm.country ? String(profileStore.addressForm.country) : '',
    default: Boolean(profileStore.addressForm.default)
  })

  const form = useForm<AddressFormValues>({
    validationSchema: toTypedSchema(formSchema),
    initialValues: createFormValuesFromStore()
  })

  const { handleSubmit: submitHandler, setValues, values, resetForm, validate } = form

  const onSubmit = submitHandler((values: AddressFormValues) => {
    const payload: AddressPayload = {
      ...values,
      country: Number(values.country),
      default: Boolean(values.default)
    }
    emit('save', payload)
  })

  const handleCancel = () => {
    resetForm({
      values: createFormValuesFromStore()
    })
    emit('cancel')
  }

  const isPersonal = computed(() => profileStore.addressTabs === 'personal')
  const isBusiness = computed(() => profileStore.addressTabs === 'business')

  const tabClass = (tab: string) =>
    profileStore.addressTabs === tab ? 'text-primary' : 'text-muted-foreground'

  onMounted(profileStore.fetchCountries)

  watch(
    () => props.address,
    address => {
      profileStore.setAddressFromEdit(address ?? null)
      const formValues = createFormValuesFromStore()
      setValues(formValues)
    },
    { immediate: true }
  )

  watch(
    values,
    (newValues: AddressFormValues) => {
      profileStore.addressForm = {
        ...profileStore.addressForm,
        ...newValues,
        id: newValues.id,
        country: newValues.country,
        default: Boolean(newValues.default)
      }
    },
    { deep: true }
  )

  watch(
    () => profileStore.addressTabs,
    () => {
      void validate()
    }
  )
</script>
