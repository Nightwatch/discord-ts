# Discord.ts

Superset of discord.js with a built-in command framework.

## Installation

Prerequisites

- Node.js >= v10

You can install Discord.ts with your favorite package manager:

- `npm install --save discord.ts`

## Usage

### Creating a bot

To create a bot, you need to create a `Client` instance.

```ts
import { Client } from 'discrd.ts'

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

### Creating a command

Discord.ts comes with its own command framework, allowing you to create powerful commands very easily.

#### Hello world command

Let's take a look at the most basic command we can create, a command that simply says "Hello, World!" when it is ran.

To create the command, we first create a `commands` folder in the root of our project.

Within that folder, create a new file, `hello-world.ts` (or `hello-world.js` if you are using JavaScript).

Here is the completed command:

```ts
import { Client, Message, Command } from 'discord.ts'

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
- The `run` method contains the logic you want to run when the command is executed.

<!-- TODO

#### Adding arguments

#### Command permissions (hasPermission)



-->
