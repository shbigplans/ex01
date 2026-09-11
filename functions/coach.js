/**
 * AI 마음브레이크 코치 v2 — 서버리스 함수 (Netlify Functions / Vercel 호환)
 *
 * 역할: v1 상태머신의 각 단계에서 봇 '말'만 LLM이 생성한다. 흐름·버튼 구조는 클라이언트(coach.js)가 담당.
 * 입력  (POST JSON): { track: 'relation'|'money'|'general', step: string, state: object, userText?: string }
 * 출력  (JSON):      { say: string, options?: string[], safety_flag: boolean }
 *
 * 보호장치: 키워드 사전 검사 → 즉시 safety_flag / 입력 500자 제한 / IP당 분당 10회 인메모리 레이트리밋(웜 인스턴스 단위 —
 *           스케일아웃 환경에서는 Netlify/Vercel 의 플랫폼 레이트리밋 또는 KV 카운터 병행 권장) / 세션당 최대 12회(클라이언트) /
 *           8초 타임아웃 / CORS Origin 화이트리스트(ALLOWED_ORIGIN) / state 크기·타입 검증 / 저장 없음.
 *
 * 배포 (Netlify): 이 파일을 netlify/functions/coach.js 로 두거나 netlify.toml 의 functions 디렉토리를 "functions"로 지정.
 *   엔드포인트: /.netlify/functions/coach  (site/assets/js/coach.js 의 COACH_ENDPOINT 에 기입)
 *   환경변수: ANTHROPIC_API_KEY (Netlify UI → Site settings → Environment variables)
 * 배포 (Vercel): api/coach.js 로 복사하고 파일 하단의 Vercel 어댑터 주석을 참고 (module.exports = (req, res) => ...).
 *   엔드포인트: /api/coach
 *
 * 의존성: npm i @anthropic-ai/sdk  (package.json 은 함수 디렉토리 기준, functions/.env.example 참고)
 * 모델: claude-opus-5 (2026-09 기준 최신 Opus) — adaptive thinking, effort "low"(대화 지연 우선), 구조화 출력(json_schema)
 */
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.COACH_MODEL || 'claude-opus-5'; // R2 Q-28: .env 의 COACH_MODEL 반영
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://huggingmind.kr'; // R2 Q-16: CORS 화이트리스트(쉼표로 여러 개)
const MAX_INPUT = 500;
const TIMEOUT_MS = 8000;
const RATE_LIMIT = { windowMs: 60_000, max: 10 };
const ALLOWED_TRACKS = new Set(['relation', 'money', 'general']);

const SAFETY_KEYWORDS = ['죽고 싶', '자살', '사라지고 싶', '끝내고 싶', '해치', '때리'];
const SAFETY_SAY = '지금 많이 힘드시다는 게 느껴집니다. 이 대화는 여기서 멈추고, 사람과 연결되는 것이 먼저입니다. 자살예방상담전화 109(24시간) · 정신건강위기상담 1577-0199 · 긴급 시 112/119.';

