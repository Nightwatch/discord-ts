const commando = require('../../');

module.exports = class UnknownCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: 'unknown',
      description: 'Acts as a response to unknown commands.',
      unknown: true,

      args: [
        {
          key: 'cmd',
          type: 'string'
        }
      ]
		})
	}

	async run(msg, { cmd }) {
    return msg.reply(`Unknown command \`${cmd}\`.`)
	}
}
