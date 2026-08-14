import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Pencil, Plus, ReceiptText, RotateCcw, Trash2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssetIcon, normalizeAssetIcon } from '../asset-icons'
import { DatePicker } from '../DatePicker'
import { db } from '../db'
import type { AssetExpense } from '../types'
import { dailyCost, expenseTotal, money, netCost, ownedDays, statusMeta, today, uid } from '../utils'
import { EmptyState } from '../components'

const EMPTY_EXPENSES: AssetExpense[] = []

export default function AssetDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const asset = useLiveQuery(async () => (await db.assets.get(id)) ?? null, [id])
  const category = useLiveQuery(() => asset ? db.categories.get(asset.categoryId) : undefined, [asset?.categoryId])
  const expenses = useLiveQuery(async () => {
    const values = await db.expenses.where('assetId').equals(id).toArray()
    return values.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [id]) ?? EMPTY_EXPENSES
  const [addingExpense, setAddingExpense] = useState(false)
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDirection, setExpenseDirection] = useState<'add' | 'deduct'>('add')
  const [expenseDate, setExpenseDate] = useState(today())
  const [expenseNotes, setExpenseNotes] = useState('')
  const [expenseError, setExpenseError] = useState('')

  const chartData = useMemo(() => {
    if (!asset) return []
    const totalDays = ownedDays(asset)
    const points = Array.from({ length: Math.min(7, totalDays) }, (_, index) => {
      const day = Math.max(1, Math.round(1 + (index * (totalDays - 1)) / Math.max(1, Math.min(7, totalDays) - 1)))
      return { day: `第${day}天`, cost: Number((netCost(asset, expenses) / day).toFixed(2)) }
    })
    return points
  }, [asset, expenses])

  if (asset === undefined) return <div className="loading-state">正在读取物品…</div>
  if (!asset) return <EmptyState title="物品不存在" description="它可能已被删除。" action={<button className="primary-button" onClick={() => navigate('/')}>返回首页</button>} />
  const status = statusMeta[asset.status]
  const expenseBalance = expenseTotal(asset.id, expenses)

  async function toggleRetired() {
    if (!asset) return
    const retired = asset.status === 'retired'
    await db.assets.update(asset.id, {
      status: retired ? 'using' : 'retired',
      retiredDate: retired ? undefined : today(),
      updatedAt: new Date().toISOString(),
    })
  }

  async function remove() {
    if (!asset) return
    if (!window.confirm(`确定删除“${asset.name}”吗？此操作无法撤销。`)) return
    await db.transaction('rw', db.assets, db.expenses, async () => {
      await db.expenses.where('assetId').equals(asset.id).delete()
      await db.assets.delete(asset.id)
    })
    navigate('/', { replace: true })
  }

  async function addExpense(event: FormEvent) {
    event.preventDefault()
    if (!asset) return
    const amount = Number(expenseAmount)
    if (!expenseName.trim()) return setExpenseError('请输入费用名称')
    if (!Number.isFinite(amount) || amount <= 0) return setExpenseError('请输入大于 0 的费用金额')
    if (!expenseDate || expenseDate < asset.purchaseDate || expenseDate > today()) return setExpenseError('费用日期应在购买日期和今天之间')
    const now = new Date().toISOString()
    await db.expenses.add({
      id: uid('expense'), assetId: asset.id, name: expenseName.trim(),
      amount: expenseDirection === 'add' ? amount : -amount,
      date: expenseDate, notes: expenseNotes.trim(), createdAt: now, updatedAt: now,
    })
    setExpenseName('')
    setExpenseAmount('')
    setExpenseDirection('add')
    setExpenseDate(today())
    setExpenseNotes('')
    setExpenseError('')
    setAddingExpense(false)
  }

  async function removeExpense(expense: AssetExpense) {
    if (!window.confirm(`确定删除费用“${expense.name}”吗？`)) return
    await db.expenses.delete(expense.id)
  }

  return (
    <div className="sub-page detail-page">
      <header className="page-header overlay-header">
        <button className="icon-button" onClick={() => navigate(-1)}><ArrowLeft /></button>
        <div className="header-actions">
          <button className="icon-button" onClick={() => navigate(`/assets/${asset.id}/edit`)}><Pencil /></button>
          <button className="icon-button danger-icon" onClick={() => void remove()}><Trash2 /></button>
        </div>
      </header>

      <section className="detail-intro">
        <div className="detail-visual" style={{ color: category?.color, background: category ? `${category.color}12` : undefined }}><AssetIcon name={normalizeAssetIcon(asset.icon, asset.categoryId)} size={72} /></div>
        <h1>{asset.name}</h1>
        <div className="detail-tags">
          <span><i style={{ background: status.color }} />{status.label}</span>
          <span className="blue-tag">{category?.name ?? '未分类'}</span>
          <span className="green-tag">{ownedDays(asset)} 天</span>
        </div>
        <div className="detail-actions">
          <button className="soft-button retire" onClick={() => void toggleRetired()}><RotateCcw />{asset.status === 'retired' ? '重新使用' : '退役'}</button>
        </div>
      </section>

      <section className="detail-card purchase-card">
        <div><span>购买时间</span><strong>{asset.purchaseDate}</strong></div>
        <div><span>购买价格</span><strong>{money(asset.purchasePrice)}</strong></div>
      </section>

      <section className="detail-card expense-card">
        <div className="expense-card-header">
          <div>
            <span>附加费用</span>
            <strong>当前使用成本 {money(netCost(asset, expenses))}</strong>
            <small className={expenseBalance === 0 ? 'neutral' : expenseBalance < 0 ? 'deduct' : 'add'}>
              {expenseBalance === 0 ? `净影响 ${money(0)}` : `${expenseBalance > 0 ? '累计增加' : '累计抵扣'} ${money(Math.abs(expenseBalance))}`}
            </small>
          </div>
          <button className="expense-add-button" onClick={() => { setExpenseError(''); setAddingExpense((current) => !current) }}>
            {addingExpense ? <X /> : <Plus />}{addingExpense ? '取消' : '添加费用'}
          </button>
        </div>

        {addingExpense && (
          <form className="expense-form" onSubmit={addExpense}>
            {expenseError && <div className="error-banner">{expenseError}</div>}
            <div className="field-grid">
              <label className="field"><span>费用名称</span><input autoFocus value={expenseName} onChange={(event) => setExpenseName(event.target.value)} placeholder="例如：更换手机屏幕" maxLength={40} /></label>
              <div className="field">
                <span>费用金额</span>
                <div className="expense-amount-control">
                  <div className="expense-direction" role="group" aria-label="费用对成本的影响">
                    <button type="button" className={expenseDirection === 'add' ? 'active add' : ''} aria-pressed={expenseDirection === 'add'} onClick={() => setExpenseDirection('add')} title="增加成本">＋</button>
                    <button type="button" className={expenseDirection === 'deduct' ? 'active deduct' : ''} aria-pressed={expenseDirection === 'deduct'} onClick={() => setExpenseDirection('deduct')} title="抵扣成本">−</button>
                  </div>
                  <div className="money-input"><b>¥</b><input inputMode="decimal" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="0.00" /></div>
                </div>
                <small className="expense-direction-hint">{expenseDirection === 'add' ? '增加成本：维修、配件等支出' : '抵扣成本：售出、退款等回款'}</small>
              </div>
            </div>
            <div className="field-grid">
              <div className="field"><span>费用日期</span><DatePicker value={expenseDate} min={asset.purchaseDate} max={today()} onChange={setExpenseDate} ariaLabel="费用日期" /></div>
              <label className="field"><span>备注</span><textarea value={expenseNotes} onChange={(event) => setExpenseNotes(event.target.value)} placeholder="维修内容、服务商等信息" rows={2} maxLength={500} /></label>
            </div>
            <button className="primary-button expense-save-button" type="submit">保存费用</button>
          </form>
        )}

        <div className="expense-list">
          {expenses.map((expense) => (
            <article className="expense-item" key={expense.id}>
              <div className={expense.amount >= 0 ? 'expense-item-icon add' : 'expense-item-icon deduct'}><ReceiptText /></div>
              <div className="expense-item-main">
                <strong>{expense.name}</strong>
                <span>{expense.date} · {expense.amount >= 0 ? '增加成本' : '抵扣成本'}</span>
                {expense.notes && <p>{expense.notes}</p>}
              </div>
              <b className={expense.amount >= 0 ? 'expense-item-amount add' : 'expense-item-amount deduct'}>{expense.amount >= 0 ? '+' : '−'}{money(Math.abs(expense.amount))}</b>
              <button className="expense-delete-button" title="删除费用" onClick={() => void removeExpense(expense)}><Trash2 /></button>
            </article>
          ))}
          {!expenses.length && !addingExpense && <p className="expense-empty">还没有附加费用，可记录维修、配件或售出回款。</p>}
        </div>
      </section>

      <section className="detail-card chart-card">
        <div className="card-title"><span>当前日均成本</span><strong>{money(dailyCost(asset, expenses), 3)}</strong></div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1ec96b" stopOpacity={0.35} /><stop offset="100%" stopColor="#1ec96b" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="4 6" stroke="#e5e8ef" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#9098a8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#9098a8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `¥${value}`} />
              <Tooltip formatter={(value) => [money(Number(value)), '日均成本']} />
              <Area type="monotone" dataKey="cost" stroke="#1ec96b" strokeWidth={4} fill="url(#costFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-note">已包含附加费用和售出抵扣。从购买首日到现在共 {ownedDays(asset)} 天，使用越久，日均成本越低。</p>
      </section>

      {asset.notes && <section className="detail-card notes-card"><span>备注</span><p>{asset.notes}</p></section>}
    </div>
  )
}
