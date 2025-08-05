<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '@/components/ui/card'
  import { useAuthStore } from '@/stores/auth'
  import { ref, computed } from 'vue'

  const authStore = useAuthStore()

  // Computed properties for user data
  const userInitials = computed(() => {
    if (!authStore.customer) return 'U'
    const firstName = authStore.customer.first_name || ''
    const lastName = authStore.customer.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  })

  const fullName = computed(() => {
    if (!authStore.customer) return 'User'
    return `${authStore.customer.first_name} ${authStore.customer.last_name}`
  })

  const userEmail = computed(() => {
    return authStore.customer?.email || 'No email provided'
  })

  const companyName = computed(() => {
    return authStore.customer?.team_company_name || 'No company'
  })

  const joinDate = computed(() => {
    if (!authStore.customer?.created_at) return 'Unknown'
    return new Date(authStore.customer.created_at).toLocaleDateString()
  })

  const stats = ref([
    { label: 'Projects', value: '12' },
    { label: 'Contributions', value: '1,234' },
    { label: 'Followers', value: '567' },
    { label: 'Following', value: '89' }
  ])

  const skills = ref([
    'Vue.js',
    'TypeScript',
    'Tailwind CSS',
    'Node.js',
    'PostgreSQL',
    'Docker'
  ])
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold">Profile</h1>
      <p class="text-muted-foreground">
        Manage your account settings and preferences.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="lg:col-span-1">
        <Card>
          <CardHeader class="text-center">
            <div
              class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <span class="text-2xl font-bold">{{ userInitials }}</span>
            </div>
            <CardTitle>{{ fullName }}</CardTitle>
            <CardDescription>{{ companyName }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">
                Welcome to your profile page
              </p>
            </div>

            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">Email:</span>
                <span class="text-sm text-muted-foreground">{{
                  userEmail
                }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">Company:</span>
                <span class="text-sm text-muted-foreground">{{
                  companyName
                }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">Customer ID:</span>
                <span class="text-sm text-muted-foreground">{{
                  authStore.customer?.id || 'N/A'
                }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">Joined:</span>
                <span class="text-sm text-muted-foreground">{{
                  joinDate
                }}</span>
              </div>
            </div>

            <Button class="w-full">Edit Profile</Button>
          </CardContent>
        </Card>
      </div>

      <!-- Stats and Skills -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Stats -->
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription> Your activity overview </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="stat in stats" :key="stat.label" class="text-center">
                <div class="text-2xl font-bold">{{ stat.value }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ stat.label }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Skills -->
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Technologies and tools you're proficient in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="skill in skills"
                :key="skill"
                class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {{ skill }}
              </span>
            </div>
          </CardContent>
        </Card>

        <!-- Settings -->
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription> Manage your account preferences </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Email Notifications</h4>
                <p class="text-sm text-muted-foreground">
                  Receive updates about your projects
                </p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Two-Factor Authentication</h4>
                <p class="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Privacy Settings</h4>
                <p class="text-sm text-muted-foreground">
                  Control your data and privacy
                </p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Activity -->
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription> Your latest actions and updates </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium">Updated profile information</p>
                  <p class="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>

              <div class="flex items-center space-x-4">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium">
                    Created new project "E-commerce Platform"
                  </p>
                  <p class="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>

              <div class="flex items-center space-x-4">
                <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium">
                    Completed onboarding tutorial
                  </p>
                  <p class="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
