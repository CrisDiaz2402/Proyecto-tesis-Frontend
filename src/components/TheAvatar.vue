<template>
  <primitive v-if="model" :object="model" :position-y="0" />
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue';
import { useGLTF, useAnimations } from '@tresjs/cientos';
import { useLoop } from '@tresjs/core';
import * as THREE from 'three';

// Referencia para el modelo 3D
const model = shallowRef<THREE.Object3D | null>(null);
let faceMesh: THREE.Mesh | undefined;

// --- 1. CARGA DEL MODELO ---
const response = await useGLTF('/avatar.glb') as any;

// Extracción de datos
const gltfData = response.state?.value || response; 

const sceneObject = gltfData.scene || gltfData.scenes?.[0];
const animations = gltfData.animations || [];

if (sceneObject) {
  model.value = sceneObject;
  console.log("✅ Modelo cargado. Animaciones encontradas:", animations.length);

  model.value!.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Buscar cabeza para los visemas
      if (child.morphTargetDictionary) {
        if (!faceMesh || child.name.includes('Head')) {
          faceMesh = child;
          console.log("👤 Cabeza vinculada:", child.name);
        }
      }
    }
  });
} else {
  console.error("❌ Error: No se encontró la escena del modelo.");
}

// --- 2. ACTIVAR ANIMACIÓN ESQUELÉTICA (CORREGIDO) ---
const { actions } = useAnimations(animations, model);

watch(actions, (newActions) => {
  // Verificamos que newActions exista
  if (!newActions) return;

  const animNames = Object.keys(newActions);
  
  if (animNames.length > 0) {
    // 1. Guardamos el nombre en una variable
    const animationName = animNames[0];

    // 2. Verificamos explícitamente que el nombre exista (esto elimina el error de TS)
    if (animationName) {
      const mainAction = newActions[animationName];
      mainAction?.reset().fadeIn(0.5).play();
      console.log("🎬 Reproduciendo animación:", animationName);
    }
  } else {
    console.warn("⚠️ El modelo no tiene animaciones esqueléticas.");
  }
}, { immediate: true });


// --- 3. ANIMACIÓN FACIAL ---
const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
  if (faceMesh && faceMesh.morphTargetDictionary && faceMesh.morphTargetInfluences) {
    let mouthIndex = faceMesh.morphTargetDictionary['viseme_aa'];
    
    // Fallback si no encuentra 'viseme_aa'
    if (mouthIndex === undefined) {
      mouthIndex = faceMesh.morphTargetDictionary['mouthOpen'];
    }

    // TypeScript también exige verificar aquí que mouthIndex no sea undefined
    if (mouthIndex !== undefined) {
      const value = (Math.sin(elapsed * 6) + 1) / 2;
      faceMesh.morphTargetInfluences[mouthIndex] = value;
    }
  }
});
</script>