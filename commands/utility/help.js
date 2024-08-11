const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('명령어 목록을 보여줍니다.'),
  async execute(interaction) {
    await interaction.reply('명령어 목록은 다음과 같습니다. \n ^t :입력할 텍스트 -텍스트를 읽어줍니다. \n  ^아이템 :"아이템 이름"  - 거래소에서 검색한 아이템을 보여줍니다.(개발중)');
  },
}