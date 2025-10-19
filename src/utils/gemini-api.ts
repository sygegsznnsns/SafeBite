/**
 * Gemini 2.5 Pro API 图片分析工具 - 扩展版
 */

interface ImageAnalysisOptions {
  apiKey: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
  detail?: 'auto' | 'low' | 'high'
  onError?: (error: Error) => void
  onComplete?: () => void
}

interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

interface TextContent {
  type: 'text'
  text: string
}

type ContentPart = TextContent | ImageContent

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

interface RequestBody {
  model: string
  messages: Message[]
  stream: boolean
  temperature?: number
  max_tokens?: number
}

interface SSEResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
  }>
}

// ==================== 新增类型定义 ====================

/**
 * 风险等级
 */
type RiskLevel = 'safe' | 'low' | 'high'

/**
 * 1. 配料表过敏源分析结果
 */
interface IngredientsAllergenResult {
  allergens: string[] // 检测到的过敏源列表
  riskLevel: RiskLevel // 总体风险等级
  details: {
    allergen: string // 过敏源名称
    found: boolean // 是否发现
    ingredients: string[] // 相关成分
  }[]
  suggestion: string // 安全建议
}

/**
 * 2. 菜单建议结果
 */
interface MenuRecommendationResult {
  recommendations: string[] // 推荐菜品列表
  dishRisks: {
    dishName: string // 菜品名称
    riskLevel: RiskLevel // 风险等级
    allergens: string[] // 可能含有的过敏源
    reason: string // 风险原因
  }[]
  safeDishes: string[] // 安全菜品
  warningDishes: string[] // 需警惕菜品
  avoidDishes: string[] // 应避免菜品
}

/**
 * 3. 食物照片分析结果
 */
interface FoodPhotoAnalysisResult {
  foods: {
    name: string // 食物名称
    riskLevel: RiskLevel // 风险等级
    possibleAllergens: string[] // 可能的过敏源
    confidence: number // 识别置信度 0-1
  }[]
  overallRisk: RiskLevel // 总体风险
  suggestion: string // 建议
}

/**
 * 4. 智能识别并分析结果
 */
interface SmartAnalysisResult {
  imageType: 'ingredients' | 'menu' | 'food' | 'unknown' // 图片类型
  confidence: number // 类型判断置信度
  result: IngredientsAllergenResult | MenuRecommendationResult | FoodPhotoAnalysisResult | null
  errorMessage?: string // 如果识别失败的错误信息
}

// ==================== 工具函数 ====================

/**
 * 从 URL 或 Data URL 获取 MIME 类型
 */
function getMimeTypeFromUrl(url: string): string {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;,]+)/)
    if (match) {
      return match[1]
    }
  }

  const extension = url.split('.').pop()?.toLowerCase().split('?')[0]
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml'
  }

  return mimeTypes[extension || ''] || 'image/jpeg'
}

/**
 * 将图片 URL 转换为 Base64
 */
async function convertImageToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  if (url.startsWith('data:')) {
    const mimeType = getMimeTypeFromUrl(url)
    const base64Data = url.split(',')[1]
    return { base64: base64Data, mimeType }
  }

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const mimeType = blob.type || getMimeTypeFromUrl(url)

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve({ base64, mimeType })
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert image:', error)
    throw new Error('无法加载图片')
  }
}

/**
 * 调用 Gemini API (非流式，返回完整 JSON)
 */
