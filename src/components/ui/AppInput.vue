<template>
  <div class="flex flex-col gap-1.5">

    <label v-if="label" class="text-xs text-gray-600 uppercase tracking-wider">
      {{ label }}
    </label>

    <div class="relative">
      <Icon
        v-if="iconLeft"
        :icon="iconLeft"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none"
      />

      <input
        v-bind="$attrs"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :class="[
          'w-full py-2.5 bg-gray-50 text-gray-800 text-sm border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          iconLeft  ? 'pl-10' : 'pl-4',
          iconRight || isPassword ? 'pr-10' : 'pr-4',
        ]"
      />

      <button
        v-if="isPassword"
        type="button"
        @click="verPassword = !verPassword"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Icon :icon="verPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="text-lg" />
      </button>

      <Icon
        v-else-if="iconRight"
        :icon="iconRight"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none"
      />
    </div>

    <p v-if="error" class="text-red-400 text-xs flex items-center gap-1.5">
      <Icon icon="mdi:alert-circle-outline" />
      {{ error }}
    </p>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'


const props = withDefaults(defineProps<{
  modelValue?:  string
  label?:       string
  placeholder?: string
  type?:        string
  iconLeft?:    string
  iconRight?:   string
  error?:       string
  disabled?:    boolean
}>(), {
  type:     'text',
  disabled: false,
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const isPassword = computed(() => props.type === 'password')
const verPassword = ref(false)
const inputType   = computed(() => {
  if (!isPassword.value) return props.type
  return verPassword.value ? 'text' : 'password'
})
</script>