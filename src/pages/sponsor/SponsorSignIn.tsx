import RoleSignIn from '../../components/auth/RoleSignIn'

export default function SponsorSignIn() {
  return (
    <RoleSignIn
      expectedRole="sponsor"
      successPath="/sponsor"
      title="Sponsor Access"
      description="Sign in to manage your sponsorships and placements."
    />
  )
}
