import { SearchCheck, GraduationCap, Zap, Building2 } from 'lucide-react'
import { COMPANY_NAME } from '../../lib/constants'

const FEATURES = [
  {
    icon: Building2,
    title: 'Registered & Legal',
    description:
      'Traamand is a legally registered employment company operating in full compliance with Zimbabwean labour laws.',
  },
  {
    icon: SearchCheck,
    title: 'Document Verification',
    description:
      'Every candidate undergoes thorough document verification and background screening before placement.',
  },
  {
    icon: GraduationCap,
    title: 'Professionally Trained',
    description:
      'Our housekeepers are trained to match household expectations, with skills in cleaning, childcare, and elderly care.',
  },
  {
    icon: Zap,
    title: 'Immediate Placement',
    description:
      'Focused on speed. We maintain a pool of ready-to-work candidates for households in urgent need.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Why Choose {COMPANY_NAME}?
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
