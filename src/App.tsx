import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const AssetEditor = lazy(() => import('./pages/AssetEditor'))
const AssetDetail = lazy(() => import('./pages/AssetDetail'))
const Stats = lazy(() => import('./pages/Stats'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Settings = lazy(() => import('./pages/Settings'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="loading-state">正在打开 Ownly…</div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/assets/new" element={<AssetEditor />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/assets/:id/edit" element={<AssetEditor />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
