import { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { onAuthChange, getUserData } from '../../firebase/auth'
import type { NavigateFunction } from 'react-router-dom'
import type { User as FirebaseUser } from 'firebase/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requireRole?: string
  navigate: NavigateFunction
}

export function AuthGuard({ children, requireRole, navigate }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const roleSignInMap: Record<string, string> = {
        admin: '/admin/sign-in',
        verifier: '/verifier/sign-in',
        creator: '/creator/sign-in',
        sponsor: '/sponsor/sign-in',
        advertise: '/advertise/sign-in',
        applicant: '/applicant/sign-in',
      }
      const target = requireRole && roleSignInMap[requireRole] ? roleSignInMap[requireRole] : '/sign-in'
      navigate(target)
    } else if (!isLoading && isAuthenticated && requireRole && user?.role !== requireRole) {
      navigate('/')
    }
  }, [isLoading, isAuthenticated, requireRole, user?.role, navigate])

  if (isLoading) return null

  if (!isAuthenticated) return null

  if (requireRole && user?.role !== requireRole) return null

  return <>{children}</>
}

export function AuthListener() {
  const { setUser, setFirebaseUser, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    let cancelled = false
    const unsubscribe = onAuthChange(async (fbUser: FirebaseUser | null) => {
      if (cancelled) return
      if (fbUser) {
        setFirebaseUser(fbUser)
        let userData = await getUserData(fbUser.uid)
        let retries = 5
        while (!userData && retries > 0 && !cancelled) {
          await new Promise((r) => setTimeout(r, 800))
          if (cancelled) return
          userData = await getUserData(fbUser.uid)
          retries--
        }
        if (cancelled) return
        if (userData) {
          setUser(userData)
        }
        setLoading(false)
      } else {
        clearAuth()
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return null
}
