<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <label class="text-xs font-semibold text-gray-300">{{ label }}</label>
      <span
        :class="[
          'text-xs font-medium px-2.5 py-0.5 rounded-full border',
          esPersonalizado
            ? 'bg-violet-900/30 border-violet-600/50 text-violet-300'
            : 'bg-gray-700/50 border-gray-600 text-gray-400',
        ]"
      >
        {{ esPersonalizado ? 'Personalizado' : 'Por defecto' }}
      </span>
    </div>

    <p v-if="descripcion" class="text-[11px] text-gray-500 leading-relaxed">{{ descripcion }}</p>

    <textarea
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      rows="3"
      :placeholder="placeholder"
      class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 text-sm
             font-mono leading-relaxed resize-y focus:outline-none focus:border-green-500
             placeholder:text-gray-600 transition-colors"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  label: string
  descripcion?: string
  placeholder?: string
  defaultValue?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const esPersonalizado = computed(() =>
  props.defaultValue !== undefined && props.modelValue !== props.defaultValue
)
</script>
