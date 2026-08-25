export function onRequest(context) {
  const target = new URL('/admin.html?v=2', context.request.url);
  return Response.redirect(target.toString(), 302);
}
