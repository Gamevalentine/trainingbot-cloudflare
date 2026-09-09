import { checkAllUptime } from './lib/uptime';
import { syncAllGithub } from './lib/github-sync';

export default {
  async scheduled(_controller:any, env:any, ctx:any) {
    ctx.waitUntil(checkAllUptime(env.DB,50));
    if (new Date().getUTCHours() % 6 === 0) ctx.waitUntil(syncAllGithub(env.DB,30));
  }
};
