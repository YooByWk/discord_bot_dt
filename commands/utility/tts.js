const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 't',
    description: '텍스트를 음성으로 변환합니다.',
  },
  async execute(message, args) {
    // 메시지에서 텍스트를 가져옵니다.
    const text = args.join(' ');
    if (!text) {
      return message.reply('변환할 텍스트를 입력하세요.');
    }
    // 넌 누구냐
    const user = message.member.displayName;
    const fullTxt = `${user}가 ${text}래요`;
    
    const gtts = new gTTS(fullTxt, 'ko');
    const filePath = path.join(__dirname, 'tts.mp3');

    // 사용자가 음성 채널에 있는지 확인합니다.
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('먼저 음성 채널에 들어가주세요.');
    }

    
    // 음성 채널에 연결합니다.
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    connection.setMaxListeners(20);
    
    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log('봇 연결~!');
    });

    // 오디오 플레이어를 생성하고 음성 파일을 재생합니다.
    const player = createAudioPlayer();
    let idleTimer;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
          console.log('5분동안 아무 동작이 없어 연결을 종료합니다.');
        }
      }, 5 * 60 * 1000); // 5분
    };

    resetIdleTimer();

    gtts.save(filePath, (err) => {
      if (err) {
        console.error(err);
        return message.reply('텍스트 변환 중 오류가 발생했습니다.');
      }

      const resource = createAudioResource(filePath);
      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        resetIdleTimer();
      });

      player.on(AudioPlayerStatus.Playing, () => {
        if (idleTimer) clearTimeout(idleTimer);
      });
    });
  },
};