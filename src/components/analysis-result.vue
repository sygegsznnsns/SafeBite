<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { smartAnalyzeImage } from '../utils/gemini-api'
import type {
  SmartAnalysisResult,
  IngredientsAllergenResult,
  MenuRecommendationResult,
  FoodPhotoAnalysisResult,
  RiskLevel
} from '../utils/gemini-api'

const props = defineProps<{
  imageUrl?: string
  allergens?: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const allergenList = ref<string[]>([])
const isAnalyzing = ref(true)
const analysisResult = ref<SmartAnalysisResult | null>(null)
const errorMessage = ref('')

// 从 .env 读取 API Key（Vite 约定需要 VITE_ 前缀）
const API_KEY = (import.meta as any).env.VITE_DASHSCOPE_API_KEY as string | undefined
const BASE_URL = (import.meta as any).env.VITE_DASHSCOPE_BASE_URL as string | undefined

onMounted(async () => {
  if (props.allergens) {
    allergenList.value = props.allergens
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
  }

  if (props.imageUrl) {
    await performAnalysis()
  } else {
    isAnalyzing.value = false
    errorMessage.value = '未提供图片'
  }
})

const performAnalysis = async () => {
  if (!props.imageUrl) return

  isAnalyzing.value = true
  analysisResult.value = null
  errorMessage.value = ''

  try {
    if (!API_KEY) {
      isAnalyzing.value = false
      errorMessage.value = '未配置 API 密钥，请在 .env 中设置 VITE_DASHSCOPE_API_KEY'
      ElMessage.error('未配置 API 密钥，请在 .env 中设置 VITE_DASHSCOPE_API_KEY')
      return
    }
    const result = await smartAnalyzeImage(props.imageUrl, allergenList.value, {
      apiKey: API_KEY,
      baseURL: BASE_URL,
      detail: 'high',
      maxTokens: 4096,
      temperature: 0.3,
      onError: (error: Error) => {
        console.error('Analysis error:', error)
        errorMessage.value = error.message
        ElMessage.error('分析失败：' + error.message)
      },
      onComplete: () => {
        isAnalyzing.value = false
        if (!errorMessage.value) {
          ElMessage.success('分析完成')
        }
      }
    })

    analysisResult.value = result
    isAnalyzing.value = false

    if (result.imageType === 'unknown' || !result.result) {
      errorMessage.value = result.errorMessage || '无法识别图片类型'
      ElMessage.warning('未能识别图片内容')
    }
  } catch (error) {
    console.error('Failed to analyze:', error)
    isAnalyzing.value = false
    errorMessage.value = error instanceof Error ? error.message : '分析失败'
    ElMessage.error('分析出错，请重试')
  }
}

const handleBack = () => {
  emit('back')
}

const retryAnalysis = () => {
  performAnalysis()
}

// 获取风险等级的样式类
const getRiskClass = (risk: RiskLevel): string => {
  const classMap: Record<RiskLevel, string> = {
    safe: 'risk-safe',
    low: 'risk-low',
    high: 'risk-high'
  }
  return classMap[risk]
}

// 获取风险等级的中文文本
const getRiskText = (risk: RiskLevel): string => {
  const textMap: Record<RiskLevel, string> = {
    safe: '安全',
    low: '低风险',
    high: '高风险'
  }
  return textMap[risk]
}

// 获取风险等级的图标
const getRiskIcon = (risk: RiskLevel): string => {
  const iconMap: Record<RiskLevel, string> = {
    safe: '✅',
    low: '⚠️',
    high: '❌'
  }
  return iconMap[risk]
}

// 获取图片类型的中文文本
const getImageTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    ingredients: '配料表',
    menu: '菜单',
    food: '食物照片',
    unknown: '未知'
  }
  return typeMap[type] || type
}
</script>

