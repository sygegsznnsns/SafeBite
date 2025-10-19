<script setup lang="ts">
import { ref } from 'vue'

export interface Region {
  code: string
  flag: string
  name: string
  description: string
}

const emit = defineEmits<{
  (e: 'select', region: Region): void
}>()

const regions = ref<Region[]>([
  {
    code: 'CN',
    flag: '🇨🇳',
    name: '中国大陆',
    description: '包含本地常见过敏源分类'
  },
  {
    code: 'US',
    flag: '🇺🇸',
    name: '美国',
    description: 'FDA 认定的主要过敏源'
  },
  {
    code: 'EU',
    flag: '🇪🇺',
    name: '欧洲',
    description: 'EU 法规规定的过敏源'
  },
  {
    code: 'JP',
    flag: '🇯🇵',
    name: '日本',
    description: '日本厚生劳动省规定'
  },
  {
    code: 'GLOBAL',
    flag: '🌍',
    name: '国际通用',
    description: 'WHO 推荐的全球标准'
  }
])

const selectRegion = (region: Region) => {
  emit('select', region)
}
</script>

<template>
  <div class="region-selector-container">
    <div class="header">
      <h1 class="title">选择您的地区 🌍</h1>
      <p class="subtitle">不同地区的过敏源分类可能有所差异</p>
    </div>

    <div class="regions-grid">
      <div v-for="region in regions" :key="region.code" class="region-card" @click="selectRegion(region)">
        <div class="region-flag">{{ region.flag }}</div>
        <h2 class="region-name">{{ region.name }}</h2>
        <p class="region-description">{{ region.description }}</p>
      </div>
    </div>

    <div class="footer-tip">
      <p>💡 选择后可在设置中随时更改</p>
    </div>
  </div>
</template>

<style scoped>
.region-selector-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4ba 100%);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  color: #8b6f47;
  margin-bottom: 2rem;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 8px rgba(196, 167, 125, 0.15);
}

.subtitle {
  font-size: 0.95rem;
  opacity: 0.85;
  margin: 0;
  line-height: 1.5;
  color: #c4a77d;
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.region-card {
  background: #fffdf8;
  border-radius: 16px;
  padding: 1.25rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.12);
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(232, 220, 200, 0.5);
}

.region-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(196, 167, 125, 0.1) 0%, rgba(212, 165, 116, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.region-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 28px rgba(196, 167, 125, 0.25);
  border-color: #c4a77d;
}

.region-card:hover::before {
  opacity: 1;
}

.region-card:active {
  transform: translateY(-3px) scale(0.98);
}

.region-flag {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  transition: transform 0.3s;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(196, 167, 125, 0.2));
}

.region-card:hover .region-flag {
  transform: scale(1.15) rotate(5deg);
}

.region-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #8b6f47;
  margin: 0 0 0.5rem 0;
  position: relative;
  z-index: 1;
}

.region-description {
  font-size: 0.85rem;
  color: #c4a77d;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
  min-height: auto;
  position: relative;
  z-index: 1;
  opacity: 0.9;
}

.select-arrow {
  font-size: 1.25rem;
  color: #c4a77d;
  font-weight: bold;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s;
  position: relative;
  z-index: 1;
  margin-top: auto;
}

.region-card:hover .select-arrow {
  opacity: 1;
  transform: translateX(0);
}

.footer-tip {
  text-align: center;
  color: #8b6f47;
  margin-top: auto;
  padding-top: 1rem;
  animation: fadeIn 0.6s ease-out 0.4s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.footer-tip p {
  font-size: 0.85rem;
  opacity: 0.85;
  margin: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .region-selector-container {
    padding: 1.5rem 1rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .regions-grid {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }

  .region-card {
    padding: 1rem 0.875rem;
    min-height: 140px;
  }

  .region-flag {
    font-size: 2.5rem;
    margin-bottom: 0.4rem;
  }

  .region-name {
    font-size: 1.05rem;
    margin-bottom: 0.4rem;
  }

  .region-description {
    font-size: 0.8rem;
  }

  .select-arrow {
    font-size: 1.1rem;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .region-selector-container {
    padding: 1.25rem 0.875rem;
  }

  .header {
    margin-bottom: 1.25rem;
  }

  .title {
    font-size: 1.35rem;
  }

  .regions-grid {
    gap: 0.75rem;
  }

  .region-card {
    padding: 0.875rem;
    min-height: 130px;
  }

  .region-flag {
    font-size: 2.25rem;
  }

  .region-name {
    font-size: 1rem;
  }

  .region-description {
    font-size: 0.78rem;
  }
}

/* 平板和桌面端 - 两列布局 */
@media (min-width: 769px) and (max-width: 1024px) {
  .regions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .region-card {
    min-height: 150px;
  }
}

/* 大屏幕 - 三列布局 */
@media (min-width: 1025px) {
  .regions-grid {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .region-card {
    min-height: 155px;
  }
}
</style>
