import {session} from '../../_lib/ai_preview_bff.js';
export async function onRequestPost({request,env}){return session(request,env);}
