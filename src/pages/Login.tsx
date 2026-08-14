import { useState, type FormEvent } from 'react'
import { Cloud, LockKeyhole, UserRound } from 'lucide-react'
import { useAuth } from '../auth-context'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [registrationCode, setRegistrationCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'login') await login(username.trim(), password)
      else await register(username.trim(), password, registrationCode)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-aside">
        <div className="login-logo"><span>O</span><strong>Ownly</strong></div>
        <div><span className="eyebrow">PRIVATE CLOUD</span><h1>把每一件好物，<br />安心放在自己的空间。</h1><p>登录后，资产数据会在你的设备之间自动同步。</p></div>
        <div className="login-feature"><Cloud /><span><strong>Cloudflare D1 云端备份</strong><small>每个账号拥有独立的数据空间</small></span></div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card-title"><div className="login-mobile-logo">O</div><span>{mode === 'login' ? '欢迎回来' : '创建账号'}</span><h2>{mode === 'login' ? '登录 Ownly' : '注册 Ownly'}</h2><p>{mode === 'login' ? '访问你的个人资产空间' : '注册码由管理员提供'}</p></div>
          <div className="login-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>登录</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>注册</button></div>
          {error && <div className="error-banner">{error}</div>}
          <label className="login-field"><span>用户名</span><div><UserRound /><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" /></div></label>
          <label className="login-field"><span>密码</span><div><LockKeyhole /><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" /></div></label>
          {mode === 'register' && <label className="login-field"><span>注册码</span><div><LockKeyhole /><input type="password" autoComplete="off" value={registrationCode} onChange={(event) => setRegistrationCode(event.target.value)} placeholder="请输入管理员注册码" /></div></label>}
          <button className="primary-button wide login-submit" disabled={submitting}>{submitting ? '请稍候…' : mode === 'login' ? '登录' : '注册并登录'}</button>
          <p className="login-note">数据通过加密连接传输，密码不会以明文保存。</p>
        </form>
      </section>
    </main>
  )
}