<template>
  <div class="analysis-container">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-btn" @click="handleBack">
        <el-icon :size="20">
          <ArrowLeft />
        </el-icon>
        <span>返回</span>
      </button>
      <h1 class="title">分析结果</h1>
    </div>

    <!-- 分析中状态 -->
    <div v-if="isAnalyzing" class="analyzing">
      <div class="spinner"></div>
      <p>正在使用 SafeBite AI 分析图片...</p>
      <p class="analyzing-tip">AI 正在识别食品信息，请稍候</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>分析失败</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <button class="retry-btn" @click="retryAnalysis">重新分析</button>
    </div>

    <!-- 分析结果 -->
    <div v-else-if="analysisResult" class="result-content">
      <!-- 上传的图片 -->
      <div class="image-preview">
        <img :src="imageUrl" alt="上传的图片" />
      </div>

      <!-- 图片类型识别 -->
      <div class="type-card">
        <h2>🔍 识别类型</h2>
        <div class="type-info">
          <span class="type-badge">{{ getImageTypeText(analysisResult.imageType) }}</span>
          <span class="confidence">置信度: {{ (analysisResult.confidence * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 你关注的过敏源 -->
      <div v-if="allergenList.length > 0" class="allergen-section">
        <h2>📋 你关注的过敏源</h2>
        <div class="allergen-tags">
          <span v-for="allergen in allergenList" :key="allergen" class="allergen-tag">
            {{ allergen }}
          </span>
        </div>
      </div>

      <!-- 配料表分析结果 -->
      <div
        v-if="analysisResult.imageType === 'ingredients' && analysisResult.result && 'allergens' in analysisResult.result"
        class="result-card">
        <h2>🧪 配料表过敏源分析</h2>

        <!-- 总体风险 -->
        <div class="risk-overview">
          <span :class="['risk-badge', getRiskClass((analysisResult.result as IngredientsAllergenResult).riskLevel)]">
            {{ getRiskIcon((analysisResult.result as IngredientsAllergenResult).riskLevel) }}
            {{ getRiskText((analysisResult.result as IngredientsAllergenResult).riskLevel) }}
          </span>
        </div>

        <!-- 检测到的过敏源 -->
        <div v-if="(analysisResult.result as IngredientsAllergenResult).allergens.length > 0" class="detected-section">
          <h3>⚠️ 检测到的过敏源</h3>
          <div class="allergen-list">
            <span
              v-for="allergen in (analysisResult.result as IngredientsAllergenResult).allergens"
              :key="allergen"
              class="detected-allergen">
              {{ allergen }}
            </span>
          </div>
        </div>

        <!-- 详细分析 -->
        <div class="details-section">
          <h3>📝 详细分析</h3>
          <div v-for="detail in (analysisResult.result as IngredientsAllergenResult).details" :key="detail.allergen" class="detail-item">
            <div class="detail-header">
              <span class="allergen-name">{{ detail.allergen }}</span>
              <span :class="['status', detail.found ? 'status-found' : 'status-safe']">
                {{ detail.found ? '❌ 含有' : '✅ 安全' }}
              </span>
            </div>
            <div v-if="detail.ingredients.length > 0" class="ingredients-list">相关成分: {{ detail.ingredients.join('、') }}</div>
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="suggestion-section">
          <h3>💡 安全建议</h3>
          <p class="suggestion-text">{{ (analysisResult.result as IngredientsAllergenResult).suggestion }}</p>
        </div>
      </div>

      <!-- 菜单建议结果 -->
      <div
        v-if="analysisResult.imageType === 'menu' && analysisResult.result && 'recommendations' in analysisResult.result"
        class="result-card">
        <h2>🍽️ 菜单分析建议</h2>

        <!-- 推荐菜品 -->
        <div v-if="(analysisResult.result as MenuRecommendationResult).recommendations.length > 0" class="recommend-section">
          <h3>⭐ 推荐菜品</h3>
          <ul class="dish-list">
            <li v-for="dish in (analysisResult.result as MenuRecommendationResult).recommendations" :key="dish" class="dish-item recommend">
              {{ dish }}
            </li>
          </ul>
        </div>

        <!-- 菜品风险分析 -->
        <div class="dishes-risk-section">
          <h3>📊 菜品风险分析</h3>
          <div v-for="dish in (analysisResult.result as MenuRecommendationResult).dishRisks" :key="dish.dishName" class="dish-risk-item">
            <div class="dish-risk-header">
              <span class="dish-name">{{ dish.dishName }}</span>
              <span :class="['risk-badge', getRiskClass(dish.riskLevel)]">
                {{ getRiskIcon(dish.riskLevel) }}
                {{ getRiskText(dish.riskLevel) }}
              </span>
            </div>
            <div v-if="dish.allergens.length > 0" class="dish-allergens">可能含有: {{ dish.allergens.join('、') }}</div>
            <div class="dish-reason">{{ dish.reason }}</div>
          </div>
        </div>

        <!-- 快速分类 -->
        <div class="quick-categories">
          <div v-if="(analysisResult.result as MenuRecommendationResult).safeDishes.length > 0" class="category-section">
            <h4>✅ 安全菜品</h4>
            <div class="category-tags">
              <span v-for="dish in (analysisResult.result as MenuRecommendationResult).safeDishes" :key="dish" class="category-tag safe">
                {{ dish }}
              </span>
            </div>
          </div>

          <div v-if="(analysisResult.result as MenuRecommendationResult).warningDishes.length > 0" class="category-section">
            <h4>⚠️ 需警惕菜品</h4>
            <div class="category-tags">
              <span
                v-for="dish in (analysisResult.result as MenuRecommendationResult).warningDishes"
                :key="dish"
                class="category-tag warning">
                {{ dish }}
              </span>
            </div>
          </div>

          <div v-if="(analysisResult.result as MenuRecommendationResult).avoidDishes.length > 0" class="category-section">
            <h4>❌ 应避免菜品</h4>
            <div class="category-tags">
              <span v-for="dish in (analysisResult.result as MenuRecommendationResult).avoidDishes" :key="dish" class="category-tag avoid">
                {{ dish }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 食物照片分析结果 -->
      <div v-if="analysisResult.imageType === 'food' && analysisResult.result && 'foods' in analysisResult.result" class="result-card">
        <h2>📸 食物照片分析</h2>

        <!-- 总体风险 -->
        <div class="risk-overview">
          <span :class="['risk-badge', getRiskClass((analysisResult.result as FoodPhotoAnalysisResult).overallRisk)]">
            {{ getRiskIcon((analysisResult.result as FoodPhotoAnalysisResult).overallRisk) }}
            总体风险: {{ getRiskText((analysisResult.result as FoodPhotoAnalysisResult).overallRisk) }}
          </span>
        </div>

        <!-- 识别的食物 -->
        <div class="foods-section">
          <h3>🍱 识别的食物</h3>
          <div v-for="food in (analysisResult.result as FoodPhotoAnalysisResult).foods" :key="food.name" class="food-item">
            <div class="food-header">
              <span class="food-name">{{ food.name }}</span>
              <span :class="['risk-badge', getRiskClass(food.riskLevel)]">
                {{ getRiskIcon(food.riskLevel) }}
                {{ getRiskText(food.riskLevel) }}
              </span>
            </div>
            <div class="food-info">
              <div v-if="food.possibleAllergens.length > 0" class="food-allergens">
                可能的过敏源: {{ food.possibleAllergens.join('、') }}
              </div>
              <div class="food-confidence">
                识别置信度: <span class="confidence-value">{{ (food.confidence * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 建议 -->
        <div class="suggestion-section">
          <h3>💡 建议</h3>
          <p class="suggestion-text">{{ (analysisResult.result as FoodPhotoAnalysisResult).suggestion }}</p>
        </div>
      </div>

      <!-- 重新分析按钮 -->
      <button class="reanalyze-btn" @click="retryAnalysis">🔄 重新分析</button>
    </div>
  </div>
</template>

<style scoped>
.analysis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  padding: 1rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  color: var(--primary-text);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--warm-white);
  border: 2px solid var(--light-brown);
  border-radius: 12px;
  color: var(--primary-text);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(139, 111, 71, 0.1);
}

.back-btn:hover {
  background: var(--primary-bg);
  border-color: var(--accent-brown);
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(139, 111, 71, 0.15);
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--primary-text);
}

.analyzing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--primary-text);
  gap: 1rem;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--light-brown);
  border-top-color: var(--accent-brown);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.analyzing p {
  color: var(--primary-text);
  font-weight: 500;
}

.analyzing-tip {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
  color: var(--primary-text);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--primary-text);
  gap: 1rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
}

.error-state h2 {
  color: var(--primary-text);
}

.error-message {
  max-width: 80%;
  opacity: 0.9;
  color: var(--primary-text);
}

.retry-btn,
.reanalyze-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--accent-brown) 0%, #b89968 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(139, 111, 71, 0.2);
}

