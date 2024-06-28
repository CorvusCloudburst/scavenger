# scavenger

Scavenger is a bot that helps you host scavenger hunts on your Discord server.

To fork and modify this repo, it will helpful for you to have a passing familiarity with the [Discord Developer Documentation](https://discord.com/developers/docs/intro).

## Setup

Clone this project. In your project root folder, run:

```
npm install
```

If you already have an application and bot user set up on Discord, you can skip past the next section and pick up with [Running scavenger](###-running-scavenger).

### Creating a Discord application and bot user

[This tutorial](https://discordpy.readthedocs.io/en/stable/discord.html) will walk you through the process of creating a Discord application and an associated bot account.

Once your bot user is created, you will be provided with a token for it. You will only be shown this token once, so save it somewhere safe. Do not share it or merge it into a code repo.

### Running scavenger

In the root of this project, create a `.env` file. This file is already ignored using `.gitignore`, but just in case it needs to be said, _do not merge this file into a cloud-hosted repository_.

Add the following line to your `.env`:
 ```
  DISCORD_TOKEN={token}
 ```
 
Where the `{token}` value is your bot user's token.

Then, still in your root directory, run the command:
```
npm run start
```

The application will start. You should now see the bot as logged in on your server.

## Usage

TODO