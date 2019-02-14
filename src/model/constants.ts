export const DefaultOptions = {
  disableEveryone: false,
  disabledEvents: [],
  fetchAllMembers: false,
  messageCacheLifetime: 0,
  messageCacheMaxSize: 200,
  messageSweepInterval: 0,
  presence: {},
  restSweepInterval: 60,
  restTimeOffset: 500,
  restWsBridgeTimeout: 5000,
  retryLimit: 1,
  shardCount: 1,
  totalShardCount: 1,

  http: {
    api: 'https://discordapp.com/api',
    cdn: 'https://cdn.discordapp.com',
    invite: 'https://discord.gg',
    version: 7
  },

  ws: {
    compress: false,
    large_threshold: 250,
    properties: {
      $browser: 'discord.js',
      $device: 'discord.js',
      $os: process.platform
    },
    version: 6
  }
}

export enum Event {
  INVALID_COMMAND = 'invalidCommand',
  COMMAND_RUN = 'command'
}
