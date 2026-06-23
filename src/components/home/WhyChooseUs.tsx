import { ShieldCheck, SearchCheck, GraduationCap, Star } from 'lucide-react'

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Police Vetted',
    description:
      'Every candidate undergoes thorough police background checks for your peace of mind.',
  },
  {
    icon: SearchCheck,
    title: 'Background Checked',
    description:
      'We verify references, employment history, and personal credentials before placement.',
  },
  {
    icon: GraduationCap,
    title: 'Trained Professionals',
    description:
      'Our workers receive formal training in housekeeping, childcare, and elderly care.',
  },
  {
    icon: Star,
    title: 'Satisfaction Guarantee',
    description:
      'Not satisfied? We provide free replacement within the first 30 days of placement.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Why Choose Traamand Maids?
          </h2>
          <p className="mt-4 text-gray-600">
            We take the risk out of hiring domestic help so you can focus on what matters.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-teal-light text-brand-teal transition group-hover:bg-brand-teal group-hover:text-white">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
