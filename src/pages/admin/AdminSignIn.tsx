import RoleSignIn from '../../components/auth/RoleSignIn'

export default function AdminSignIn() {
  return (
    <RoleSignIn
      expectedRole="admin"
      successPath="/admin"
      title="Admin Access"
      description="Restricted to authorized administrators only."
    />
  )
}
