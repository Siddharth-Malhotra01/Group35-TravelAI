import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000
        console.log(`${response.status === 429 ? 'Rate limited' : 'Server error'}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatRequest {
  messages: ChatMessage[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages }: ChatRequest = await req.json()

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `You are an expert AI travel assistant with extensive knowledge of destinations worldwide. You help travelers plan their trips by providing:

1. **Destination Recommendations**: Suggest places based on interests, budget, and travel style
2. **Itinerary Planning**: Create detailed day-by-day plans with timing and logistics
3. **Restaurant & Food Advice**: Recommend specific restaurants, local dishes, and dining experiences
4. **Transportation Guidance**: Advise on the best ways to travel between and within destinations
5. **Activity Suggestions**: Recommend sightseeing, cultural experiences, and entertainment
6. **Practical Tips**: Share local customs, safety advice, and money-saving tips
7. **Accommodation Advice**: Suggest areas to stay and types of lodging
8. **Budget Planning**: Help estimate costs and find deals

Always provide:
- Specific, actionable recommendations
- Practical details like timing, costs, and booking tips
- Cultural context and local insights
- Safety and etiquette advice
- Alternative options for different budgets/preferences

Be conversational, helpful, and enthusiastic about travel while being realistic about logistics and costs.`

    // Convert messages to OpenAI format
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 1000,
      }),
    }, 3)

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`OpenAI API unavailable: ${response.status} ${response.statusText} - ${errorText}`)
      // Return helpful fallback message
      return new Response(
        JSON.stringify({ 
          response: "I'm currently unable to access my AI capabilities due to service limitations. However, I can still help you with general travel advice! Feel free to ask about popular destinations, travel tips, or planning strategies." 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const data = await response.json()
    const assistantResponse = data.choices[0].message.content

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.warn('OpenAI API unavailable for chat:', error)
    return new Response(
      JSON.stringify({ 
        response: "I'm currently unable to access my AI capabilities due to service limitations. However, I can still help you with general travel advice! Feel free to ask about popular destinations, travel tips, or planning strategies." 
      }),
      {
        status: 200, // Return 200 so the frontend can display the fallback message
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})