.retry-btn:hover,
.reanalyze-btn:hover {
  background: linear-gradient(135deg, #b89968 0%, var(--accent-brown) 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 111, 71, 0.3);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.image-preview {
  background: var(--warm-white);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(139, 111, 71, 0.15);
  border: 2px solid var(--light-brown);
}

.image-preview img {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 12px;
  display: block;
}

.type-card,
.allergen-section,
.result-card {
  background: var(--warm-white);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(139, 111, 71, 0.15);
  border: 2px solid var(--light-brown);
}

.type-card h2,
.allergen-section h2,
.result-card h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--primary-text);
  font-weight: 600;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.type-badge {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--accent-brown) 0%, #b89968 100%);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(139, 111, 71, 0.2);
}

.confidence {
  color: #9a7b5a;
  font-size: 0.9rem;
  font-weight: 500;
}

.allergen-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.allergen-tag {
  padding: 0.5rem 1rem;
  background: var(--selected-bg);
  color: var(--primary-text);
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9rem;
  border: 1px solid var(--selected-border);
}

/* 风险等级样式 */
.risk-overview {
  margin-bottom: 1.5rem;
}

.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.risk-safe {
  background: #d4edda;
  color: #2d5a3d;
  border: 2px solid #9ed4a8;
}

.risk-low {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #f0d899;
}

