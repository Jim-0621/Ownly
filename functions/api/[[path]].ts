import {
  createPassword, createSession, currentUser, deleteSession, expiredSessionCookie,
  findUser, sessionCookie, verifyPassword, verifyRegistrationCode, type Env,
} from '../../worker/auth'

interface CloudSnapshot {
  version: number
  exportedAt: string
  categories: unknown[]
  assets: unknown[]
  wishes: unknown[]
}

const MAX_REQUEST_CHARS = 750_000
const MAX_IMAGE_BYTES = 10 * 1024
const usernamePattern = /^[\p{L}\p{N}_.-]{3,32}$/u

function json(data: unknown, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8')
  responseHeaders.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data), { status, headers: responseHeaders })
}

function error(message: string, status: number) {
  return json({ error: message }, status)
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

async function requestBody(request: Request) {
  const text = await request.text()
  if (text.length > MAX_REQUEST_CHARS) throw new Error('请求数据过大')
  return JSON.parse(text) as Record<string, unknown>
}

function validSnapshot(value: unknown): value is CloudSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Partial<CloudSnapshot>
  if (!Array.isArray(snapshot.categories) || !Array.isArray(snapshot.assets) || !Array.isArray(snapshot.wishes)) return false
  return true
}

function imageValidationError(snapshot: CloudSnapshot) {
  for (const asset of snapshot.assets) {
    if (!asset || typeof asset !== 'object' || !('image' in asset)) continue
    const image = (asset as { image?: unknown }).image
    if (image === undefined || image === null || image === '') continue
    if (typeof image !== 'string') return '图片数据格式不正确'
    const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,([a-zA-Z0-9+/]*={0,2})$/.exec(image)
    if (!match) return '图片必须是 Base64 格式'
    const encoded = match[1]
    const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0
    const byteLength = Math.floor(encoded.length * 3 / 4) - padding
    if (byteLength > MAX_IMAGE_BYTES) return '单张图片不能超过 10KB'
  }
  return null
}

async function register(request: Request, env: Env) {
  if (!isSameOrigin(request)) return error('请求来源无效', 403)
  if (!env.REGISTRATION_CODE) return error('服务端尚未设置注册码', 503)
  const body = await requestBody(request)
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')
  const registrationCode = String(body.registrationCode ?? '')
  if (!usernamePattern.test(username)) return error('用户名需为 3 至 32 个字符，可使用中文、字母、数字、点、横线或下划线', 400)
  if (password.length < 8 || password.length > 128) return error('密码长度需为 8 至 128 个字符', 400)
  if (!verifyRegistrationCode(registrationCode, env.REGISTRATION_CODE)) return error('注册码不正确', 403)

  const userId = crypto.randomUUID()
  const passwordValue = await createPassword(password)
  try {
    await env.DB.prepare(
      'INSERT INTO users (id, username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(userId, username, passwordValue.hash, passwordValue.salt, new Date().toISOString()).run()
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : ''
    if (message.includes('UNIQUE')) return error('该用户名已经存在', 409)
    throw cause
  }
  const session = await createSession(env, userId)
  return json({ user: { id: userId, username } }, 201, { 'Set-Cookie': sessionCookie(session.token, session.maxAge) })
}

async function login(request: Request, env: Env) {
  if (!isSameOrigin(request)) return error('请求来源无效', 403)
  const body = await requestBody(request)
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')
  const user = await findUser(env, username)
  if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
    return error('用户名或密码错误', 401)
  }
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(new Date().toISOString()).run()
  const session = await createSession(env, user.id)
  return json({ user: { id: user.id, username: user.username } }, 200, { 'Set-Cookie': sessionCookie(session.token, session.maxAge) })
}

async function logout(request: Request, env: Env) {
  if (!isSameOrigin(request)) return error('请求来源无效', 403)
  await deleteSession(request, env)
  return json({ ok: true }, 200, { 'Set-Cookie': expiredSessionCookie() })
}

async function getData(request: Request, env: Env) {
  const user = await currentUser(request, env)
  if (!user) return error('请先登录', 401)
  const row = await env.DB.prepare(
    'SELECT payload, version, updated_at FROM user_data WHERE user_id = ?',
  ).bind(user.id).first<{ payload: string; version: number; updated_at: string }>()
  return json(row ? { data: JSON.parse(row.payload), version: row.version, updatedAt: row.updated_at } : { data: null })
}

async function putData(request: Request, env: Env) {
  if (!isSameOrigin(request)) return error('请求来源无效', 403)
  const user = await currentUser(request, env)
  if (!user) return error('请先登录', 401)
  const body = await requestBody(request)
  if (!validSnapshot(body.data)) return error('同步数据格式不正确', 400)
  const imageError = imageValidationError(body.data)
  if (imageError) return error(imageError, 413)
  const payload = JSON.stringify(body.data)
  if (payload.length > MAX_REQUEST_CHARS) return error('同步数据超过 750KB', 413)
  const updatedAt = new Date().toISOString()
  await env.DB.prepare(`
    INSERT INTO user_data (user_id, payload, version, updated_at) VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      payload = excluded.payload,
      version = user_data.version + 1,
      updated_at = excluded.updated_at
  `).bind(user.id, payload, updatedAt).run()
  const row = await env.DB.prepare('SELECT version FROM user_data WHERE user_id = ?').bind(user.id).first<{ version: number }>()
  return json({ ok: true, version: row?.version ?? 1, updatedAt })
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/register' && request.method === 'POST') return await register(request, env)
    if (pathname === '/api/login' && request.method === 'POST') return await login(request, env)
    if (pathname === '/api/logout' && request.method === 'POST') return await logout(request, env)
    if (pathname === '/api/me' && request.method === 'GET') {
      const user = await currentUser(request, env)
      return json({ user })
    }
    if (pathname === '/api/data' && request.method === 'GET') return await getData(request, env)
    if (pathname === '/api/data' && request.method === 'PUT') return await putData(request, env)
    return error('接口不存在', 404)
  } catch (cause) {
    if (cause instanceof SyntaxError) return error('请求内容不是有效 JSON', 400)
    if (cause instanceof Error && cause.message === '请求数据过大') return error(cause.message, 413)
    console.error(cause)
    return error('服务器处理失败', 500)
  }
}
