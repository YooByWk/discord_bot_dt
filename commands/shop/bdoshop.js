const { SlashCommandBuilder } = require("discord.js")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const axios = require("axios")
const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")

// JSON 파일 경로 (루트 디렉토리)
const dataFilePath = path.join(__dirname, "../..", "itemid.json")
const apiURL = process.env.API_URL
let itemsData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"))
// 필터링 패턴
const excludePatterns =
  /부패한|가공된|칠흑의|검은별의|문명|관측|보고서|검은 기운|광기의|검은 정수|크투란|무쇠이빨|헤카루|포장|베이아|키메라|검은색|종족|하게|수은|산맥|데키아|엘비아|엘릭|혈관|노드|희미한|고대의|제휴|들것|유물|감염|검은사막|마패|\[요리\]|\[연금\]|대지를|28일|1일|7일|칭호|선택|이벤트|뿔나팔|폭풍을|기간제|라 오르제카|길드|도안|고뇌의|무기 상자|방어구 상자|PC방|타오르는/
itemsData = itemsData.filter((i) => !excludePatterns.test(i.name) || i.name.includes("카부아의 유물"))

dotenv.config()

const getBdoShopItems = axios.create({
  baseURL: apiURL,
  headers: {
    region: "kr",
  },
})

module.exports = {
  itemsData,
  data: new SlashCommandBuilder().setName("아이템").setDescription("Get the current BDO shop items."),
  /*
    .addStringOption(option =>
      option.setName('item')
        .setDescription('아이템 이름을 입력하세요.')
        .setRequired(true)),
    */
  async execute(interaction) {
    // console.log('Interaction:', interaction); // interaction 객체 로그
    const itemName = interaction.content.split(" ").slice(1).join(" ")
    // console.log('User Input Item Name:', itemName); // itemName 로그

    const items = itemsData.filter((i) => i.name.includes(itemName))
    console.log(items.length, "개의 아이템을 찾았습니다.")
    try {
      if (items.length > 0) {
        const response = items.map((item) => `ID: ${item.id} & Name: ${item.name}`).join("\n")
        // await interaction.reply(response);
        const buttons = items.map((i) =>
          new ButtonBuilder().setCustomId('item'+i.id.toString()).setLabel(i.name.toString()).setStyle("Primary").setEmoji("🛒")
        )
        const row = new ActionRowBuilder()
          .addComponents(buttons)

        await interaction.reply({ content: response, components: [row] })
        
      } else {
        await interaction.reply("아이템을 찾을 수 없습니다.")
      }
    } catch (error) {
      console.error(error)
      if (items.length > 0) {
        await interaction.reply(`${items.length}개의 아이템을 찾았습니다만 너무 많네요.`) 
      }
      else {
        await interaction.reply("에러가 나*&버렸$군요!...;;; 김청어에게 문의하세요")
      }
    }
  },
}
