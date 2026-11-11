import {proxyPublicAi} from '../../_lib/ai_widget_public_proxy.js';
export async function onRequestPost({request}){
  return proxyPublicAi(request,'chat');
}
