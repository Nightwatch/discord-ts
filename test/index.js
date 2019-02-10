const commando = require('../')
const path = require('path')
const token = require('./auth').token

const client = new commando.CommandoClient({
  commandPrefix: [ 'c.', 'c!' ],
  ownerId: '176785428450377728'
})

client
	.on('error', console.error)
  .on('warn', console.warn)
  .on('debug', console.log)
	.on('ready', () => {
		console.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`)
	})
  .on('disconnect', () => {
    console.warn('Disconnected!')
  })
	.on('reconnecting', () => {
    console.warn('Reconnecting...')
  })

client.registerCommandsIn(path.join(__dirname, 'commands')).then(() => client.login(token).catch(console.error))
