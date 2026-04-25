<template>
  <button
    v-bind="$attrs"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, 'disabled:opacity-50 disabled:cursor-not-allowed']"
  >
    <Icon v-if="loading" icon="mdi:loading" class="animate-spin shrink-0" :class="iconSize" />
    <Icon v-else-if="icon" :icon="icon" class="shrink-0" :class="iconSize" />
    <span v-if="$slots.default"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'


const props = withDefaults(defineProps<{
  variant?: 'primary' | 'danger' | 'ghost' | 'subtle'
  size?:    'sm' | 'md' | 'lg'
  icon?:    string
  loading?: boolean
  disabled?: boolean
}>(), {
  variant:  'primary',
  size:     'md',
  loading:  false,
  disabled: false,
})

const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors'

const variantClasses = computed(() => ({
  primary: 'bg-blue-600 hover:bg-blue-500 text-white',
  danger:  'bg-red-600  hover:bg-red-500  text-white',
  ghost:   'bg-gray-100 hover:bg-gray-200 text-gray-600',
  subtle:  'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30',
}[props.variant]))

const sizeClasses = computed(() => ({
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3   text-base',
}[props.size]))

const iconSize = computed(() => ({
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
}[props.size]))
</script>