.risk-high {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #f0adb3;
}

/* 配料表分析样式 */
.detected-section {
  margin-bottom: 1.5rem;
}

.detected-section h3,
.details-section h3,
.suggestion-section h3 {
  font-size: 1.1rem;
  color: var(--primary-text);
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.allergen-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.detected-allergen {
  padding: 0.5rem 1rem;
  background: #fee;
  color: #c00;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9rem;
  border: 1px solid #fcc;
}

.details-section {
  margin-bottom: 1.5rem;
}

.detail-item {
  padding: 1rem;
  background: var(--primary-bg);
  border-radius: 12px;
  margin-bottom: 0.75rem;
  border: 1px solid var(--light-brown);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.allergen-name {
  font-weight: 600;
  color: var(--primary-text);
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-found {
  background: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.status-safe {
  background: #d4edda;
  color: #2d5a3d;
  border: 1px solid #9ed4a8;
}

.ingredients-list {
  color: #9a7b5a;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.suggestion-section {
  padding: 1rem;
  background: var(--selected-bg);
  border-radius: 12px;
  border: 1px solid var(--selected-border);
}

.suggestion-text {
  color: var(--primary-text);
  line-height: 1.6;
  margin: 0;
}

/* 菜单分析样式 */
.recommend-section {
  margin-bottom: 1.5rem;
}

.recommend-section h3,
.dishes-risk-section h3 {
  font-size: 1.1rem;
  color: var(--primary-text);
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.dish-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dish-item {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
}

.dish-item.recommend {
  background: #d4edda;
  color: #2d5a3d;
  border: 1px solid #9ed4a8;
}

.dishes-risk-section {
  margin-bottom: 1.5rem;
}

.dish-risk-item {
  padding: 1rem;
  background: var(--primary-bg);
  border-radius: 12px;
  margin-bottom: 0.75rem;
  border: 1px solid var(--light-brown);
}

.dish-risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.dish-name {
  font-weight: 600;
  color: var(--primary-text);
  flex: 1;
}

.dish-allergens {
  color: #c00;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.dish-reason {
  color: #9a7b5a;
  font-size: 0.9rem;
}

.quick-categories {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-section h4 {
  font-size: 1rem;
  color: var(--primary-text);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-tag {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9rem;
}

.category-tag.safe {
  background: #d4edda;
  color: #2d5a3d;
  border: 1px solid #9ed4a8;
}

.category-tag.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #f0d899;
}

.category-tag.avoid {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f0adb3;
}

/* 食物照片分析样式 */
.foods-section {
  margin-bottom: 1.5rem;
}

.foods-section h3 {
  font-size: 1.1rem;
  color: var(--primary-text);
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.food-item {
  padding: 1rem;
  background: var(--primary-bg);
  border-radius: 12px;
  margin-bottom: 0.75rem;
  border: 1px solid var(--light-brown);
}

.food-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.food-name {
  font-weight: 600;
  color: var(--primary-text);
  flex: 1;
}

.food-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.food-allergens {
  color: #c00;
  font-size: 0.9rem;
  font-weight: 500;
}

.food-confidence {
  color: #9a7b5a;
  font-size: 0.9rem;
}

.confidence-value {
  font-weight: 600;
  color: var(--accent-brown);
}

.reanalyze-btn {
  align-self: center;
  width: fit-content;
}

@media (max-width: 768px) {
  .analysis-container {
    padding: 0.75rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .image-preview img {
    max-height: 300px;
  }

  .dish-risk-header,
  .food-header,
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
