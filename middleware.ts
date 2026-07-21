const PRERENDER_URL = 'https://us-central1-studio-8895863664-52c12.cloudfunctions.net/prerender'

const BOT_PATTERN = /googlebot|google-structured-data-testing-tool|bingbot|slurp|duckduckbot|baiduspider|yandex|twitterbot|facebot|facebookexternalhit|linkedinbot|whatsapp|slack|discord|telegrambot|semrush|ahrefsbot|mj12bot|dotbot|crawler|spider/i

export default async function middleware(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = url.pathname

  if (!BOT_PATTERN.test(userAgent)) return

  try {
    const prerenderRes = await fetch(`${PRERENDER_URL}?path=${encodeURIComponent(pathname)}`)

    if (prerenderRes.ok) {
      const html = await prerenderRes.text()
      const is404 = prerenderRes.headers.get('x-404') === 'true' || html.includes('id="root"') && html.includes('Page not found')
      return new Response(html, {
        status: is404 ? 404 : 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=3600, s-maxage=86400',
          'x-prerendered': 'true',
        },
      })
    }
  } catch {}
}
