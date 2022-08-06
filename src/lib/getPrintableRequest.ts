export const getPrintableRequest = async (r: Request) => ( {
    url: r.url,
    redirect: r.redirect,
    body: r.body ? `${(await r.body.getReader().read()).value}` : null,
    mode: r.mode,
    cache: r.cache,
    method: r.method,
    headers: Object.fromEntries(r.headers),
    referrer: r.referrer,
    referrerPolicy: r.referrerPolicy,
    integrity: r.integrity,
    keepalive: r.keepalive,
    credentials: r.credentials,
    destination: r.destination,
  })

export default getPrintableRequest
