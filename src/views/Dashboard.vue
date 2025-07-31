<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '@/components/ui/card'
  import { ref } from 'vue'

  const stats = ref([
    {
      title: 'Total Users',
      value: '12,345',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Sessions',
      value: '2,847',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '-1%',
      changeType: 'negative'
    }
  ])

  const recentActivity = ref([
    {
      user: 'John Doe',
      action: 'Created a new project',
      time: '2 minutes ago'
    },
    {
      user: 'Jane Smith',
      action: 'Updated profile settings',
      time: '5 minutes ago'
    },
    {
      user: 'Mike Johnson',
      action: 'Completed onboarding',
      time: '10 minutes ago'
    },
    {
      user: 'Sarah Wilson',
      action: 'Added new team member',
      time: '15 minutes ago'
    }
  ])
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground">
        Welcome back! Here's what's happening with your projects today.
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card v-for="stat in stats" :key="stat.title">
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">{{ stat.title }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stat.value }}</div>
          <p class="text-xs text-muted-foreground">
            <span
              :class="
                stat.changeType === 'positive'
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{ stat.change }}
            </span>
            from last month
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Activity -->
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription> Latest updates from your team </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.user"
              class="flex items-center space-x-4"
            >
              <div
                class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <span class="text-sm font-medium">{{
                  activity.user.charAt(0)
                }}</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ activity.user }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ activity.action }}
                </p>
              </div>
              <span class="text-xs text-muted-foreground">{{
                activity.time
              }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription> Common tasks and shortcuts </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              class="h-20 flex flex-col items-center justify-center"
            >
              <span class="text-2xl mb-2">📁</span>
              <span class="text-sm">New Project</span>
            </Button>
            <Button
              variant="outline"
              class="h-20 flex flex-col items-center justify-center"
            >
              <span class="text-2xl mb-2">👥</span>
              <span class="text-sm">Add Team</span>
            </Button>
            <Button
              variant="outline"
              class="h-20 flex flex-col items-center justify-center"
            >
              <span class="text-2xl mb-2">📊</span>
              <span class="text-sm">Analytics</span>
            </Button>
            <Button
              variant="outline"
              class="h-20 flex flex-col items-center justify-center"
            >
              <span class="text-2xl mb-2">⚙️</span>
              <span class="text-sm">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Projects Section -->
    <Card>
      <CardHeader>
        <CardTitle>Your Projects</CardTitle>
        <CardDescription>
          Manage and monitor your active projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold">E-commerce Platform</h3>
              <span
                class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                >Active</span
              >
            </div>
            <p class="text-sm text-muted-foreground mb-3">
              Online store with payment integration
            </p>
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">Progress: 75%</div>
              <Button size="sm">View</Button>
            </div>
          </div>

          <div class="p-4 border rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold">Mobile App</h3>
              <span
                class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                >In Progress</span
              >
            </div>
            <p class="text-sm text-muted-foreground mb-3">
              Cross-platform mobile application
            </p>
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">Progress: 45%</div>
              <Button size="sm">View</Button>
            </div>
          </div>

          <div class="p-4 border rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold">Admin Dashboard</h3>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >Planning</span
              >
            </div>
            <p class="text-sm text-muted-foreground mb-3">
              Internal management system
            </p>
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">Progress: 15%</div>
              <Button size="sm">View</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
