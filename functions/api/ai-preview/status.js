import {proxyPublicAi} from '../../_lib/ai_widget_public_proxy.js';
export async function onRequestGet({request}){
  return proxyPublicAi(request,'status');
}
