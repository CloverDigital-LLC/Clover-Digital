import { useEffect } from 'react'
import { Redirect, Route, Switch } from 'wouter'
import { useAuth } from './auth/AuthProvider'
import { SignIn } from './auth/SignIn'
import { Header } from './components/Header'
import { useVentureFilter } from './context/VentureFilterContext'
import { DashboardPage } from './pages/DashboardPage'
import { AgentsIndexPage } from './pages/AgentsIndexPage'
import { AgentProfilePage } from './pages/AgentProfilePage'
import { CloverAgentsPage } from './pages/CloverAgentsPage'
import { DepartmentsIndexPage } from './pages/DepartmentsIndexPage'
import { DepartmentDetailPage } from './pages/DepartmentDetailPage'
import { ProjectsIndexPage } from './pages/ProjectsIndexPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { DetailDrawer } from './components/Detail/DetailDrawer'
import { useRealtimeInvalidation } from './hooks/useRealtimeInvalidation'
import { surfaceTitle } from './lib/surface'

export default function App() {
  const { loading, session, unauthorized, designMode, signOut, user } = useAuth()
  // viewRole is derived from auth role inside VentureFilterContext — Mason's
  // email gets 'admin' view only on the separate admin deployment surface;
  // the Clover deployment stays team-scoped even when Mason signs in.
  const { viewRole } = useVentureFilter()

  // Live updates: Supabase Realtime → invalidates matching React Query keys
  // → cards refresh within ~1s of any row change. Polling stays as backstop.
  useRealtimeInvalidation()

  useEffect(() => {
    document.title = surfaceTitle
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-[13px] text-ink-400 font-display italic">Loading…</div>
      </div>
    )
  }

  if (!designMode && !session) {
    return <SignIn />
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-[26px] text-ink-900 leading-tight">
            You're signed in, but not on the team list.
          </h1>
          <p className="text-[13.5px] text-ink-500 mt-2">
            <span className="font-mono">{user?.email}</span> isn't authorized
            for this dashboard. Ask Mason (mason@cloverdigital.com) to add
            you, then sign in again.
          </p>
          <button
            onClick={signOut}
            className="mt-6 px-4 py-2.5 rounded-full bg-clover-800 text-white text-[13px] font-medium hover:bg-clover-900 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <Header />

      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/departments" component={DepartmentsIndexPage} />
        <Route path="/departments/:department" component={DepartmentDetailPage} />
        {viewRole === 'admin' ? (
          <>
            <Route path="/agents" component={AgentsIndexPage} />
            <Route path="/agents/:name" component={AgentProfilePage} />
            <Route path="/projects" component={ProjectsIndexPage} />
            <Route path="/projects/:slug" component={ProjectDetailPage} />
          </>
        ) : (
          <>
            <Route path="/agents" component={CloverAgentsPage} />
            <Route>
              <Redirect to="/" />
            </Route>
          </>
        )}
        <Route>
          {/* 404 — anything off-route, route home with a soft notice */}
          <main className="max-w-[1240px] mx-auto px-6 pt-12">
            <h1 className="font-display text-[28px] text-ink-900">Not found</h1>
            <p className="text-[13.5px] text-ink-500 mt-2">
              That page isn't here.{' '}
              <a href="/" className="text-clover-700 hover:underline">
                ← back to dashboard
              </a>
            </p>
          </main>
        </Route>
      </Switch>

      <DetailDrawer />
    </div>
  )
}
