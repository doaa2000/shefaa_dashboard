import type { Component } from 'vue'
import DashboardLayout from './DashboardLayout.vue'
import AuthLayout from './AuthLayout.vue'
import BlankLayout from './BlankLayout.vue'

export type LayoutName = 'dashboard' | 'auth' | 'blank'

export const layouts: Record<LayoutName, Component> = {
  dashboard: DashboardLayout,
  auth: AuthLayout,
  blank: BlankLayout,
}

export { DashboardLayout, AuthLayout, BlankLayout }
