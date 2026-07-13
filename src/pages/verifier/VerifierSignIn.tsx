import RoleSignIn from '../../components/auth/RoleSignIn'

export default function VerifierSignIn() {
  return (
    <RoleSignIn
      expectedRole="verifier"
      successPath="/verifier"
      title="Verifier Access"
      description="Sign in to review and verify worker applications."
    />
  )
}
