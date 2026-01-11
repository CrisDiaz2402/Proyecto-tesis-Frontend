<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import TheAvatar from './components/TheAvatar.vue';
</script>

<template>
  <div class="w-full h-screen bg-gray-900">
    
    <TresCanvas
      window-size
      clear-color="#111827"
      presets="realistic"
      shadows
    >
      <TresPerspectiveCamera
        :position="[0, 1.7, 1.3]"
        :look-at="[0, 1.65, 0]"
        :fov="45"
      />

      <OrbitControls 
        :target="[0, 1.65, 0]"
        enable-damping
      />

      <TresAmbientLight :intensity="1.5" />
      <TresDirectionalLight 
        :position="[2, 4, 5]" 
        :intensity="2" 
        cast-shadow 
      />

      <Suspense>
        <TheAvatar />
        
        <template #fallback>
          <TresMesh :position="[0, 1.5, 0]">
            <TresBoxGeometry />
            <TresMeshBasicMaterial color="red" wireframe />
          </TresMesh>
        </template>
      </Suspense>

    </TresCanvas>
  </div>
</template>

<style>
/* Reset básico para asegurar que ocupe toda la pantalla */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>