<!-- src/components/evaluacion/shared/TagInput.vue -->
<template>
  <div class="flex flex-col gap-1.5">

    <label v-if="label" class="text-xs font-semibold text-gray-300 leading-tight">
      {{ label }}
      <span v-if="!required" class="text-gray-500 font-normal ml-1">(opcional)</span>
    </label>

    <p v-if="descripcion" class="text-[11px] text-gray-500 leading-relaxed">{{ descripcion }}</p>

    <div
      :class="[
        'min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 bg-gray-900 border rounded-lg cursor-text transition-colors',
        enfocado ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-600',
        colorChip === 'red' ? 'focus-within:border-red-500 focus-within:ring-red-500' : '',
      ]"
      @click="focusInput"
    >
      <span
        v-for="(tag, i) in modelValue"
        :key="i"
        :class="[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          colorChip === 'red'
            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
        ]"
      >
        {{ tag }}
        <button
          type="button"
          @click.stop="eliminar(i)"
          class="ml-0.5 hover:text-white transition-colors"
        >
          <Icon icon="mdi:close" class="text-[10px]" />
        </button>
      </span>

      <input
        ref="inputRef"
        v-model="inputVal"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        class="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        @keydown.enter.prevent="agregar"
        @keydown.comma.prevent="agregar"
        @keydown.backspace="borrarUltimo"
        @focus="enfocado = true"
        @blur="onBlur"
      />
    </div>

    <p class="text-[10px] text-gray-600">
      Escribe y presiona <kbd class="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-[9px]">Enter</kbd>
      o <kbd class="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-[9px]">,</kbd> para agregar
    </p>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


const props = withDefaults(defineProps<{
  modelValue:   string[]
  label?:       string
  descripcion?: string
  placeholder?: string
  colorChip?:   'blue' | 'red'
  required?:    boolean
}>(), {
  placeholder: 'Escribe una clave...',
  colorChip:   'blue',
  required:    false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const inputVal = ref('')
const enfocado = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function focusInput() {
  inputRef.value?.focus()
}

function agregar() {
  const val = inputVal.value.trim().replace(/,$/, '').trim()
  if (val && !props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
  }
  inputVal.value = ''
}

function eliminar(index: number) {
  const nuevo = [...props.modelValue]
  nuevo.splice(index, 1)
  emit('update:modelValue', nuevo)
}

function borrarUltimo() {
  if (inputVal.value === '' && props.modelValue.length > 0) {
    const nuevo = [...props.modelValue]
    nuevo.pop()
    emit('update:modelValue', nuevo)
  }
}

function onBlur() {
  enfocado.value = false
  // Si queda texto sin confirmar al perder foco, lo agrega automáticamente
  if (inputVal.value.trim()) {
    agregar()
  }
}
</script>