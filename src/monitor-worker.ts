import { checkAllUptime } from './lib/uptime';
import { syncAllGithub } from './lib/github-sync';

export default {
  async scheduled(controller:any, env:any, ctx:any) {
    const hour=new Date().getUTCHours();
    ctx.waitUntil(checkAllUptime(env.DB,50,{lumaService:env.LUMA_SERVICE}));
    if(hour%6===0) ctx.waitUntil(syncAllGithub(env.DB,30));
  }
};
