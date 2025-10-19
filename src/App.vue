<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Home from './views/Home.vue'
import AnalysisResult from './components/analysis-result.vue'

const currentPage = ref<'home' | 'analysis'>('home')

const pageParams = ref<{
  image?: string
  allergens?: string
}>({})

const handleHashChange = () => {
  const hash = window.location.hash.slice(1)

  if (hash.startsWith('analysis')) {
    currentPage.value = 'analysis'
    const params = new URLSearchParams(hash.split('?')[1] || '')
    pageParams.value = {
      image: params.get('image') || undefined,
      allergens: params.get('allergens') || undefined
    }
  } else {
    currentPage.value = 'home'
    pageParams.value = {}
  }
}

const backToHome = () => {
  window.location.hash = ''
}

onMounted(() => {
  handleHashChange()
  window.addEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="app-container">
    <Home v-if="currentPage === 'home'" />

    <AnalysisResult
      v-else-if="currentPage === 'analysis'"
      :image-url="pageParams.image"
      :allergens="pageParams.allergens"
      @back="backToHome" />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
}
</style>
