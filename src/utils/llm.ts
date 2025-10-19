/**
 * Gemini 2.5 Pro API 调用工具（支持图片分析）
 */

/**
 * 推理配置接口
 */
interface ThinkingConfig {
  /** 推理类型：enabled-强制开启, disabled-强制关闭, auto-自动判断 */
  type: 'enabled' | 'disabled' | 'auto'
  /** 推理token预算，使用此参数时max_tokens必须大于此值 */
  budget_tokens?: number
  /** 是否在输出中包含思考过程的摘要（仅Gemini支持） */
  include_thoughts?: boolean
}

/**
 * API错误接口
 */
interface APIError {
  message: string
  type: string
  param?: string
  code?: string | number
}

/**
 * 调用选项接口
 */
interface CallGeminiOptions {
  /** API密钥（必填） */
  apiKey: string
  /** 基础URL，默认为美西地址 */
  baseURL?: string
  /** 温度参数，范围0-1，默认0.7 */
  temperature?: number
  /** 最大输出tokens，默认8192 */
  maxTokens?: number
  /** Top-p采样参数，范围0-1 */
  topP?: number
  /** 推理配置 */
  thinking?: ThinkingConfig
  /** 用户标识 */
  user?: string
  /** 错误回调函数 */
  onError?: (error: Error) => void
  /** 完成回调函数 */
  onComplete?: () => void
}

/**
 * 消息角色类型
 */
type MessageRole = 'system' | 'user' | 'assistant'

/**
 * 图片内容类型
 */
interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string // 支持 base64 或 http(s) URL
    detail?: 'auto' | 'low' | 'high' // 图片分析精度
  }
}

/**
 * 文本内容类型
 */
interface TextContent {
  type: 'text'
  text: string
}

/**
 * 内容类型联合
 */
type ContentPart = TextContent | ImageContent

/**
 * 消息接口（支持多模态）
 */
interface Message {
  role: MessageRole
  content: string | ContentPart[]
}

/**
 * 请求体接口
 */
interface RequestBody {
  model: string
  messages: Message[]
  stream: boolean
  temperature?: number
  max_tokens?: number
  top_p?: number
  thinking?: ThinkingConfig
  user?: string
}

/**
 * SSE响应数据接口
 */
interface SSEChoice {
  index: number
  delta: {
    role?: string
    content?: string
  }
  finish_reason?: string | null
}

interface SSEResponse {
  id: string
  object: string
  created: number
  model: string
  choices: SSEChoice[]
}

/**
 * 图片分析选项
 */
interface ImageAnalysisOptions extends CallGeminiOptions {
  /** 图片分析精度 */
  detail?: 'auto' | 'low' | 'high'
}

/**
 * 将文件转换为Base64编码
 * @param file - File对象或Blob对象
 * @returns Promise<string> - base64编码的字符串
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 从URL加载图片并转换为Base64
 * @param url - 图片URL
 * @returns Promise<string> - base64编码的字符串
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return fileToBase64(blob)
}

/**
 * 验证图片格式
 * @param base64OrUrl - base64字符串或URL
 * @returns boolean
 */
function isValidImageFormat(base64OrUrl: string): boolean {
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  if (base64OrUrl.startsWith('data:')) {
    return supportedFormats.some(format => base64OrUrl.startsWith(`data:${format}`))
  }

  if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
    const ext = base64OrUrl.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
  }

  return false
}

/**
 * 调用 Gemini 2.5 Pro 分析单张图片
 * @param imageSource - 图片来源（File对象、Blob、base64字符串或URL）
 * @param prompt - 分析提示词，默认为"请分析这张图片"
 * @param onChunk - 流式输出回调函数
 * @param options - 配置参数
 * @returns Promise<void>
 */
