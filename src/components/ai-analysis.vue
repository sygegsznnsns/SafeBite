<script setup lang="ts">
import { ref } from 'vue'

interface AIFeature {
  icon: string
  title: string
  description: string
}

const features = ref<AIFeature[]>([
  {
    icon: '🔍',
    title: '智能识别',
    description: '使用先进的AI技术识别食品标签中的成分信息'
  },
  {
    icon: '⚡',
    title: '快速分析',
    description: '几秒钟内完成过敏原检测，实时反馈分析结果'
  },
  {
    icon: '🎯',
    title: '精准匹配',
    description: '准确匹配您关注的过敏原，提供个性化建议'
  },
  {
    icon: '📊',
    title: '详细报告',
    description: '生成详细的分析报告，包含风险评估和建议'
  }
])

const stats = ref([
  { label: '分析次数', value: '1,234' },
  { label: '识别准确率', value: '98.5%' },
  { label: '用户满意度', value: '4.9/5.0' }
])
</script>

<template>
  <div class="ai-container">
    <div class="header">
      <h1 class="title">🤖 AI分析</h1>
      <p class="subtitle">智能过敏原检测系统</p>
    </div>

    <!-- AI 功能介绍 -->
    <div class="features-section">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="stats-section">
      <h2 class="section-title">系统数据</h2>
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- AI 说明 -->
    <div class="info-section">
      <div class="info-card">
        <h3>💡 如何使用</h3>
        <ol class="info-list">
          <li>在首页上传食品标签照片</li>
          <li>选择您关注的过敏原类型</li>
          <li>等待AI分析并查看结果</li>
          <li>根据建议做出食用决策</li>
        </ol>
      </div>

      <div class="info-card">
        <h3>⚠️ 注意事项</h3>
        <ul class="info-list">
          <li>请确保照片清晰可读</li>
          <li>建议在光线充足环境拍摄</li>
          <li>AI结果仅供参考</li>
          <li>严重过敏请咨询医生</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  padding: 1.5rem;
  overflow: hidden;
}

.header {
  text-align: center;
  color: var(--primary-text);
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
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 8px rgba(196, 167, 125, 0.15);
}

.subtitle {
  font-size: 1rem;
  opacity: 0.85;
  margin: 0;
  color: var(--accent-brown);
}

.section-title {
  color: var(--primary-text);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
}

.features-section {
  margin-bottom: 2rem;
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

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.feature-card {
  background: var(--warm-white);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(232, 220, 200, 0.5);
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.12);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
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

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(196, 167, 125, 0.25);
  border-color: var(--accent-brown);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 2px 4px rgba(196, 167, 125, 0.2));
  position: relative;
  z-index: 1;
  transition: transform 0.3s;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
}

.feature-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-text);
  margin: 0 0 0.5rem 0;
  position: relative;
  z-index: 1;
}

.feature-description {
  font-size: 0.85rem;
  color: var(--accent-brown);
  line-height: 1.5;
  margin: 0;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}

.stats-section {
  margin-bottom: 2rem;
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--warm-white);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid rgba(232, 220, 200, 0.5);
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(196, 167, 125, 0.2);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent-brown);
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--accent-brown) 0%, var(--selected-border) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--primary-text);
  opacity: 0.8;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.info-card {
  background: var(--warm-white);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(232, 220, 200, 0.5);
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.12);
  transition: all 0.3s;
}

.info-card:hover {
  box-shadow: 0 8px 24px rgba(196, 167, 125, 0.2);
}

.info-card h3 {
  font-size: 1.1rem;
  color: var(--primary-text);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-list {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--accent-brown);
  line-height: 1.8;
}

.info-list li {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.info-list li:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .ai-container {
    padding: 1rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
  }

  .feature-card {
    padding: 1.25rem;
  }

  .feature-icon {
    font-size: 2.25rem;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1.25rem 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .info-card {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    max-width: 200px;
    margin: 0 auto;
  }
}

/* 滚动条样式 */
.ai-container::-webkit-scrollbar {
  width: 8px;
}

.ai-container::-webkit-scrollbar-track {
  background: rgba(232, 220, 200, 0.3);
}

.ai-container::-webkit-scrollbar-thumb {
  background: var(--light-brown);
  border-radius: 4px;
}

.ai-container::-webkit-scrollbar-thumb:hover {
  background: var(--accent-brown);
}
</style>