const SYSTEM_PROMPT = `당신은 '마음브레이크 코치'입니다. 나영채 코치(감정·충동조절 마음근력 코치, BLISS MIND FIT)의 톤으로 말합니다.
톤: 절제된 · 단단한 · 따뜻한. 훈계하지 않고, 겁주지 않고, 과장하지 않습니다. "참으라"가 아니라 "선택하도록" 말합니다. 존댓말, 2~3문장, 한국어.

핵심 원리 — 마음브레이크 4단계 (감정과 행동 사이에 틈을 만드는 기술):
1. STOP 멈춘다 — 충동행동을 잠시 보류한다.
2. FEEL 찾는다 — 지금의 감정과 욕구를 확인한다. 감정은 잘못이 아니라 신호다.
3. CALM 낮춘다 — 6초 호흡(3초 들숨/3초 날숨) + EFT로 강도를 낮춘다.
4. CHOOSE 선택한다 — 감정이 아닌 내가 행동을 선택한다. 큰 행동일 필요는 없다.
관계 트랙: 상처 → 분노·억울함 → [마음브레이크] → 마음 말하기 → 연결. 비폭력대화(관찰·감정·욕구·부탁).
머니 트랙: 손실 → 조급함·만회욕구 → [마음브레이크] → 평정 → 행동 선택. "수익률보다 먼저, 마음의 손절선." 시장은 6초 뒤에도 그 자리에 있다.

절대 규칙:
- 진단·처방을 하지 않는다(질환명 언급, 약물·치료 권고 금지). 의료·법률·투자 조언을 하지 않는다(종목·매매 타이밍·법적 판단 금지).
- 사용자를 판단하거나 비난하지 않는다. 사용자의 문장을 인정하고 반영하되, 새로운 사실을 지어내지 않는다.
- 현재 단계(step)에 맞는 말만 한다. 다음 단계로 스스로 넘어가지 않는다. 흐름과 버튼은 시스템이 담당한다.
- 자해·타해·자살 암시, 학대·폭력 상황, 심각한 위기 신호가 있으면 safety_flag=true 로 표시하고, say 에는 "이 대화는 여기서 멈추고 사람과 연결되는 것이 먼저"라는 취지와 기관 안내(자살예방상담전화 109, 정신건강위기상담 1577-0199, 긴급 112/119, 도박 문제 1336, 가정폭력 1366)를 담는다.
- options 는 시스템이 준 후보 개수·형식을 유지할 때만 문구를 다듬어 돌려주고, 후보가 없으면 생략한다.
출력은 반드시 JSON 스키마를 따른다.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    say: { type: 'string', description: '봇 말풍선 본문. 2~3문장, 한국어 존댓말.' },
    options: { type: 'array', items: { type: 'string' }, description: '선택지 문구(제공된 후보 개수·순서 유지). 없으면 빈 배열.' },
    safety_flag: { type: 'boolean', description: '위기 신호가 있으면 true' }
  },
  required: ['say', 'options', 'safety_flag'],
  additionalProperties: false
};

/* ---------- in-memory rate limit (per warm instance) ---------- */
const buckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const b = buckets.get(ip) || { start: now, count: 0 };
  if (now - b.start > RATE_LIMIT.windowMs) { b.start = now; b.count = 0; }
  b.count += 1;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear(); // crude memory guard
  return b.count > RATE_LIMIT.max;
}

function hasSafetyKeyword(text) {
  return !!text && SAFETY_KEYWORDS.some((k) => text.includes(k));
}

/* R2 Q-16: Origin 화이트리스트. 허용 목록에 없는 Origin 에는 CORS 헤더를 내지 않는다(브라우저 차단). */
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin);
  return ok ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } : {};
}
const json = (status, body, origin) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(origin) },
  body: JSON.stringify(body)
});

/* R2 Q-17: state 타입·크기 검증 — 문자열 120자, 감정 최대 3개×20자, 강도 0~10 정수 */
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : null);
const int010 = (v) => (Number.isInteger(v) && v >= 0 && v <= 10 ? v : null);
function sanitizeState(state) {
  const s = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
  return {
    action: str(s.action, 120), emotions: Array.isArray(s.emotions) ? s.emotions.filter((e) => typeof e === 'string').slice(0, 3).map((e) => e.slice(0, 20)) : [],
    intensity0: int010(s.intensity0), intensityNow: int010(s.intensityNow), need: str(s.need, 120), choice: str(s.choice, 120)
  };
}

/** Core: validate → keyword check → Claude structured output → JSON */
export async function coach(payload, ip) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { status: 400, body: { error: 'bad_request' } }; // R2 Q-17
  const { track, step, state, userText } = payload;
  if (rateLimited(ip)) return { status: 429, body: { error: 'rate_limited', say: '', options: [], safety_flag: false } };
  if (!ALLOWED_TRACKS.has(track) || typeof step !== 'string' || step.length > 40) return { status: 400, body: { error: 'bad_request' } };
  const text = typeof userText === 'string' ? userText.slice(0, MAX_INPUT) : '';
  if (hasSafetyKeyword(text)) return { status: 200, body: { say: SAFETY_SAY, options: [], safety_flag: true } };

  const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 0 }); // ANTHROPIC_API_KEY from env; timeout in ms
  const safeState = sanitizeState(state);
  const userMessage = [
    `트랙: ${track}`, `현재 단계: ${step}`, `상태: ${JSON.stringify(safeState)}`,
    text ? `사용자 문장(선택 입력): ${text}` : '사용자 문장: (없음)',
    '이 단계에서 봇이 할 말을 JSON으로 작성하세요.'
  ].join('\n');

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    // 안전 분류기 거절 시 서버측 폴백 모델로 자동 재시도 (원치 않으면 아래 두 줄 제거)
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default'
  });

  if (response.stop_reason === 'refusal') {
    return { status: 200, body: { say: SAFETY_SAY, options: [], safety_flag: true } };
  }
  const textBlock = response.content.find((b) => b.type === 'text');
  let parsed;
  try { parsed = JSON.parse(textBlock?.text ?? '{}'); } catch { parsed = null; }
  if (!parsed || typeof parsed.say !== 'string') return { status: 502, body: { error: 'bad_model_output' } };
  return { status: 200, body: { say: parsed.say, options: Array.isArray(parsed.options) && parsed.options.length ? parsed.options : undefined, safety_flag: !!parsed.safety_flag } };
}

/* ---------- Netlify Functions handler ---------- */
export async function handler(event) {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') return json(204, {}, origin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: 'not_configured' }, origin);
  if (origin && !corsHeaders(origin)['Access-Control-Allow-Origin']) return json(403, { error: 'origin_not_allowed' }); // R2 Q-16
  if ((event.body || '').length > 8000) return json(413, { error: 'payload_too_large' }, origin); // R2 Q-17
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'invalid_json' }, origin); }
  // R2 Q-16: 플랫폼 제공 클라이언트 IP 를 우선(x-nf-client-connection-ip 는 Netlify 가 설정, 위조 불가). x-forwarded-for 는 최후 수단.
  const ip = (event.headers?.['x-nf-client-connection-ip'] || event.headers?.['x-real-ip'] || event.headers?.['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  try {
    const { status, body } = await coach(payload, ip);
    return json(status, body, origin);
  } catch (err) {
    // Anthropic.APIConnectionTimeoutError / APIStatusError 등 — 클라이언트는 어떤 오류든 v1로 폴백한다.
    const status = err instanceof Anthropic.RateLimitError ? 429 : err instanceof Anthropic.APIConnectionError ? 504 : 500;
    return json(status, { error: err?.name || 'error' }, origin);
  }
}

/* ---------- Vercel adapter (api/coach.js) ----------
import { coach } from '../functions/coach.js';
export default async function (req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' });
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGIN || 'https://huggingmind.kr').split(',').map((s) => s.trim());
  if (origin && !allowed.includes(origin)) return res.status(403).json({ error: 'origin_not_allowed' });
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); }
  const ip = (req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  try {
    const { status, body } = await coach(req.body || {}, ip);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(body);
  } catch (err) { return res.status(500).json({ error: err?.name || 'error' }); }
}
------------------------------------------------------ */
