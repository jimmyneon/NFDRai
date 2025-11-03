export interface AIProvider {
  name: string
  generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }>
}

export class OpenAIProvider implements AIProvider {
  name = 'openai'

  async generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }

    const data = await response.json()
    const messageContent = data.choices[0]?.message?.content || ''
    
    // Calculate confidence based on finish_reason and logprobs if available
    const confidence = data.choices[0]?.finish_reason === 'stop' ? 85 : 70

    return {
      response: messageContent,
      confidence,
    }
  }
}

export class AnthropicProvider implements AIProvider {
  name = 'anthropic'

  async generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.prompt }],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const messageContent = data.content[0]?.text || ''
    const confidence = data.stop_reason === 'end_turn' ? 85 : 70

    return {
      response: messageContent,
      confidence,
    }
  }
}

export class MistralProvider implements AIProvider {
  name = 'mistral'

  async generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }> {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`)
    }

    const data = await response.json()
    const messageContent = data.choices[0]?.message?.content || ''
    const confidence = 80

    return {
      response: messageContent,
      confidence,
    }
  }
}

export class DeepSeekProvider implements AIProvider {
  name = 'deepseek'

  async generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`)
    }

    const data = await response.json()
    const messageContent = data.choices[0]?.message?.content || ''
    const confidence = 80

    return {
      response: messageContent,
      confidence,
    }
  }
}

export class GeminiProvider implements AIProvider {
  name = 'gemini'

  async generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }> {
    // Gemini API endpoint - use v1beta for newer models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: params.systemPrompt + '\n\n' + params.prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: params.temperature,
            maxOutputTokens: params.maxTokens,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        model: params.model,
        url: `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent`
      })
      throw new Error(`Gemini API error (${response.status}): ${errorText.substring(0, 200)}`)
    }

    const data = await response.json()
    console.log('Gemini API Response:', data)
    
    const messageContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const confidence = data.candidates?.[0]?.finishReason === 'STOP' ? 85 : 70

    return {
      response: messageContent,
      confidence,
    }
  }
}

export class CustomProvider implements AIProvider {
  name = 'custom'

  async generateResponse(params: {
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    apiKey: string
    model: string
  }): Promise<{ response: string; confidence: number }> {
    // Custom endpoint - assumes OpenAI-compatible API
    const endpoint = process.env.CUSTOM_AI_ENDPOINT || 'http://localhost:8000/v1/chat/completions'
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.statusText}`)
    }

    const data = await response.json()
    const messageContent = data.choices[0]?.message?.content || ''
    const confidence = 75

    return {
      response: messageContent,
      confidence,
    }
  }
}

export function getProvider(providerName: string): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider()
    case 'anthropic':
      return new AnthropicProvider()
    case 'mistral':
      return new MistralProvider()
    case 'deepseek':
      return new DeepSeekProvider()
    case 'gemini':
      return new GeminiProvider()
    case 'custom':
      return new CustomProvider()
    default:
      throw new Error(`Unknown provider: ${providerName}`)
  }
}
