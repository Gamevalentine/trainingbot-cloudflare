const API_ORIGIN = "https://trainingbot-cloud.ai-vn.workers.dev";

export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, API_ORIGIN);

  const upstreamRequest = new Request(target.toString(), request);
  const upstreamResponse = await fetch(upstreamRequest);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  });
}
