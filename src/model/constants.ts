import { ClientOptions } from 'discord.js'
export const DefaultOptions: ClientOptions = {
  disableEveryone: false,
  disabledEvents: [],
  fetchAllMembers: false,
  messageCacheLifetime: 0,
  messageCacheMaxSize: 200,
  messageSweepInterval: 0,
  presence: {},
  restTimeOffset: 500,
  restWsBridgeTimeout: 5000,
  retryLimit: 1,
  http: {
    cdn: 'https://cdn.discordapp.com',
    invite: 'https://discord.gg',
    version: 7
  },
  ws: {
    compress: false,
    large_threshold: 250
  }
}

export enum Event {
  INVALID_COMMAND = 'invalidCommand',
  COMMAND_RUN = 'command'
}
