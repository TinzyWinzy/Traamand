import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RoleSignIn from '../components/auth/RoleSignIn'

export default function SignIn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      sessionStorage.setItem('traamand_ref', ref.toUpperCase())
    }
  }, [searchParams])

  return (
    <RoleSignIn
      expectedRole="client"
      successPath="/"
      title={`Welcome to Traamand`}
      description="Sign in to track bookings, manage hires, and more."
    />
  )
}
