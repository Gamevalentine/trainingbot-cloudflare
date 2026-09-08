import { checkAllUptime } from './lib/uptime';

export default {
  async scheduled(_controller:any, env:any, ctx:any) {
    ctx.waitUntil(checkAllUptime(env.DB,50));
  }
};
