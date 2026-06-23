import { useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Tendai M.',
    role: 'Client, Borrowdale',
    text: 'Traamand found us an incredible nanny who has been with us for over a year. The vetting process gave us complete confidence.',
  },
  {
    name: 'Chido M.',
    role: 'Client, Mt Pleasant',
    text: 'After a bad experience elsewhere, Traamand restored our trust. Professional, responsive, and they truly care about matching the right person.',
  },
  {
    name: 'Sarah K.',
    role: 'Client, Greendale',
    text: 'I needed a part-time housekeeper and Traamand delivered within a week. The police clearance was already done — no hassle at all.',
  },
  {
    name: 'Michael N.',
    role: 'Client, Glen Lorne',
    text: 'Excellent service from start to finish. The team listened to our needs and found a perfect live-in helper for my elderly parents.',
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c === 0 ? TESTIMONIALS.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === TESTIMONIALS.length - 1 ? 0 : c + 1))

  return (
    <section className="bg-brand-teal-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mt-4 text-gray-600">
            Hear from families in Harare who trusted us with their home.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-2xl">
          <div className="overflow-hidden rounded-2xl bg-white p-8 shadow-md sm:p-12">
            <Quote className="h-8 w-8 text-brand-teal/30" />
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              &ldquo;{TESTIMONIALS[current].text}&rdquo;
            </p>
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="font-semibold text-brand-navy">{TESTIMONIALS[current].name}</p>
              <p className="text-sm text-gray-500">{TESTIMONIALS[current].role}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-brand-teal hover:text-white hover:border-brand-teal active:bg-brand-teal/10"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-3 sm:gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition ${
                    i === current ? 'bg-brand-teal w-6 sm:w-4 h-3 sm:h-2' : 'bg-gray-300 w-3 h-3 sm:w-2 sm:h-2'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-brand-teal hover:text-white hover:border-brand-teal active:bg-brand-teal/10"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
