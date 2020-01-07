import { Guild, GuildMember } from 'discord.js'
import { Maybe } from 'purify-ts/Maybe'

export class UserService {
  /**
   * Returns a GuildMember from a mention.
   *
   * @param guild - The guild the mention came from.
   * @param mention - The user mention.
   */
  public getMemberFromMention(guild: Guild, mention: NonNullable<string>): Maybe<GuildMember> {
    // source: https://github.com/discordjs/guide/blob/master/guide/miscellaneous/parsing-mention-arguments.md

    return Maybe.fromPredicate(id => id.startsWith('<@') && id.endsWith('>'), mention)
      .map(id => id.slice(2, -1))
      .map(id => id.replace('!', ''))
      .chainNullable(id => guild.members.get(id))
  }
}
