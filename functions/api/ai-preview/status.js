import {status} from '../../_lib/ai_preview_bff.js';
export async function onRequestGet({request,env}){return status(request,env);}
