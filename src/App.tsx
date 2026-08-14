import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { useAuth } from './auth-context'
import { CloudSyncProvider } from './sync'
import { AppLayout } from './components'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const AssetEditor = lazy(() => import('./pages/AssetEditor'))
const AssetDetail = lazy(() => import('./pages/AssetDetail'))
const Stats = lazy(() => import('./pages/Stats'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))

function AuthenticatedApp() {
  const { user } = useAuth()
  if (user === undefined) return <div className="app-loading"><div className="loading-mark">O</div><span>正在连接 Ownly…</span></div>
  if (!user) return <Suspense fallback={<div className="loading-state">正在打开登录页…</div>}><Login /></Suspense>

  return (
    <CloudSyncProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="loading-state">正在打开 Ownly…</div>}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/assets/new" element={<AssetEditor />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/assets/:id/edit" element={<AssetEditor />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CloudSyncProvider>
  )
}

export default function App() {
  return <AuthProvider><AuthenticatedApp /></AuthProvider>
}