async function callGeminiAPIForJSON<T>(messages: Message[], options: ImageAnalysisOptions): Promise<T> {
  const {
    apiKey: optApiKey,
    baseURL: optBaseURL,
    temperature = 0.3, // 降低温度以获得更稳定的 JSON 输出
    maxTokens = 4096,
    onError = (error: Error) => console.error('API Error:', error)
  } = options

  // 优先使用 options 中的值，其次使用 Vite 环境变量 VITE_GEMINI_API_KEY / VITE_GEMINI_BASE_URL，最后回退到原默认
  // 使用 (import.meta as any).env 以兼容 TypeScript 在非 Vite 环境下的类型检查
  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {}
  const apiKey = optApiKey || env.VITE_GEMINI_API_KEY
  const baseURL = optBaseURL || env.VITE_GEMINI_BASE_URL || 'https://meta-backend-sandbox.camscanner.com/us/'

  if (!apiKey) {
    throw new Error('API key is required. Provide it via options.apiKey or set VITE_GEMINI_API_KEY in your .env')
  }

  const requestBody = {
    model: 'gemini-2.5-flash-preview-09-2025',
    messages,
    stream: false, // 非流式
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' } // 要求返回 JSON
  }

  try {
    const response = await fetch(`${baseURL}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
      } catch {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in API response')
    }

    // 解析 JSON 响应
    try {
      return JSON.parse(content) as T
    } catch (parseError) {
      console.error('Failed to parse JSON response:', content)
      throw new Error('API 返回的不是有效的 JSON 格式')
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    onError(errorObj)
    throw errorObj
  }
}

// ==================== 新增的4个函数 ====================

/**
 * 1. 分析配料表中的过敏源
 * @param ingredientsText 配料表文本
 * @param userAllergens 用户的过敏源列表
 * @param options API 配置选项
 * @returns 过敏源分析结果
 */
export async function analyzeIngredientsAllergens(
  ingredientsText: string,
  userAllergens: string[],
  options: ImageAnalysisOptions
): Promise<IngredientsAllergenResult> {
  const allergensText = userAllergens.join('、')

  const prompt = `请分析以下配料表，检测用户关注的过敏源。
  
  配料表内容：
  ${ingredientsText}
  
  用户的过敏源：${allergensText}
  
  请严格按照以下 JSON 格式返回结果：
  
  {
    "allergens": ["检测到的过敏源1", "检测到的过敏源2"],
    "riskLevel": "safe 或 low 或 high",
    "details": [
      {
        "allergen": "过敏源名称",
        "found": true/false,
        "ingredients": ["相关成分1", "相关成分2"]
      }
    ],
    "suggestion": "安全建议文字"
  }
  
  风险等级判断标准：
  - safe: 未检测到任何用户关注的过敏源
  - low: 检测到可能含有过敏源的成分（如"可能含有"标注）
  - high: 明确含有用户关注的过敏源
  
  请用中文回答，只返回 JSON，不要有其他文字。`

  const messages: Message[] = [
    {
      role: 'user',
      content: prompt
    }
  ]

  return callGeminiAPIForJSON<IngredientsAllergenResult>(messages, options)
}

/**
 * 2. 分析菜单并给出建议
 * @param menuText 菜单内容（文本或描述）
 * @param userAllergens 用户的过敏源列表
 * @param options API 配置选项
 * @returns 菜单建议结果
 */
export async function analyzeMenuRecommendations(
  menuText: string,
  userAllergens: string[],
  options: ImageAnalysisOptions
): Promise<MenuRecommendationResult> {
  const allergensText = userAllergens.join('、')

  const prompt = `请分析以下菜单，根据用户的过敏源给出用餐建议。
  
  菜单内容：
  ${menuText}
  
  用户的过敏源：${allergensText}
  
  请严格按照以下 JSON 格式返回结果：
  
  {
    "recommendations": ["推荐菜品1", "推荐菜品2"],
    "dishRisks": [
      {
        "dishName": "菜品名称",
        "riskLevel": "safe 或 low 或 high",
        "allergens": ["可能含有的过敏源"],
        "reason": "风险原因说明"
      }
    ],
    "safeDishes": ["安全菜品1", "安全菜品2"],
    "warningDishes": ["需警惕菜品1"],
    "avoidDishes": ["应避免菜品1"]
  }
  
  风险等级判断标准：
  - safe: 不含用户过敏源，可以安全食用
  - low: 可能间接含有过敏源（如共用厨具）
  - high: 明确含有用户过敏源，应避免
  
  请用中文回答，只返回 JSON，不要有其他文字。`

  const messages: Message[] = [
    {
      role: 'user',
      content: prompt
    }
  ]

  return callGeminiAPIForJSON<MenuRecommendationResult>(messages, options)
}

/**
 * 3. 分析食物照片中的过敏源
 * @param imageUrl 食物照片的 URL
 * @param userAllergens 用户的过敏源列表
 * @param options API 配置选项
 * @returns 食物分析结果
 */
export async function analyzeFoodPhoto(
  imageUrl: string,
  userAllergens: string[],
  options: ImageAnalysisOptions
): Promise<FoodPhotoAnalysisResult> {
  const allergensText = userAllergens.join('、')

  const prompt = `请仔细分析这张食物照片，识别其中的食物并评估过敏风险。
  
  用户的过敏源：${allergensText}
  
  请严格按照以下 JSON 格式返回结果：
  
  {
    "foods": [
      {
        "name": "食物名称",
        "riskLevel": "safe 或 low 或 high",
        "possibleAllergens": ["可能的过敏源1", "可能的过敏源2"],
        "confidence": 0.95
      }
    ],
    "overallRisk": "safe 或 low 或 high",
    "suggestion": "总体建议文字"
  }
  
  风险等级判断标准：
  - safe: 不含用户过敏源
  - low: 可能含有或不确定
  - high: 很可能含有用户过敏源
  
  confidence 是识别置信度，范围 0-1，越接近 1 表示越确定。
  
  请用中文回答，只返回 JSON，不要有其他文字。`

  // 转换图片为 Base64
  const { base64, mimeType } = await convertImageToBase64(imageUrl)

  const messages: Message[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: options.detail || 'high'
          }
        }
      ]
    }
  ]

  return callGeminiAPIForJSON<FoodPhotoAnalysisResult>(messages, options)
}

/**
 * 4. 智能识别图片类型并调用相应分析函数
 * @param imageUrl 图片 URL
 * @param userAllergens 用户的过敏源列表
 * @param options API 配置选项
 * @returns 智能分析结果
 */
export async function smartAnalyzeImage(
  imageUrl: string,
  userAllergens: string[],
  options: ImageAnalysisOptions
): Promise<SmartAnalysisResult> {
  // 第一步：识别图片类型
  const typePrompt = `请判断这张图片属于以下哪种类型：
  
  1. ingredients - 配料表标签（食品包装上的配料成分列表）
  2. menu - 餐厅菜单（菜品列表）
  3. food - 食物照片（实际的食物图片）
  4. unknown - 无法判断或不属于以上类型
  
  请严格按照以下 JSON 格式返回结果：
  
  {
    "imageType": "ingredients 或 menu 或 food 或 unknown",
    "confidence": 0.95,
    "reason": "判断理由"
  }
  
  只返回 JSON，不要有其他文字。`

  const { base64, mimeType } = await convertImageToBase64(imageUrl)

  const typeMessages: Message[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: typePrompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: options.detail || 'auto'
          }
        }
      ]
    }
  ]

  try {
    const typeResult = await callGeminiAPIForJSON<{
      imageType: 'ingredients' | 'menu' | 'food' | 'unknown'
      confidence: number
      reason: string
    }>(typeMessages, options)

    console.log('Image type detected:', typeResult)

    // 第二步：根据类型调用相应的分析函数
    let analysisResult: IngredientsAllergenResult | MenuRecommendationResult | FoodPhotoAnalysisResult | null = null

    switch (typeResult.imageType) {
      case 'ingredients': {
        // 先提取配料表文本
        const extractPrompt = `请提取这张配料表图片中的所有文字内容，按原样输出。只输出文字内容，不要有其他说明。`
        const extractMessages: Message[] = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ]

        // 使用流式 API 提取文本（因为不需要 JSON 格式）
        let ingredientsText = ''
        await callGeminiAPIForStream(
          extractMessages,
          chunk => {
            ingredientsText += chunk
          },
          options
        )

        // 然后分析过敏源
        analysisResult = await analyzeIngredientsAllergens(ingredientsText, userAllergens, options)
        break
      }

      case 'menu': {
        // 先提取菜单文本
        const extractPrompt = `请提取这张菜单图片中的所有菜品名称和描述。格式如下：
          
  菜品名：描述
  菜品名：描述
  
  只输出菜品信息，不要有其他说明。`

        const extractMessages: Message[] = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ]

        let menuText = ''
        await callGeminiAPIForStream(
          extractMessages,
          chunk => {
            menuText += chunk
          },
          options
        )

        // 然后分析菜单
        analysisResult = await analyzeMenuRecommendations(menuText, userAllergens, options)
        break
      }

      case 'food': {
        // 直接分析食物照片
        analysisResult = await analyzeFoodPhoto(imageUrl, userAllergens, options)
        break
      }

      case 'unknown':
      default: {
        return {
          imageType: 'unknown',
          confidence: typeResult.confidence,
          result: null,
          errorMessage: `无法识别图片类型。${typeResult.reason}`
        }
      }
    }

    return {
      imageType: typeResult.imageType,
      confidence: typeResult.confidence,
      result: analysisResult
    }
  } catch (error) {
    console.error('Smart analysis failed:', error)
    throw error
  }
}

/**
 * 调用 Gemini API (流式，用于提取文本)
 */
async function callGeminiAPIForStream(messages: Message[], onChunk: (chunk: string) => void, options: ImageAnalysisOptions): Promise<void> {
  const {
    apiKey: optApiKey,
    baseURL: optBaseURL,
    temperature = 0.7,
    maxTokens = 4096,
    onError = (error: Error) => console.error('API Error:', error),
    onComplete = () => {}
  } = options

  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {}
  const apiKey = optApiKey || env.VITE_GEMINI_API_KEY
  const baseURL = optBaseURL || env.VITE_GEMINI_BASE_URL || 'https://meta-backend-sandbox.camscanner.com/us/'

  if (!apiKey) {
    throw new Error('API key is required. Provide it via options.apiKey or set VITE_GEMINI_API_KEY in your .env')
  }

  const requestBody: RequestBody = {
    model: 'gemini-2.5-flash-preview-09-2025',
    messages,
    stream: true,
    temperature,
    max_tokens: maxTokens
  }

  try {
    const response = await fetch(`${baseURL}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
      } catch {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6)

          if (data === '[DONE]') {
            onComplete()
            return
          }

          try {
            const parsed: SSEResponse = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content

            if (content) {
              onChunk(content)
            }

            const finishReason = parsed.choices?.[0]?.finish_reason
            if (finishReason) {
              onComplete()
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', parseError)
          }
        }
      }
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    onError(errorObj)
    throw errorObj
  }
}

