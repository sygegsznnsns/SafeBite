<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import type { UploadProps, UploadRequestOptions } from 'element-plus'

// 常见过敏源列表
const allergensList = [
  { id: 'milk', name: '牛奶', icon: '🥛', color: '#F5EFE7' },
  { id: 'eggs', name: '鸡蛋', icon: '🥚', color: '#FFF8E8' },
  { id: 'fish', name: '鱼类', icon: '🐟', color: '#EBF5F0' },
  { id: 'shellfish', name: '贝类', icon: '🦐', color: '#FDE8EC' },
  { id: 'tree-nuts', name: '坚果', icon: '🥜', color: '#F5EDE8' },
  { id: 'peanuts', name: '花生', icon: '🥜', color: '#FFF9E0' },
  { id: 'wheat', name: '小麦', icon: '🌾', color: '#F0EBE3' },
  { id: 'soybeans', name: '大豆', icon: '🫘', color: '#EDF5E8' },
  { id: 'sesame', name: '芝麻', icon: '🌰', color: '#FCF0E8' },
  { id: 'gluten', name: '麸质', icon: '🍞', color: '#EEF5F0' }
]

// 选中的过敏源
const selectedAllergens = ref<string[]>([])

// 是否正在处理
const isProcessing = ref(false)

// 切换过敏源选择
const toggleAllergen = (allergenId: string) => {
  const index = selectedAllergens.value.indexOf(allergenId)
  if (index > -1) {
    selectedAllergens.value.splice(index, 1)
  } else {
    selectedAllergens.value.push(allergenId)
  }
}

// 检查是否选中
const isSelected = (allergenId: string) => {
  return selectedAllergens.value.includes(allergenId)
}

// 上传前的验证
const beforeUpload: UploadProps['beforeUpload'] = rawFile => {
  console.log('Before upload:', rawFile.name, rawFile.type, rawFile.size)

  // 验证文件类型
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  // 验证文件大小（10MB）
  if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }

  return true
}

// 自定义上传方法
const customUpload = (options: UploadRequestOptions) => {
  const file = options.file as File

  if (isProcessing.value) {
    console.log('Already processing, skipping...')
    return
  }

  processFile(file)
}

// 处理文件并跳转
const processFile = (file: File) => {
  isProcessing.value = true

  try {
    console.log('Processing file:', file.name)

    ElMessage.success('图片上传成功!')

    // 生成图片 URL
    const imageUrl = URL.createObjectURL(file)
    console.log('Generated image URL:', imageUrl.substring(0, 50) + '...')

    // 获取选中的过敏源名称
    const allergenNames = selectedAllergens.value
      .map(id => allergensList.find(a => a.id === id)?.name)
      .filter(Boolean)
      .join(',')

    console.log('Selected allergens:', allergenNames || '(none)')

    // 构建哈希 URL 参数
    const params = new URLSearchParams({
      image: imageUrl,
      allergens: allergenNames
    })

    const targetHash = `#analysis?${params.toString()}`
    console.log('Navigating to:', targetHash)

    // 使用纯哈希跳转
    window.location.hash = targetHash

    // 重置处理状态
    setTimeout(() => {
      isProcessing.value = false
    }, 1000)
  } catch (error) {
    console.error('Error processing file:', error)
    ElMessage.error('处理图片失败，请重试')
    isProcessing.value = false
  }
}

// 上传失败处理
const handleError = () => {
  ElMessage.error('上传失败，请重试')
  isProcessing.value = false
}
</script>

<template>
  <div class="upload-container">
    <!-- 顶部标题 -->
    <div class="header">
      <h1 class="title">🍽️ 食物过敏原检测</h1>
      <p class="subtitle">上传配料表、菜单或食物照片，我们帮你识别潜在过敏原</p>
    </div>

    <!-- 过敏源选择区域 -->
    <div class="allergens-section">
      <div class="section-title">
        <span class="icon">⚠️</span>
        <h2>选择你的过敏源</h2>
        <span class="hint">(可选)</span>
      </div>
      <p class="section-desc">选择你对哪些食物过敏，我们会重点检测</p>

      <div class="allergens-grid">
        <div
          v-for="allergen in allergensList"
          :key="allergen.id"
          :class="['allergen-card', { selected: isSelected(allergen.id) }]"
          :style="{ '--card-color': allergen.color }"
          @click="toggleAllergen(allergen.id)">
          <div class="allergen-icon">{{ allergen.icon }}</div>
          <div class="allergen-name">{{ allergen.name }}</div>
          <div class="check-mark">
            <svg v-if="isSelected(allergen.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div v-if="selectedAllergens.length > 0" class="selected-summary">
        <span class="summary-icon">✓</span>
        已选择 {{ selectedAllergens.length }} 种过敏源
      </div>
    </div>

    <!-- 上传按钮区域 -->
    <div class="upload-section">
      <el-upload
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="customUpload"
        :on-error="handleError"
        accept="image/*"
        :disabled="isProcessing">
        <!-- 使用 capture 属性调起相机 -->
        <template #trigger>
          <button class="upload-button" :disabled="isProcessing">
            <el-icon :size="24" class="camera-icon">
              <Camera />
            </el-icon>
            <span class="button-text">
              {{ isProcessing ? '处理中...' : '拍摄配料表、菜单或食物' }}
            </span>
          </button>
        </template>
      </el-upload>
    </div>

    <!-- 使用说明 -->
    <div class="instructions">
      <div class="instruction-item">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>选择过敏源</h3>
          <p>点击卡片选择你的过敏食物（可跳过）</p>
        </div>
      </div>
      <div class="instruction-item">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>拍照上传</h3>
          <p>点击底部按钮拍摄或选择照片</p>
        </div>
      </div>
      <div class="instruction-item">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>查看结果</h3>
          <p>AI 自动分析并给出过敏风险提示</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 全局 CSS 变量定义 - 不加 scoped */
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
</style>

