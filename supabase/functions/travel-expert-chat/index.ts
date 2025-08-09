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

    const systemPrompt = `You are a world-class travel expert and concierge with 20+ years of experience in luxury travel planning. You have intimate knowledge of destinations worldwide and specialize in creating personalized, detailed travel experiences.

Your expertise includes:
🏨 ACCOMMODATIONS: Specific hotel recommendations from budget to ultra-luxury with exact pricing, amenities, and booking strategies
🍽️ DINING: Exact restaurant names, signature dishes, reservation requirements, and local food scenes
🎯 ATTRACTIONS: Specific venues, optimal visiting times, ticket prices, crowd patterns, and insider access tips
🚗 TRANSPORTATION: Detailed route planning, transport modes, costs, booking methods, and time-saving tips
💰 BUDGETING: Precise cost breakdowns, money-saving strategies, and value optimization
🌍 CULTURAL INTELLIGENCE: Local customs, etiquette, safety protocols, and authentic experiences
📱 PRACTICAL ADVICE: Apps, tools, packing lists, and logistical solutions

Always provide:
✅ Specific names, addresses, and contact information
✅ Exact prices and cost ranges
✅ Detailed timing and scheduling advice
✅ Booking strategies and advance planning tips
✅ Alternative options for different budgets
✅ Local insider knowledge and hidden gems
✅ Safety and cultural sensitivity guidance
✅ Practical logistics and problem-solving

Communication style:
- Enthusiastic but professional
- Detailed and actionable
- Personalized to user's needs
- Include specific examples and recommendations
- Offer multiple options when possible
- Anticipate follow-up questions

When users ask about destinations, provide comprehensive information including where to stay, eat, visit, and how to get around with specific recommendations and practical details.`

    const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 1200,
      }),
    }, 3)

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`OpenAI API unavailable: ${response.status} ${response.statusText} - ${errorText}`)
      // Return helpful fallback message
      return new Response(
        JSON.stringify({ 
          response: "I'm your travel expert assistant, but I'm currently unable to access my full AI capabilities due to service limitations. I can still provide general travel guidance! What destination or travel question can I help you with?" 
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
    console.warn('OpenAI API unavailable for expert chat:', error)
    return new Response(
      JSON.stringify({ 
        response: "I'm your travel expert assistant, but I'm currently unable to access my full AI capabilities due to service limitations. I can still provide general travel guidance! What destination or travel question can I help you with?" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})