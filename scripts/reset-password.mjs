import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { stdin, stdout } from 'node:process'

const DATABASE_NAME = 'ownly-db'
// 必须与 worker/auth.ts 中的密码派生参数保持一致。
const PASSWORD_ITERATIONS = 100_000
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const wranglerPath = resolve(projectRoot, 'node_modules/wrangler/bin/wrangler.js')
const usernamePattern = /^[\p{L}\p{N}_.-]{3,32}$/u

function usage() {
  stdout.write(`管理员人工重置 Ownly 密码\n\n用法：\n  npm run admin:reset-password -- --remote\n  npm run admin:reset-password -- --local\n\n必须明确选择 --remote（线上 D1）或 --local（本地 D1）。\n`)
}

function parseTarget() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    usage()
    process.exit(0)
  }
  if (args.some((arg) => arg !== '--remote' && arg !== '--local')) {
    throw new Error('存在不支持的参数；密码不能通过命令行参数传入')
  }
  const remote = args.includes('--remote')
  const local = args.includes('--local')
  if (remote === local) throw new Error('请且只能指定 --remote 或 --local')
  return remote ? '--remote' : '--local'
}

async function ask(prompt) {
  const readline = createInterface({ input: stdin, output: stdout })
  try {
    return await readline.question(prompt)
  } finally {
    readline.close()
  }
}

function askHidden(prompt) {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('必须在交互式终端中输入密码'))
  }

  stdout.write(prompt)
  stdin.resume()
  stdin.setEncoding('utf8')
  stdin.setRawMode(true)

  return new Promise((resolvePromise, rejectPromise) => {
    let value = ''

    function finish(error) {
      stdin.off('data', onData)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write('\n')
      if (error) rejectPromise(error)
      else resolvePromise(value)
    }

    function onData(chunk) {
      for (const char of chunk) {
        if (char === '\u0003' || char === '\u001b') return finish(new Error('操作已取消'))
        if (char === '\r' || char === '\n') return finish()
        if (char === '\b' || char === '\u007f') {
          if (value.length > 0) {
            value = value.slice(0, -1)
            stdout.write('\b \b')
          }
          continue
        }
        if (char >= ' ') {
          value += char
          stdout.write('*')
        }
      }
    }

    stdin.on('data', onData)
  })
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function runWrangler(target, inputArgs, expectJson = true) {
  const result = spawnSync(process.execPath, [
    wranglerPath, 'd1', 'execute', DATABASE_NAME, target, '--yes', ...(expectJson ? ['--json'] : []), ...inputArgs,
  ], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    const loginHint = `${result.stderr}\n${result.stdout}`.toLowerCase().includes('login')
      ? '，请先执行 npx wrangler login'
      : ''
    throw new Error(`Wrangler 执行失败（退出码 ${result.status}）${loginHint}`)
  }

  if (!expectJson) return []

  try {
    const output = JSON.parse(result.stdout)
    const statements = Array.isArray(output) ? output : [output]
    if (!statements.length || statements.some((statement) => statement.success !== true)) {
      throw new Error('D1 返回了失败结果')
    }
    return statements
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('无法解析 Wrangler 返回结果')
    throw error
  }
}

async function main() {
  const target = parseTarget()
  const targetName = target === '--remote' ? '线上 D1' : '本地 D1'
  const username = (await ask('要重置密码的用户名：')).trim()
  if (!usernamePattern.test(username)) throw new Error('用户名格式不正确')

  const lookup = runWrangler(target, [
    '--command', `SELECT id, username FROM users WHERE username = ${sqlString(username)} COLLATE NOCASE LIMIT 1`,
  ])
  const user = lookup.flatMap((statement) => statement.results ?? [])[0]
  if (!user) throw new Error(`${targetName} 中不存在该用户`)
  if (typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) {
    throw new Error('数据库中的用户 ID 格式不正确')
  }

  if (target === '--remote') {
    const confirmation = (await ask(`即将重置线上账号“${user.username}”并使所有设备退出，请输入 RESET 继续：`)).trim()
    if (confirmation !== 'RESET') throw new Error('未确认线上重置，操作已取消')
  }

  let newPassword = await askHidden('新密码（8～128 个字符）：')
  let confirmedPassword = await askHidden('再次输入新密码：')
  if (newPassword.length < 8 || newPassword.length > 128) throw new Error('新密码长度必须为 8～128 个字符')
  if (newPassword !== confirmedPassword) throw new Error('两次输入的新密码不一致')

  const salt = randomBytes(16)
  const hash = pbkdf2Sync(newPassword, salt, PASSWORD_ITERATIONS, 32, 'sha256')
  newPassword = ''
  confirmedPassword = ''

  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'ownly-reset-'))
  const sqlFile = join(temporaryDirectory, 'reset-password.sql')
  const sql = [
    `UPDATE users SET password_hash = ${sqlString(hash.toString('base64'))}, password_salt = ${sqlString(salt.toString('base64'))} WHERE id = ${sqlString(user.id)};`,
    `DELETE FROM sessions WHERE user_id = ${sqlString(user.id)};`,
  ].join('\n')

  try {
    writeFileSync(sqlFile, sql, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
    // Wrangler 执行文件时会先输出上传进度，因此这里只依据退出码判断结果。
    runWrangler(target, ['--file', sqlFile], false)
  } finally {
    hash.fill(0)
    salt.fill(0)
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }

  stdout.write(`密码已重置：${targetName} 账号“${user.username}”的所有旧会话均已失效。\n`)
}

main().catch((error) => {
  process.stderr.write(`重置失败：${error instanceof Error ? error.message : '未知错误'}\n`)
  process.exitCode = 1
})
