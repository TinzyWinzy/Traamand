import RoleSignIn from '../../components/auth/RoleSignIn'

export default function AdminSignIn() {
  return (
    <RoleSignIn
      expectedRole="admin"
      successPath="/admin"
      title="Staff Login"
      description="Authorized staff only. Sign in with your Traamand Google account."
    />
  )
}
