import { CommandOptions, CommandoClient, CommandoMessage } from '.'

export abstract class Command {
  public readonly options: CommandOptions
  public readonly client: CommandoClient

  constructor(client: CommandoClient, options: CommandOptions) {
    this.options = options
    this.client = client
  }

  public async hasPermission(msg: CommandoMessage): Promise<boolean> {
    return true
  }

  public abstract async run(msg: CommandoMessage, args?: any): Promise<void>

  public static find(client: CommandoClient, name: string) {
    return client.commands.get(name)
  }
}
