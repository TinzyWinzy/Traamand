import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiatePayment, pollPaymentStatus, configurePaynow } from '../lib/paynow'

describe('Paynow Payment Module', () => {
  beforeEach(() => {
    configurePaynow({
      integrationId: 'test-id',
      integrationKey: 'test-key',
      resultUrl: 'http://localhost/result',
      returnUrl: 'http://localhost/return',
    })
  })

  describe('initiatePayment', () => {
    it('should parse URLSearchParams response correctly with all parameters', async () => {
      const mockResponse = 'status=Ok&PollUrl=https://paynow.co.zw/poll&BrowserUrl=https://paynow.co.zw/payment&reference=TEST123'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await initiatePayment('TEST-123', 100, 'test@example.com', 'Test payment')

      expect(result.success).toBe(true)
      expect(result.redirectUrl).toBe('https://paynow.co.zw/payment')
      expect(result.pollUrl).toBe('https://paynow.co.zw/poll')
      expect(result.error).toBeUndefined()
    })

    it('should parse URLSearchParams response with PollUrl and BrowserUrl (case-insensitive)', async () => {
      const mockResponse = 'Status=Ok&PollUrl=https://paynow.co.zw/poll/abc123&BrowserUrl=https://paynow.co.zw/pay/xyz789'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await initiatePayment('REF-123', 50.50, 'user@example.com', 'Service fee')

      expect(result.success).toBe(true)
      expect(result.redirectUrl).toBe('https://paynow.co.zw/pay/xyz789')
      expect(result.pollUrl).toBe('https://paynow.co.zw/poll/abc123')
    })

    it('should handle URL-encoded special characters', async () => {
      const mockResponse =
        'Status=Ok&PollUrl=https://paynow.co.zw/poll%3Ftoken%3Dabc123%26id%3D456&BrowserUrl=https://paynow.co.zw/pay%3Fref%3Dxyz'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await initiatePayment('REF-456', 75.25, 'client@example.com', 'Payment with special chars')

      expect(result.success).toBe(true)
      expect(result.redirectUrl).toContain('https://paynow.co.zw/pay')
      expect(result.pollUrl).toContain('https://paynow.co.zw/poll')
    })

    it('should return error when Error parameter is present', async () => {
      const mockResponse = 'Status=Failed&Error=Duplicate%20reference&reference=TEST-789'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await initiatePayment('TEST-789', 100, 'test@example.com', 'Failed payment')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Duplicate reference')
    })

    it('should return error when PollUrl or BrowserUrl is missing', async () => {
      const mockResponse = 'Status=Ok&PollUrl=https://paynow.co.zw/poll'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await initiatePayment('REF-999', 50, 'test@example.com', 'Incomplete response')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment initiation failed')
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const result = await initiatePayment('REF-ERR', 50, 'test@example.com', 'Network failure')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('pollPaymentStatus', () => {
    it('should parse poll response and detect paid status', async () => {
      const mockResponse = 'status=Paid&reference=TEST-123&amount=100'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await pollPaymentStatus('https://paynow.co.zw/poll/test')

      expect(result.paid).toBe(true)
      expect(result.status).toBe('Paid')
    })

    it('should detect unpaid status', async () => {
      const mockResponse = 'status=Awaiting+Delivery&reference=TEST-123'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await pollPaymentStatus('https://paynow.co.zw/poll/test')

      expect(result.paid).toBe(false)
      expect(result.status).toBe('Awaiting Delivery')
    })

    it('should handle case-insensitive status check', async () => {
      const mockResponse = 'status=PAID&reference=TEST-456'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await pollPaymentStatus('https://paynow.co.zw/poll/test')

      expect(result.paid).toBe(true)
      expect(result.status).toBe('PAID')
    })

    it('should handle missing status gracefully', async () => {
      const mockResponse = 'reference=TEST-789&amount=50'

      global.fetch = vi.fn().mockResolvedValueOnce({
        text: async () => mockResponse,
      })

      const result = await pollPaymentStatus('https://paynow.co.zw/poll/test')

      expect(result.paid).toBe(false)
      expect(result.status).toBe('unknown')
    })

    it('should handle fetch errors in poll', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection timeout'))

      const result = await pollPaymentStatus('https://paynow.co.zw/poll/test')

      expect(result.paid).toBe(false)
      expect(result.status).toBe('error')
    })
  })
})