/**
 * 原有的流式分析函数（保留向后兼容）
 */
export async function analyzeAllergens(
  imageUrl: string,
  concernedAllergens: string[],
  onChunk: (chunk: string) => void,
  options: ImageAnalysisOptions
): Promise<void> {
  const allergensText = concernedAllergens.length > 0 ? concernedAllergens.join('、') : '所有常见过敏原'

  const prompt = `请仔细分析这张食品标签图片，重点识别其中的过敏原信息。
    
  我特别关注以下过敏原：${allergensText}
  
  请按以下格式回答：
  
  1. **检测到的过敏原**
     列出图片中明确标注的所有过敏原成分
  
  2. **我关注的过敏原检测结果**
     ${concernedAllergens.map(a => `- ${a}：是否含有`).join('\n   ')}
  
  3. **成分表分析**
     列出主要成分，标注可能的过敏风险
  
  4. **安全建议**
     基于检测结果给出食用建议
  
  请用中文回答，语言简洁明了。`

  const { base64, mimeType } = await convertImageToBase64(imageUrl)

  const messages: Message[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: options.detail || 'high'
          }
        }
      ]
    }
  ]

  await callGeminiAPIForStream(messages, onChunk, options)
}

// 导出类型定义
export type {
  ImageAnalysisOptions,
  IngredientsAllergenResult,
  MenuRecommendationResult,
  FoodPhotoAnalysisResult,
  SmartAnalysisResult,
  RiskLevel
}
