import RoleSignIn from '../../components/auth/RoleSignIn'

export default function ApplicantSignIn() {
  return (
    <RoleSignIn
      expectedRole="applicant"
      successPath="/applicant"
      title="Applicant Access"
      description="Sign in to track your job application status."
    />
  )
}