async function analyzeImage(
  imageSource: File | Blob | string,
  prompt: string = '请详细分析这张图片的内容',
  onChunk: (chunk: string) => void,
  options: ImageAnalysisOptions
): Promise<void> {
  let imageUrl: string

  // 处理不同类型的图片输入
  if (typeof imageSource === 'string') {
    // 如果是URL或base64字符串
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      // 对于外部URL，可能需要转换为base64（取决于API要求）
      imageUrl = imageSource
    } else if (imageSource.startsWith('data:')) {
      imageUrl = imageSource
    } else {
      throw new Error('Invalid image source: must be a valid URL or base64 string')
    }
  } else {
    // File或Blob对象，转换为base64
    imageUrl = await fileToBase64(imageSource)
  }

  // 验证图片格式
  if (!isValidImageFormat(imageUrl)) {
    throw new Error('Unsupported image format. Supported formats: JPEG, PNG, GIF, WebP')
  }

  // 构建包含图片的消息
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
            url: imageUrl,
            detail: options.detail || 'auto'
          }
        }
      ]
    }
  ]

  // 调用多轮对话函数
  await callGemini25ProWithHistory(messages, onChunk, options)
}

/**
 * 分析多张图片
 * @param imageSources - 图片来源数组
 * @param prompt - 分析提示词
 * @param onChunk - 流式输出回调函数
 * @param options - 配置参数
 * @returns Promise<void>
 */
async function analyzeMultipleImages(
  imageSources: (File | Blob | string)[],
  prompt: string = '请分析这些图片',
  onChunk: (chunk: string) => void,
  options: ImageAnalysisOptions
): Promise<void> {
  if (imageSources.length === 0) {
    throw new Error('At least one image is required')
  }

  // 转换所有图片为URL格式
  const imageUrls: string[] = []
  for (const source of imageSources) {
    if (typeof source === 'string') {
      imageUrls.push(source)
    } else {
      const base64 = await fileToBase64(source)
      imageUrls.push(base64)
    }
  }

  // 验证所有图片格式
  for (const url of imageUrls) {
    if (!isValidImageFormat(url)) {
      throw new Error('One or more images have unsupported format')
    }
  }

  // 构建内容数组
  const contentParts: ContentPart[] = [
    {
      type: 'text',
      text: prompt
    },
    ...imageUrls.map(
      (url): ImageContent => ({
        type: 'image_url',
        image_url: {
          url,
          detail: options.detail || 'auto'
        }
      })
    )
  ]

  const messages: Message[] = [
    {
      role: 'user',
      content: contentParts
    }
  ]

  await callGemini25ProWithHistory(messages, onChunk, options)
}

/**
 * 图片对话 - 支持与图片相关的多轮对话
 * @param imageSources - 图片来源数组
 * @param conversationHistory - 对话历史
 * @param onChunk - 流式输出回调函数
 * @param options - 配置参数
 * @returns Promise<void>
 */
async function imageConversation(
  imageSources: (File | Blob | string)[],
  conversationHistory: Message[],
  onChunk: (chunk: string) => void,
  options: ImageAnalysisOptions
): Promise<void> {
  // 处理图片
  const imageUrls: string[] = []
  for (const source of imageSources) {
    if (typeof source === 'string') {
      imageUrls.push(source)
    } else {
      const base64 = await fileToBase64(source)
      imageUrls.push(base64)
    }
  }

  // 如果第一条消息是用户消息且包含文本，添加图片
  const messages = [...conversationHistory]
  const lastMessage = messages[messages.length - 1]

  if (lastMessage && lastMessage.role === 'user') {
    const content: ContentPart[] = []

    // 如果原内容是字符串，转换为ContentPart数组
    if (typeof lastMessage.content === 'string') {
      content.push({
        type: 'text',
        text: lastMessage.content
      })
    } else {
      content.push(...lastMessage.content)
    }

    // 添加图片
    imageUrls.forEach(url => {
      content.push({
        type: 'image_url',
        image_url: {
          url,
          detail: options.detail || 'auto'
        }
      })
    })

    lastMessage.content = content
  }

  await callGemini25ProWithHistory(messages, onChunk, options)
}

/**
 * 调用 Gemini 2.5 Pro 模型进行流式对话
 * @param prompt - 用户提示词
 * @param onChunk - 流式输出回调函数，接收每个文本片段
 * @param options - 可选配置参数
 * @returns Promise<void>
 * @throws {Error} 当参数无效或API请求失败时抛出错误
 */
