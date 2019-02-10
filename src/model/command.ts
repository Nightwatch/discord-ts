import { CommandOptions, CommandoClient, CommandoMessage } from '.'

export class Command {
  public readonly options: CommandOptions
  public readonly client: CommandoClient

  constructor(client: CommandoClient, options: CommandOptions) {
    this.options = options
    this.client = client
  }

  public hasPermission(msg: CommandoMessage): boolean {
    return true
  }

  public async run(msg: CommandoMessage): Promise<any> {}

  public static find(client: CommandoClient, name: string) {
    return client.commands.get(name)
  }
}
