import RoleSignIn from '../../components/auth/RoleSignIn'

export default function AdvertiseSignIn() {
  return (
    <RoleSignIn
      expectedRole="advertise"
      successPath="/advertise"
      title="Advertiser Access"
      description="Sign in to manage your advertising campaigns."
    />
  )
}