async function callGemini25Pro(prompt: string, onChunk: (chunk: string) => void, options: CallGeminiOptions): Promise<void> {
  const {
    apiKey,
    baseURL = 'https://meta-backend-sandbox.camscanner.com/us/',
    temperature = 0.7,
    maxTokens = 8192,
    topP,
    thinking,
    user,
    onError = (error: Error) => console.error('Error:', error),
    onComplete = () => console.log('Stream completed')
  } = options

  // 验证必填参数
  if (!apiKey) {
    throw new Error('API key is required')
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string')
  }

  if (typeof onChunk !== 'function') {
    throw new Error('onChunk must be a function')
  }

  // 验证推理配置
  if (thinking?.budget_tokens && thinking.budget_tokens >= maxTokens) {
    throw new Error('max_tokens must be greater than thinking.budget_tokens')
  }

  // 构建请求体
  const requestBody: RequestBody = {
    model: 'gemini-2.5-pro-002',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    stream: true,
    temperature,
    max_tokens: maxTokens
  }

  // 添加可选参数
  if (topP !== undefined) {
    requestBody.top_p = topP
  }

  if (thinking) {
    requestBody.thinking = thinking
  }

  if (user) {
    requestBody.user = user
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

    // 检查响应状态
    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`

      try {
        const errorData: { error?: APIError } = await response.json()
        if (errorData.error?.message) {
          errorMessage += `. ${errorData.error.message}`
        }
      } catch {
        // 忽略JSON解析错误
      }

      throw new Error(errorMessage)
    }

    // 处理流式响应
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

      // 解码数据块
      buffer += decoder.decode(value, { stream: true })

      // 按行分割数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim()

        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        // 处理 SSE 数据
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6)

          // 检查是否为结束标记
          if (data === '[DONE]') {
            onComplete()
            return
          }

          try {
            const parsed: SSEResponse = JSON.parse(data)

            // 提取内容并调用回调
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content)
            }

            // 检查是否完成
            const finishReason = parsed.choices?.[0]?.finish_reason
            if (finishReason) {
              onComplete()
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', data, parseError)
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
 * 支持多轮对话的高级调用函数
 * @param messages - 消息历史数组
 * @param onChunk - 流式输出回调函数
 * @param options - 配置参数
 * @returns Promise<void>
 */
async function callGemini25ProWithHistory(
  messages: Message[],
  onChunk: (chunk: string) => void,
  options: CallGeminiOptions
): Promise<void> {
  const {
    apiKey,
    baseURL = 'https://meta-backend-sandbox.camscanner.com/us/',
    temperature = 0.7,
    maxTokens = 8192,
    topP,
    thinking,
    user,
    onError = (error: Error) => console.error('Error:', error),
    onComplete = () => console.log('Stream completed')
  } = options

  // 验证必填参数
  if (!apiKey) {
    throw new Error('API key is required')
  }

  if (!messages || messages.length === 0) {
    throw new Error('Messages array must not be empty')
  }

  if (typeof onChunk !== 'function') {
    throw new Error('onChunk must be a function')
  }

  // 验证推理配置
  if (thinking?.budget_tokens && thinking.budget_tokens >= maxTokens) {
    throw new Error('max_tokens must be greater than thinking.budget_tokens')
  }

  // 构建请求体
  const requestBody: RequestBody = {
    model: 'gemini-2.5-pro-002',
    messages,
    stream: true,
    temperature,
    max_tokens: maxTokens
  }

  // 添加可选参数
  if (topP !== undefined) {
    requestBody.top_p = topP
  }

  if (thinking) {
    requestBody.thinking = thinking
  }

  if (user) {
    requestBody.user = user
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
        const errorData: { error?: APIError } = await response.json()
        if (errorData.error?.message) {
          errorMessage += `. ${errorData.error.message}`
        }
      } catch {
        // 忽略JSON解析错误
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
            console.warn('Failed to parse SSE data:', data, parseError)
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

// 使用示例
async function examples() {
  const apiKey = 'sk-HckOTNtX3EiYlwIn6d07Dd73638948A1881177Ca6e00F24d'

  // 示例1: 分析单张图片（使用URL）
  console.log('=== 示例1: 分析图片URL ===')
  await analyzeImage(
    'https://example.com/image.jpg',
    '请详细描述这张图片中的内容',
    (chunk: string) => {
      process.stdout.write(chunk)
    },
    {
      apiKey,
      detail: 'high', // 高精度分析
      maxTokens: 4096
    }
  )

  // 示例2: 分析本地图片文件（浏览器环境）
  console.log('\n\n=== 示例2: 分析本地图片 ===')
  // 在浏览器中使用：
  // const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  // const file = fileInput.files?.[0]
  // if (file) {
  //   await analyzeImage(
  //     file,
  //     '这张图片里有什么？',
  //     (chunk) => console.log(chunk),
  //     { apiKey }
  //   )
  // }

  // 示例3: 分析多张图片
  console.log('\n\n=== 示例3: 比较多张图片 ===')
  await analyzeMultipleImages(
    ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    '请比较这两张图片的异同',
    (chunk: string) => {
      process.stdout.write(chunk)
    },
    {
      apiKey,
      detail: 'auto'
    }
  )

  // 示例4: 图片相关的多轮对话
  console.log('\n\n=== 示例4: 图片多轮对话 ===')
  const conversationHistory: Message[] = [
    {
      role: 'user',
      content: '我有一张图片想请你分析'
    }
  ]

  await imageConversation(
    ['https://example.com/diagram.jpg'],
    conversationHistory,
    (chunk: string) => {
      process.stdout.write(chunk)
    },
    {
      apiKey,
      detail: 'high'
    }
  )

  // 示例5: 结合推理模式分析复杂图片
  console.log('\n\n=== 示例5: 深度分析图片 ===')
  await analyzeImage(
    'https://example.com/complex-chart.jpg',
    '请深入分析这张图表，提取所有数据并给出专业见解',
    (chunk: string) => {
      process.stdout.write(chunk)
    },
    {
      apiKey,
      detail: 'high',
      maxTokens: 10000,
      thinking: {
        type: 'enabled',
        budget_tokens: 4096,
        include_thoughts: true
      }
    }
  )

  // 示例6: base64格式图片
  console.log('\n\n=== 示例6: 使用base64图片 ===')
  const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' // 完整的base64字符串
  await analyzeImage(
    base64Image,
    '识别图片中的文字',
    (chunk: string) => {
      process.stdout.write(chunk)
    },
    {
      apiKey,
      detail: 'high'
    }
  )
}

// 浏览器环境中的实用函数
function createImageUploadHandler() {
  const apiKey = 'your-api-key'

  const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    const resultDiv = document.getElementById('result')
    if (resultDiv) {
      resultDiv.innerHTML = '分析中...'
    }

    let fullResponse = ''

    try {
      await analyzeImage(
        file,
        '请详细分析这张图片',
        (chunk: string) => {
          fullResponse += chunk
          if (resultDiv) {
            resultDiv.innerHTML = fullResponse
          }
        },
        {
          apiKey,
          detail: 'high',
          onError: (error: Error) => {
            if (resultDiv) {
              resultDiv.innerHTML = `错误: ${error.message}`
            }
          },
          onComplete: () => {
            console.log('分析完成')
          }
        }
      )
    } catch (error) {
      console.error('分析失败:', error)
    }
  }

  return handleFileUpload
}

// 导出所有功能
export {
  callGemini25Pro,
  callGemini25ProWithHistory,
  analyzeImage,
  analyzeMultipleImages,
  imageConversation,
  fileToBase64,
  urlToBase64,
  isValidImageFormat,
  createImageUploadHandler,
  type CallGeminiOptions,
  type ImageAnalysisOptions,
  type ThinkingConfig,
  type Message,
  type MessageRole,
  type APIError,
  type ContentPart,
  type ImageContent,
  type TextContent
}
