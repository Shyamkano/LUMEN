import { NextRequest, NextResponse } from 'next/server';
import { getMistral } from '@/lib/ai/openai';
import { PROMPTS } from '@/lib/ai/prompts';

type AIAction =
  | 'generate_titles'
  | 'suggest_tags'
  | 'summarize'
  | 'explain_code'
  | 'detect_language'
  | 'improve_micro'
  | 'expand_micro'
  | 'grammar_fix'
  | 'enhance_content'
  | 'smart_suggestion'
  | 'transcribe_summary';

export async function POST(request: NextRequest) {
  try {
    const { action, content, code, language, title } = await request.json() as {
      action: AIAction;
      content?: string;
      code?: string;
      language?: string;
      title?: string;
    };

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const mistral = getMistral();

    let prompt: string;
    let expectJson = false;

    switch (action) {
      case 'generate_titles':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.GENERATE_TITLES(content);
        expectJson = true;
        break;
      case 'suggest_tags':
        if (!title || !content) return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
        prompt = PROMPTS.SUGGEST_TAGS(title, content);
        expectJson = true;
        break;
      case 'summarize':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.SUMMARIZE(content);
        break;
      case 'explain_code':
        if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        prompt = PROMPTS.EXPLAIN_CODE(code, language || 'unknown');
        break;
      case 'detect_language':
        if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        prompt = PROMPTS.DETECT_LANGUAGE(code);
        break;
      case 'improve_micro':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.IMPROVE_MICRO(content);
        break;
      case 'expand_micro':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.EXPAND_MICRO(content);
        break;
      case 'grammar_fix':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.GRAMMAR_FIX(content);
        expectJson = true;
        break;
      case 'enhance_content':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.ENHANCE_CONTENT(content);
        break;
      case 'smart_suggestion':
        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        prompt = PROMPTS.SMART_SUGGESTION(content);
        break;
      case 'transcribe_summary':
        if (!content) return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        prompt = PROMPTS.TRANSCRIBE_SUMMARY(content);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Call Mistral AI
    const chatResponse = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content: expectJson
            ? 'You are a helpful writing assistant. Always respond with valid JSON.'
            : 'You are a helpful writing assistant. Respond concisely and directly.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    const rawContent = chatResponse.choices?.[0]?.message?.content;
    const result = (typeof rawContent === 'string' ? rawContent : '').trim();


    if (expectJson) {
      try {
        const parsed = JSON.parse(result);
        return NextResponse.json({ result: parsed });
      } catch {
        return NextResponse.json({ result });
      }
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI processing failed';
    console.error('AI API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