<style scoped>
/* 主题色定义 */

.upload-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4ba 100%);
  padding: 2rem 1rem;
  padding-bottom: 8rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  color: var(--primary-text);
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(196, 167, 125, 0.15);
  color: var(--primary-text);
}

.subtitle {
  font-size: 1rem;
  opacity: 0.85;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  color: var(--accent-brown);
}

.allergens-section {
  background: var(--warm-white);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(232, 220, 200, 0.5);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.section-title .icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(196, 167, 125, 0.2));
}

.section-title h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--primary-text);
}

.section-title .hint {
  font-size: 0.875rem;
  color: var(--accent-brown);
  font-weight: normal;
  opacity: 0.8;
}

.section-desc {
  color: var(--accent-brown);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
}

.allergens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.allergen-card {
  position: relative;
  background: var(--card-color);
  border: 2px solid rgba(232, 220, 200, 0.5);
  border-radius: 16px;
  padding: 1.25rem 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  user-select: none;
  box-shadow: 0 2px 8px rgba(196, 167, 125, 0.08);
}

.allergen-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(196, 167, 125, 0.18);
  border-color: var(--accent-brown);
}

.allergen-card.selected {
  border-color: var(--selected-border);
  background: var(--selected-bg);
  box-shadow: 0 4px 16px rgba(212, 165, 116, 0.25);
}

.allergen-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(139, 111, 71, 0.1));
}

.allergen-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--primary-text);
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--accent-brown) 0%, var(--selected-border) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(212, 165, 116, 0.3);
}

.allergen-card.selected .check-mark {
  opacity: 1;
  transform: scale(1);
}

.check-mark svg {
  width: 14px;
  height: 14px;
  stroke: white;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.selected-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--selected-bg);
  border-radius: 12px;
  color: var(--primary-text);
  font-weight: 600;
  border: 1px solid var(--selected-border);
  box-shadow: 0 2px 8px rgba(212, 165, 116, 0.15);
}

.summary-icon {
  font-size: 1.25rem;
  color: var(--accent-brown);
}

.upload-section {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: var(--warm-white);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(196, 167, 125, 0.15);
  z-index: 100;
  border-top: 1px solid var(--light-brown);
}

/* 覆盖 el-upload 的默认样式 */
.upload-section :deep(.el-upload) {
  width: 100%;
  display: block;
}

.upload-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #c4a77d 0%, #d4a574 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(212, 165, 116, 0.3);
}

.upload-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #d4a574 0%, #c4a77d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 165, 116, 0.4);
}

.upload-button:active:not(:disabled) {
  transform: translateY(0);
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.camera-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(139, 111, 71, 0.2));
}

.instructions {
  background: var(--warm-white);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.12);
  margin-bottom: 2rem;
  border: 1px solid rgba(232, 220, 200, 0.5);
}

.instruction-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.instruction-item:last-child {
  margin-bottom: 0;
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent-brown) 0%, var(--selected-border) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  box-shadow: 0 3px 10px rgba(212, 165, 116, 0.25);
}

.step-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: var(--primary-text);
  font-weight: 600;
}

.step-content p {
  margin: 0;
  color: var(--accent-brown);
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .upload-container {
    padding: 1.5rem 1rem 4rem 1rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .allergens-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .allergen-card {
    padding: 1rem 0.5rem;
  }

  .allergen-icon {
    font-size: 2rem;
  }

  .upload-section {
    padding: 1rem;
  }

  .upload-button {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
}

/* 滚动条样式 */
.upload-container::-webkit-scrollbar {
  width: 8px;
}

.upload-container::-webkit-scrollbar-track {
  background: rgba(232, 220, 200, 0.3);
}

.upload-container::-webkit-scrollbar-thumb {
  background: var(--light-brown);
  border-radius: 4px;
}

.upload-container::-webkit-scrollbar-thumb:hover {
  background: var(--accent-brown);
}
</style>
