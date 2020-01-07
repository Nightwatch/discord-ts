import { Message, Command, Client } from '../../../src'

/**
 * Simple command to test the hasPermission method
 */
// tslint:disable-next-line: no-default-export
export default class NoPermissionCommand extends Command {
  public constructor(client: Client) {
    super(client, {
      name: 'no-permission',
      description: 'Tests the hasPermission method.',
      group: 'auth'
    })
  }

  public async hasPermission() {
    return new Promise<boolean>(resolve => {
      setTimeout(() => {
        resolve(true)
      }, 2000)
    })
  }

  public async run(msg: Message, args: AddCommandArguments): Promise<void> {
    await msg.reply('This is a secret message. You should not be able to see me.')
  }
}

interface AddCommandArguments {
  /**
   * A string containing numbers separated by spaces
   */
  numbers: string
}
