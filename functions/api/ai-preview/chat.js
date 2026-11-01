import {chat} from '../../_lib/ai_preview_bff.js';
export async function onRequestPost({request,env}){return chat(request,env);}
