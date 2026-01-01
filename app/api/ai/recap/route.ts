import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateCsrf, addSecurityHeaders, forbiddenResponse } from '@/lib/api/security';
import { checkRateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/api/rateLimit';
import { logError, ExternalServiceError } from '@/lib/errors';

// Types for memories
interface Memory {
  type: 'photo' | 'text';
  note?: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    // CSRF protection: Validate request has proper headers
    if (!validateCsrf(request)) {
      console.warn('[Security] CSRF validation failed for recap request');
      return forbiddenResponse('Invalid request origin');
    }

    const { journeyId } = await request.json();

    if (!journeyId) {
      return addSecurityHeaders(NextResponse.json({ error: 'Journey ID required' }, { status: 400 }));
    }

    // Check for OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ 
        error: 'AI features not configured',
        recap: null 
      }, { status: 200 });
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Check rate limit (uses Redis if configured, otherwise in-memory)
    const rateLimit = await checkRateLimit(user.id, AI_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    // Fetch journey details
    const { data: journey, error: journeyError } = await supabase
      .from('journeys')
      .select('*')
      .eq('id', journeyId)
      .single();

    if (journeyError || !journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // Check if journey is unlocked
    if (new Date(journey.unlock_date) > new Date()) {
      return NextResponse.json({ error: 'Journey not yet unlocked' }, { status: 403 });
    }

    // Verify user has access (owner or shared with)
    const hasAccess = journey.user_id === user.id || 
      (journey.shared_with && journey.shared_with.includes(user.id));
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch memories for this journey
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: true });

    if (memoriesError) {
      return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({ 
        recap: "This journey doesn't have any memories captured yet. Every adventure starts somewhere!",
        highlights: []
      });
    }

    // Prepare context for AI
    const journeyDuration = calculateDuration(journey.created_at, journey.unlock_date);
    const photoCount = memories.filter((m: Memory) => m.type === 'photo').length;
    const noteCount = memories.filter((m: Memory) => m.type === 'text').length;
    const notes = memories
      .filter((m: Memory) => m.type === 'text' && m.note)
      .map((m: Memory) => ({
        text: m.note,
        date: new Date(m.created_at).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      }));

    // Create prompt for OpenAI
    const prompt = `You are a warm, thoughtful travel companion helping someone relive their journey memories. 

Journey Details:
- Destination: ${journey.name}
- Duration: ${journeyDuration}
- Photos captured: ${photoCount}
- Notes written: ${noteCount}

${notes.length > 0 ? `Notes from the journey:
${notes.map((n: { text: string | undefined; date: string }) => `[${n.date}] "${n.text}"`).join('\n')}` : 'No written notes were captured.'}

Write a warm, personal recap of this journey (2-3 paragraphs). Be evocative and help them feel the memories again. Don't be generic - reference specific details from their notes if available. Keep it under 200 words.

Also identify 1-3 "highlight" moments from the notes that seem most meaningful or memorable. Return these as a simple list.

Respond in JSON format:
{
  "recap": "Your narrative recap here...",
  "highlights": ["Highlight 1", "Highlight 2"]
}`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a warm, thoughtful travel memory assistant. Always respond in valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        recap: null 
      }, { status: 200 });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ 
        error: 'Failed to generate recap',
        recap: null 
      }, { status: 200 });
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({
        recap: parsed.recap || null,
        highlights: parsed.highlights || [],
      });
    } catch {
      // If JSON parsing fails, use the raw content as recap
      return NextResponse.json({
        recap: content,
        highlights: [],
      });
    }

  } catch (error) {
    logError(error, { route: '/api/ai/recap', action: 'POST' });
    
    if (error instanceof ExternalServiceError) {
      return addSecurityHeaders(NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        recap: null 
      }, { status: 200 }));
    }
    
    return addSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 14) return '1 week';
  if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks`;
  return `${Math.round(diffDays / 30)} month${Math.round(diffDays / 30) > 1 ? 's' : ''}`;
}

