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
      navigate('/sign-in')
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
    const unsubscribe = onAuthChange(async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setFirebaseUser(fbUser)
        let userData = await getUserData(fbUser.uid)
        if (!userData) {
          await new Promise((r) => setTimeout(r, 600))
          userData = await getUserData(fbUser.uid)
        }
        if (userData) {
          setUser(userData)
        } else {
          setUser(null)
        }
      } else {
        clearAuth()
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return null
}
