<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl p-4">
    <TagInput
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :label="label"
      :descripcion="descripcion"
    />
  </div>
</template>

<script setup lang="ts">
import TagInput from '@/components/shared/TagInput.vue'

defineProps<{
  modelValue: string[]
  label: string
  descripcion?: string
}>()

defineEmits<{
  'update:modelValue': [value: string[]]
}>()
</script>
