import { Message, Command, Client } from '../../../src'

/**
 * Throws an exception to test command exception handling
 */
// tslint:disable-next-line: no-default-export
export default class ThrowCommand extends Command {
  public constructor(client: Client) {
    super(client, {
      name: 'throw',
      description: 'Throws an exception.'
    })
  }

  public async run(msg: Message): Promise<void> {
    throw new Error('Something bad happened.')
  }
}
