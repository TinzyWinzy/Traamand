interface PaynowConfig {
  integrationId: string
  integrationKey: string
  resultUrl: string
  returnUrl: string
}

interface PaynowResponse {
  success: boolean
  redirectUrl?: string
  pollUrl?: string
  reference?: string
  error?: string
}

let paynowConfig: PaynowConfig | null = null

export function configurePaynow(config: PaynowConfig) {
  paynowConfig = config
}

export async function initiatePayment(
  reference: string,
  amount: number,
  email: string,
  description: string
): Promise<PaynowResponse> {
  if (!paynowConfig) {
    throw new Error('Paynow not configured. Call configurePaynow first.')
  }

  try {
    const response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id: paynowConfig.integrationId,
        reference,
        amount: amount.toFixed(2),
        additionalinfo: description,
        returnurl: paynowConfig.returnUrl,
        resulturl: paynowConfig.resultUrl,
        authemail: email,
        status: 'Message',
      }),
    })

    const text = await response.text()
    const params = new URLSearchParams(text)

    const pollUrl = params.get('PollUrl')
    const redirectUrl = params.get('BrowserUrl')

    if (pollUrl && redirectUrl) {
      return { success: true, redirectUrl, pollUrl }
    }

    const error = params.get('Error')
    return { success: false, error: error || 'Payment initiation failed' }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function pollPaymentStatus(pollUrl: string): Promise<{
  paid: boolean
  status: string
}> {
  try {
    const response = await fetch(pollUrl)
    const text = await response.text()
    const params = new URLSearchParams(text)
    const status = params.get('status')

    return {
      paid: status?.toLowerCase() === 'paid',
      status: status || 'unknown',
    }
  } catch {
    return { paid: false, status: 'error' }
  }
}

export async function initiateBookingPayment(
  bookingId: string,
  amount: number,
  email: string
): Promise<PaynowResponse> {
  const { httpsCallable } = await import('firebase/functions')
  const { functions } = await import('../firebase/config')
  const fn = httpsCallable(functions, 'processPaynowPayment')
  const result = await fn({ bookingId, amount, email })
  return result.data as PaynowResponse
}

export async function pollBookingPayment(bookingId: string): Promise<{
  paid: boolean
  status: string
  error?: string
}> {
  const { httpsCallable } = await import('firebase/functions')
  const { functions } = await import('../firebase/config')
  const fn = httpsCallable(functions, 'pollPaynowPayment')
  const result = await fn({ bookingId })
  return result.data as { paid: boolean; status: string; error?: string }
}
