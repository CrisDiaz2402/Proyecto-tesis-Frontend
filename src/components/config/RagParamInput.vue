<!-- src/components/config/RagParamInput.vue -->
<template>
  <div class="flex flex-col gap-1.5">

    <div class="flex items-start">
      <label :for="inputId" class="text-xs font-semibold text-gray-300 leading-tight">
        {{ label }}
      </label>
    </div>

    <p class="text-[11px] text-gray-500 leading-relaxed">{{ descripcion }}</p>

    <div class="flex items-center">
      <div class="relative flex-1">
        <input
          :id="inputId"
          :type="tipoCampo === 'int' ? 'number' : 'number'"
          :step="tipoCampo === 'int' ? 1 : paso"
          :min="min"
          :max="max"
          :value="modelValue"
          @input="onInput"
          @blur="onBlur"
          :class="[
            'w-full px-3 py-2 bg-gray-900 border rounded-lg text-sm font-mono text-white',
            'focus:outline-none focus:ring-1 transition-colors',
            errorMsg
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500',
          ]"
          :placeholder="String(valorDefault)"
        />
      </div>
    </div>

    <p v-if="errorMsg" class="text-[11px] text-red-400 flex items-center gap-1">
      <Icon icon="mdi:alert-circle-outline" class="shrink-0" />
      {{ errorMsg }}
    </p>

    <p v-if="recomendado && !errorMsg" class="text-[10px] text-blue-400/70">
      ✦ {{ recomendado }}
    </p>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'


const props = defineProps<{
  modelValue: number
  label: string
  descripcion: string
  min: number
  max: number
  tipoCampo: 'int' | 'float'
  valorDefault: number
  recomendado?: string
  paramKey: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'validation-error': [hasError: boolean]
}>()

const inputId = computed(() => `rag-param-${props.paramKey}`)
const errorMsg = ref('')

const paso = computed(() => {
  if (props.tipoCampo === 'int') return 1
  const rango = props.max - props.min
  if (rango <= 1) return 0.01
  if (rango <= 10) return 0.1
  return 1
})

function validar(raw: string): { valor: number | null; error: string } {
  if (raw === '' || raw === '-') return { valor: null, error: 'El campo es requerido.' }

  const num = props.tipoCampo === 'int' ? parseInt(raw, 10) : parseFloat(raw)

  if (isNaN(num)) return { valor: null, error: 'Ingresa un número válido.' }

  if (props.tipoCampo === 'int' && !Number.isInteger(num)) {
    return { valor: null, error: 'Debe ser un número entero (sin decimales).' }
  }

  if (num < props.min) return { valor: null, error: `Mínimo permitido: ${props.min}.` }
  if (num > props.max) return { valor: null, error: `Máximo permitido: ${props.max}.` }

  return { valor: num, error: '' }
}

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const { valor, error } = validar(raw)
  errorMsg.value = error
  emit('validation-error', !!error)
  if (valor !== null) emit('update:modelValue', valor)
}

function onBlur(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const { error } = validar(raw)
  errorMsg.value = error
  emit('validation-error', !!error)
}

defineExpose({
  validar: () => {
    const { error } = validar(String(props.modelValue))
    errorMsg.value = error
    return !error
  },
})
</script>