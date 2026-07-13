import RoleSignIn from '../../components/auth/RoleSignIn'

export default function CreatorSignIn() {
  return (
    <RoleSignIn
      expectedRole="creator"
      successPath="/creator"
      title="Creator Access"
      description="Sign in to manage your content submissions."
    />
  )
}
