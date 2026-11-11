// Public TrainingBot AI entry point. Chat/auth stays on the existing isolated
// Visitor Preview origin; never proxy credentials, cookies, or Admin operations.
// Deliberately ignore all user-controlled query strings (no open redirect).
const DESTINATION="https://preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev/ai-preview";
function redirect(){
 return new Response(null,{status:302,headers:{
  location:DESTINATION,
  "cache-control":"no-store, max-age=0",
  "x-robots-tag":"noindex, nofollow",
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer"
 }});
}
export function onRequestGet(){return redirect();}
export function onRequestHead(){return redirect();}
