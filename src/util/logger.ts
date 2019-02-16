import * as P from 'pino'

const Logger = P({
  prettyPrint: true,
  redact: {
    paths: ['hostname', 'pid'],
    remove: true
  },
  timestamp: false
})

export { Logger }
