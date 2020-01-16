# Bot-TS

Superset of discord.js with a built-in command framework.

## Installation

Prerequisites

- Node.js >= v10

You can install Bot-TS with your favorite package manager:

- `npm install --save bot-ts`

## Usage

### Creating a bot

To create a bot, you need to create a `Client` instance.

```ts
import { Client } from 'bot-ts'

const client = new Client({
  commandPrefix: 'c',
  ownerId: '<Your Discord user ID>'
})

client.login('<Secret bot token>').catch(console.error)
```

The `Client` requires only two options to be passed in the constructor: the command prefix for your commands, and your Discord user ID.

There are several other options you can pass, but they are completely optional.

### Registering commands

To register your commands, you just need to call a single method from the `Client`.

```ts
import * as path from 'path'

client.registerCommandsIn(path.join(__dirname, 'commands')).catch(console.error)
```

This method will find all commands within a directory and register them.

The directory may contain other files and non-commands. I will ignore those.

Bot-TS includes some base commands that you may find helpful. Register them before you register any custom commands:

```ts
client.registerDefaultCommands().registerCommandsIn(path.join(__dirname, 'commands'))
```

If any of your commands are named the same as a base command (or share an alias), your command will take precedence, overriding the base command.

You can also disable some of the default commands, by passing an object to the `registerDefaultCommands` method specifying which commands to disable:

```ts
client.registerDefaultCommands({
  help: false
})
```

Any default command you set to `false` will not be registered.

### Creating a command

Bot-TS comes with its own command framework, allowing you to create powerful commands very easily.

#### Hello world command

Let's take a look at the most basic command we can create, a command that simply says "Hello, World!" when it is ran.

To create the command, we first create a `commands` folder in the root of our project.

Within that folder, create a new file, `hello-world.ts` (or `hello-world.js` if you are using JavaScript).

Here is the completed command:

```ts
import { Client, Message, Command } from 'bot-ts'

export default class HelloWorldCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'helloworld',
      description: 'Greet the world.'
    })
  }

  public async run(msg) {
    await msg.reply('Hello, World!')
  }
}
```

All of your commands must be a subclass of the Command class.

They need to be set to `export default` so the command framework knows to import that class.

Every command will have a minimum of two methods: the constructor and the `run` method.

- The constructor is used to define information about your command (e.g. the name, description, arguments, etc.).
- The `run` method contains the logic you want to execute when the command is called.

#### Adding arguments

In many of your commands, you will want the user to provide values for the command to use. These are called command arguments.

Adding arguments to your commands is very simple.

Let's revise the HelloWorld command from previously to say "Hello, {noun}!" (e.g. "Hello, Planet!", "Hello, Universe!", etc.).

The new command will need a single argument.

An argument requires three properties:

- A unique `key` to label the argument.
- A `phrase` which is used to prompt the user for a value.
- The `type` of the argument, which is used to validate what the user types.
  - Valid types are `'user'`, `'number'`, and `'string'`
  - An argument can have a single type, or can be an array of types (e.g. `[ 'user', 'number' ]`).

Here is the updated command:

```ts
import { Client, Message, Command } from 'bot-ts'

export default class HelloWorldCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'helloworld',
      description: 'Greet the world.',
      args: [
        {
          key: 'noun',
          phrase: 'What, or who, do you want me to greet?',
          type: 'string'
        }
      ]
    })
  }

  public async run(msg, args: { noun: string }) {
    await msg.reply(`Hello, ${noun}!`)
  }
}
```

Please note that the object property within the `run` method must be named exactly the same as the argument `key`, or it will throw a vague exception when the command is called.

#### Command permissions (hasPermission)

There will be some commands you don't want every user to be able to use (e.g. kick, ban, mute, etc.).

Bot-TS allows you to deny users access to these commands with the `hasPermission` method where you can require some conditions to be met in order for the user to be able to use the command (e.g. must require a certain permission, a certain role, etc.)

Let's revise the HelloWorld command once again to restrict the command to only be usable by users with the "MANAGE_MESSAGES" permission.

Here's the final command:

```ts
import { Client, Message, Command } from 'bot-ts'

export default class HelloWorldCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'helloworld',
      description: 'Greet the world.',
      args: [
        {
          key: 'noun',
          phrase: 'What, or who, do you want me to greet?',
          type: 'string'
        }
      ],
      guildOnly: true
    })
  }

  public hasPermission(msg) {
    return msg.member.permissions.has('MANAGE_MESSAGES')
  }

  public async run(msg, args: { noun: string }) {
    await msg.reply(`Hello, ${noun}!`)
  }
}
```
