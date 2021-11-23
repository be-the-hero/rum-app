/** 群组模板类型(用于[group.app_key]) */
export enum GROUP_TEMPLATE_TYPE {
  TIMELINE = 'group_timeline',
  POST = 'group_post',
  NOTE = 'group_note',
}

export interface IBootstrap {
  host: string
  id: string
}

console.log(' ------------- hard code: bootstrap ---------------');
export const BOOTSTRAPS = [
  // {
  //   host: '94.23.17.189',
  //   id: '16Uiu2HAmGTcDnhj3KVQUwVx8SGLyKBXQwfAxNayJdEwfsnUYKK4u',
  // },
  // {
  //   host: '132.145.109.63',
  //   id: '16Uiu2HAmTovb8kAJiYK8saskzz7cRQhb45NRK5AsbtdmYsLfD3RM',
  // },
  {
    host: '127.0.0.1',
    id: '16Uiu2HAmERhKtgFYpjM48Sctxs11vv7tdTSmBCZWcibWLwP8Zc8g',
  },
] as IBootstrap[];
