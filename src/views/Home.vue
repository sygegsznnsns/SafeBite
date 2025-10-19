<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import RegionSelector, { type Region } from '../components/region-selector.vue'
import UploadImage from '../components/upload-image.vue'
import RecordList from '../components/record-list.vue'
import AIAnalysis from '../components/ai-analysis.vue'

type TabType = 'home' | 'records' | 'ai'

const currentTab = ref<TabType>('home')
const selectedRegion = ref<Region | null>(null)

// 从 localStorage 读取已保存的地区
onMounted(() => {
  const savedRegion = localStorage.getItem('selectedRegion')
  if (savedRegion) {
    try {
      selectedRegion.value = JSON.parse(savedRegion)
    } catch (e) {
      console.error('Failed to parse saved region:', e)
    }
  }

  handleHashChange()
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange)
})

// 监听哈希变化
const handleHashChange = () => {
  const hash = window.location.hash.slice(1) // 去掉 #

  // 检查是否在分析结果页面
  if (hash.startsWith('analysis')) {
    return // 不处理，保持在分析页面
  }

  // 处理 tab 切换
  if (hash === 'records') {
    currentTab.value = 'records'
  } else if (hash === 'ai') {
    currentTab.value = 'ai'
  } else if (hash === '' || hash === 'home') {
    currentTab.value = 'home'
  }
}

// 切换 tab
const switchTab = (tab: TabType) => {
  currentTab.value = tab
  window.location.hash = tab === 'home' ? '' : tab
}

// 选择地区
const handleRegionSelect = (region: Region) => {
  selectedRegion.value = region
  // 保存到 localStorage
  localStorage.setItem('selectedRegion', JSON.stringify(region))
}

// 重新选择地区
const resetRegion = () => {
  selectedRegion.value = null
  localStorage.removeItem('selectedRegion')
}
</script>

<template>
  <div class="home-container">
    <!-- 主内容区域 -->
    <div class="content">
      <!-- 首页 Tab -->
      <template v-if="currentTab === 'home'">
        <!-- 未选择地区时显示地区选择器 -->
        <RegionSelector v-if="!selectedRegion" @select="handleRegionSelect" />

        <!-- 已选择地区时显示上传组件 -->
        <div v-else class="upload-wrapper">
          <!-- 地区信息条 -->
          <div class="region-banner">
            <div class="region-info">
              <span class="region-flag">{{ selectedRegion.flag }}</span>
              <span class="region-name">{{ selectedRegion.name }}</span>
            </div>
            <button class="change-region-btn" @click="resetRegion">更改地区</button>
          </div>

          <!-- 上传组件 -->
          <UploadImage />
        </div>
      </template>

      <!-- 查看记录 Tab -->
      <RecordList v-show="currentTab === 'records'" />

      <!-- AI分析 Tab -->
      <AIAnalysis v-show="currentTab === 'ai'" />
    </div>

    <!-- 底部 Tab 栏 -->
    <div class="tab-bar">
      <div class="tab-item" :class="{ active: currentTab === 'home' }" @click="switchTab('home')">
        <div class="tab-icon">🏠</div>
        <div class="tab-label">首页</div>
      </div>

      <div class="tab-item" :class="{ active: currentTab === 'records' }" @click="switchTab('records')">
        <div class="tab-icon">📋</div>
        <div class="tab-label">查看记录</div>
      </div>

      <div class="tab-item" :class="{ active: currentTab === 'ai' }" @click="switchTab('ai')">
        <div class="tab-icon">🤖</div>
        <div class="tab-label">AI分析</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-bg: #fff9f0; /* 温暖白色背景 - 更明亮 */
  --primary-text: #8b6f47; /* 浅棕色文字 - 更柔和 */
  --accent-brown: #c4a77d; /* 金棕色强调 - 更轻快 */
  --light-brown: #e8dcc8; /* 奶油棕色 - 更温柔 */
  --warm-white: #fffdf8; /* 纯净暖白 */
  --selected-bg: #fff4e0; /* 淡黄棕色 - 选中状态更明亮 */
  --selected-border: #d4a574; /* 暖金色边框 */
  --gradient-start: #f5e6d3; /* 浅奶茶色 - 渐变起始 */
  --gradient-end: #e8d4ba; /* 浅驼色 - 渐变结束 */
}

.home-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--primary-bg);
}

.content {
  flex: 1;
  padding-bottom: 70px; /* 为底部 tab 栏预留空间 */
  overflow-y: auto;
  background: var(--primary-bg);
}

.upload-wrapper {
  display: flex;
  flex-direction: column;
}

.region-banner {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8dcc8 100%);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(196, 167, 125, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.region-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--primary-text);
}

.region-flag {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(139, 111, 71, 0.1));
}

.region-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-text);
  text-shadow: 0 1px 2px rgba(139, 111, 71, 0.08);
}

.change-region-btn {
  padding: 0.5rem 1.25rem;
  background: var(--warm-white);
  border: 1.5px solid var(--accent-brown);
  border-radius: 20px;
  color: var(--primary-text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.change-region-btn:hover {
  background: var(--selected-bg);
  border-color: var(--selected-border);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

.change-region-btn:active {
  transform: translateY(0);
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--warm-white);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 12px rgba(196, 167, 125, 0.12);
  z-index: 1000;
  border-top: 1px solid var(--light-brown);
  backdrop-filter: blur(10px);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 0;
  position: relative;
}

.tab-item:active {
  transform: scale(0.95);
}

.tab-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-brown) 0%, var(--selected-border) 100%);
  border-radius: 0 0 3px 3px;
  transition: width 0.3s ease;
}

.tab-item.active::before {
  width: 40px;
}

.tab-icon {
  font-size: 24px;
  transition: transform 0.3s ease, filter 0.3s ease;
  filter: grayscale(0.4) brightness(1.1);
}

.tab-item.active .tab-icon {
  filter: grayscale(0) brightness(1);
}

.tab-label {
  font-size: 12px;
  color: var(--accent-brown);
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-item.active .tab-icon {
  transform: scale(1.1);
}

.tab-item.active .tab-label {
  color: var(--primary-text);
  font-weight: 600;
}

@media (max-width: 768px) {
  .tab-bar {
    height: 55px;
  }

  .tab-icon {
    font-size: 22px;
  }

  .tab-label {
    font-size: 11px;
  }

  .content {
    padding-bottom: 65px;
  }

  .region-banner {
    padding: 0.75rem 1rem;
  }

  .region-flag {
    font-size: 1.5rem;
  }

  .region-name {
    font-size: 1rem;
  }

  .change-region-btn {
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
  }
}

/* 滚动条样式优化 */
.content::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.content::-webkit-scrollbar-thumb {
  background: var(--light-brown);
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: var(--accent-brown);
}
</style>
