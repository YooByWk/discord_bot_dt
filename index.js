// Require the necessary discord.js classes
const logs = require('./logs');
const { Client, Events, GatewayIntentBits, Collection } = require("discord.js")
const fs = require("fs")
const dotenv = require("dotenv")
const path = require("node:path")
const bdoShop = require("./commands/shop/bdoshop")
const ttsCommand = require("./commands/utility/tts")

// Load environment variables from .env file
dotenv.config()
// Path to config.json file
const configPath = "./config.json"
const config = JSON.parse(fs.readFileSync(configPath, "utf8"))

// Get token from environment variables
const envToken = process.env.DISCORD_BOT_TOKEN

// Update config.json file with the token from environment variables
config.token = envToken
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

// Read token from updated config.json file
const { token } = require("./config.json")

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
})
/////////////////////
client.commands = new Collection()

const foldersPath = path.join(__dirname, "commands")
const commandFolders = fs.readdirSync(foldersPath)
const prefix = "^"
const helpCommands = /도움!|도와줘!|명령어|도움말|목록|도움/

let commandcnt = 0
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder)
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    if ("data" in command) {
      client.commands.set(command.data.name, command)
      console.log(`${file}에 해당하는 command가 추가되었습니다.`)
      commandcnt++
    } else {
      console.log(`Error: ${file} does not have a data property`)
      logs.error(`Error: ${file} <- 해당 파일에는 데이터 속성이 없습니다.`)
    }
  }
}
logs.info(`${commandcnt}개의  command가 추가되었습니다.`)

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`)
  logs.info(`Ready! Logged in as ${readyClient.user.tag}`)
})

// Login to Discord with your app's token
client.login(token)

// 도움말 명령어 문자열
client.on("messageCreate", (message) => {
  const serverName = message.guild ? message.guild.name : null;
  let isAllowedChannel = [process.env.DESTINY_ID, process.env.PRIVATE_ID].includes(message.channel.id)
  // console.log(isAllowedChannel, 'isAllowedChannel', message.channel.id)
  let content = message.content

  if (message.author.bot) return

  if (!isAllowedChannel && !message.content.startsWith(prefix)) return

  if (isAllowedChannel) {
    const args = content.split(/ +/g)
    // console.log('args: ', args);
    ttsCommand.execute(message, args)
    return
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  // console.log(command, '= 커맨드')
  if (command.match(helpCommands)) {
    client.commands.get("help").execute(message)
    return
  }
  if (!client.commands.has(command)) return

  try {
    client.commands.get(command).execute(message, args)
  } catch (error) {
    console.error(error)
    logs.error(error, serverName)
    message.reply(`오류 발생!! 김청어에게 문의하세오. ${command} 커멘드 실행 중 오류 발생`)
  }
})

client.on("interactionCreate", async (interaction) => {
  console.log("////////////////")
  // console.log(interaction.customId)
  console.log(interaction, "interaction")

  if (interaction.isButton()) {
    if (interaction.customId.includes("item")) {
      const itemID = interaction.customId.replace("item", "")
      const item = bdoShop.itemsData.find((i) => i.id === parseInt(itemID))
      await interaction.reply(` ${itemID}가 아이템 ID고, 이름은 ${item.name}입니다.`)
    } else {
      await interaction.reply(`${interaction.customId} 이라고 하셨죠?`)
    }
  }
})

///
/*
client.on('messageCreate', message => {
  console.log(message.content)  
  if (message.content === '!ping') {
        message.channel.send('Pong.');
    }
})
*/
