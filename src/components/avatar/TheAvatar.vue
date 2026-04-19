<template>
  <primitive v-if="model" :object="model" :position-y="0" />
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue';
import { useGLTF, useAnimations } from '@tresjs/cientos';
import { useLoop } from '@tresjs/core';
import * as THREE from 'three';

const props = defineProps<{
  isSpeaking: boolean
}>();

const model = shallowRef<THREE.Object3D | null>(null);
let faceMesh: THREE.Mesh | undefined;

const response = await useGLTF('/avatar.glb') as any;
const gltfData = response.state?.value || response; 
const sceneObject = gltfData.scene || gltfData.scenes?.[0];
const animations = gltfData.animations || [];

if (sceneObject) {
  sceneObject.background = null; 
  model.value = sceneObject;
  model.value!.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      if (child.material) {
        child.material.transparent = false;
        child.material.depthWrite = true;
      }

      if (child.morphTargetDictionary) {
        if (!faceMesh || child.name.includes('Head')) {
          faceMesh = child;
        }
      }
    }
  });
}

const { actions } = useAnimations(animations, model);
watch(actions, (newActions) => {
  if (!newActions) return;
  const animNames = Object.keys(newActions);
  if (animNames.length > 0) {
    const animationName = animNames[0];
    if (animationName) {
      const mainAction = newActions[animationName];
      mainAction?.reset().fadeIn(0.5).play();
    }
  }
}, { immediate: true });

const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
  if (faceMesh && faceMesh.morphTargetDictionary && faceMesh.morphTargetInfluences) {
    let mouthIndex = faceMesh.morphTargetDictionary['viseme_aa'];
    if (mouthIndex === undefined) {
      mouthIndex = faceMesh.morphTargetDictionary['mouthOpen'];
    }

    if (mouthIndex !== undefined) {
      if (props.isSpeaking) {
        const value = (Math.sin(elapsed * 10) + 1) / 2;
        faceMesh.morphTargetInfluences[mouthIndex] = value;
      } else {
        faceMesh.morphTargetInfluences[mouthIndex] = THREE.MathUtils.lerp(
          faceMesh.morphTargetInfluences[mouthIndex] ?? 0, 
          0, 
          0.1
        );
      }
    }
  }
});
</script>