<script setup lang="ts">
import { ref } from 'vue'

interface Record {
  id: number
  date: string
  allergens: string[]
  result: string
  imageUrl: string
}

// 使用 Base64 编码的占位图（温暖的米色调）
const placeholderImage =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZjNlMCIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfjaU8L3RleHQ+Cjwvc3ZnPg=='

// 示例数据
const records = ref<Record[]>([
  {
    id: 1,
    date: '2025-10-18 14:30',
    allergens: ['花生', '牛奶'],
    result: '检测到过敏原：花生',
    imageUrl: placeholderImage
  },
  {
    id: 2,
    date: '2025-10-18 10:20',
    allergens: ['鸡蛋', '大豆'],
    result: '未检测到过敏原',
    imageUrl: placeholderImage
  },
  {
    id: 3,
    date: '2025-10-18 09:15',
    allergens: ['海鲜'],
    result: '检测到过敏原：虾',
    imageUrl: placeholderImage
  }
])

const viewDetail = (record: Record) => {
  alert(`查看记录详情：${record.id}`)
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = placeholderImage
}
</script>

<template>
  <div class="record-container">
    <div class="header">
      <h1 class="title">📋 查看记录</h1>
      <p class="subtitle">历史分析记录</p>
    </div>

    <div class="record-list">
      <div v-for="record in records" :key="record.id" class="record-item" @click="viewDetail(record)">
        <div class="record-image">
          <img :src="record.imageUrl" :alt="`记录 ${record.id}`" @error="handleImageError" />
        </div>

        <div class="record-info">
          <div class="record-date">{{ record.date }}</div>
          <div class="record-allergens">
            <span v-for="allergen in record.allergens" :key="allergen" class="allergen-tag">
              {{ allergen }}
            </span>
          </div>
          <div class="record-result">{{ record.result }}</div>
        </div>

        <div class="record-arrow">›</div>
      </div>

      <div v-if="records.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无分析记录</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-bg: #fff9f0;
  --primary-text: #8b6f47;
  --accent-brown: #c4a77d;
  --light-brown: #e8dcc8;
  --warm-white: #fffdf8;
  --selected-bg: #fff4e0;
  --selected-border: #d4a574;
  --gradient-start: #f5e6d3;
  --gradient-end: #e8d4ba;
}

.record-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  padding: 1.5rem;
  position: relative;
}

.record-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 30%, rgba(196, 167, 125, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(139, 111, 71, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.header {
  text-align: center;
  color: var(--primary-text);
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--primary-text);
  text-shadow: 0 2px 4px rgba(139, 111, 71, 0.1);
}

.subtitle {
  font-size: 1rem;
  opacity: 0.85;
  margin: 0;
  color: var(--accent-brown);
  font-weight: 500;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.record-item {
  background: var(--warm-white);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(139, 111, 71, 0.08), 0 1px 3px rgba(139, 111, 71, 0.06);
  border: 1px solid rgba(212, 165, 116, 0.15);
  position: relative;
  overflow: hidden;
}

.record-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-brown), var(--selected-border));
  opacity: 0;
  transition: opacity 0.3s;
}

.record-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(139, 111, 71, 0.12), 0 3px 8px rgba(139, 111, 71, 0.08);
  border-color: var(--selected-border);
  background: var(--selected-bg);
}

.record-item:hover::before {
  opacity: 1;
}

.record-item:active {
  transform: translateY(-1px);
  transition-duration: 0.1s;
}

.record-image {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--light-brown);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(212, 165, 116, 0.2);
  box-shadow: 0 2px 6px rgba(139, 111, 71, 0.1);
}

.record-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-date {
  font-size: 0.85rem;
  color: var(--accent-brown);
  font-weight: 500;
  letter-spacing: 0.3px;
}

.record-allergens {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.allergen-tag {
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, var(--selected-bg) 0%, var(--light-brown) 100%);
  color: var(--primary-text);
  border-radius: 14px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid var(--selected-border);
  box-shadow: 0 1px 3px rgba(139, 111, 71, 0.08);
  transition: all 0.2s;
}

.allergen-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(139, 111, 71, 0.12);
}

.record-result {
  font-size: 0.9rem;
  color: var(--primary-text);
  font-weight: 600;
  line-height: 1.4;
}

.record-arrow {
  font-size: 1.8rem;
  color: var(--accent-brown);
  flex-shrink: 0;
  transition: all 0.3s;
  opacity: 0.6;
}

.record-item:hover .record-arrow {
  transform: translateX(4px);
  opacity: 1;
  color: var(--selected-border);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--primary-text);
  background: var(--warm-white);
  border-radius: 20px;
  border: 2px dashed var(--light-brown);
  box-shadow: 0 4px 12px rgba(139, 111, 71, 0.06);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--accent-brown);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: grayscale(20%) opacity(0.9);
}

@media (max-width: 768px) {
  .record-container {
    padding: 1rem;
  }

  .title {
    font-size: 1.65rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .record-item {
    padding: 1rem;
  }

  .record-image {
    width: 54px;
    height: 54px;
  }

  .record-date {
    font-size: 0.8rem;
  }

  .allergen-tag {
    font-size: 0.75rem;
    padding: 0.3rem 0.7rem;
  }

  .record-result {
    font-size: 0.85rem;
  }
}

/* 添加平滑的加载动画 */
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

.record-item {
  animation: fadeInUp 0.4s ease-out backwards;
}

.record-item:nth-child(1) {
  animation-delay: 0.05s;
}
.record-item:nth-child(2) {
  animation-delay: 0.1s;
}
.record-item:nth-child(3) {
  animation-delay: 0.15s;
}
.record-item:nth-child(n + 4) {
  animation-delay: 0.2s;
}
</style>
