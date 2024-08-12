require("dotenv").config();
const { exec } = require("child_process");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require("@discordjs/voice");
const gTTS = require("gtts");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = process.env.FFMPEG_PATH;
ffmpeg.setFfmpegPath(ffmpegPath);
const ALLOWED_CHANNEL_ID = [process.env.DESTINY_ID];
const { EventEmitter } = require('events');
const  logs  = require("../../logs");


const timestamp = Date.now();
const date = new Date(timestamp); 
console.log("ALLOWED_CHANNEL_ID: ", ALLOWED_CHANNEL_ID);
// logs.info(`ALLOWED_CHANNEL_ID: ${ALLOWED_CHANNEL_ID}`);
let speed = 1.6; // 기본 속도
let queue = [];
let isPlaying = false;
const MAX_QUEUE_SIZE = 5;
module.exports = {
  data: {
    name: "t",
    description: "텍스트를 음성으로 변환합니다.",
  },
  async execute(message, args) {
    // 메시지에서 텍스트를 가져옵니다.
    let language = "ko";
    if (args[0] === "esp") {
      args.shift();
      language = "es";
    }

    const initialMapping = {
      ㅎㅇ: "하이",
      ㅂㅇ: "바이",
      ㅇㅋ: "오케",
      ㄱㄱ: "고고",
      ㅈㅅ: "죄송",
      ㅃㅇ: "빠이",
      ㄷㄷ: "덜덜",
    };
    
    let text = args.join(" ");
    
    text = reduceRepeatedChars(text);
    
    
    if (!text) {
      return message.reply("변환할 텍스트를 입력하세요.");
    }
    
    if (text === "tts 도움말" || text === "tts help" || text === "tts 도움" || text === "tts 도움말" || text === "tts속도설정") {
      return message.reply("텍스트를 입력하면 읽어줘요. \b ej. 안녕하세요 \n 재생속도 조절은 tts속도설정 {숫자} 로 입력하세요 ex) tts속도설정 1.5");
    }
    
    
    
    if (args) {
      const speedIndex = args.findIndex((arg) => arg === "tts속도설정");
      if (speedIndex !== -1 && args[speedIndex + 1]) {
        const speedValue = parseFloat(args[speedIndex + 1]);
        if (!isNaN(speedValue) && speedValue > 0.5 && speedValue <= 2.0) {
          speed = speedValue;
          args.splice(speedIndex, 2);
          text = args.join(" ");
          return message.reply(`재생 속도가 ${speed}로 설정되었습니다.`);
        } else {
          return message.reply("속도 값은 0.5 ~ 2.0 사이로 입력해주세요.");
        }
      }
    }

    // 한글 자음을 변환합니다.
    for (const [initial, word] of Object.entries(initialMapping)) {
      const regex = new RegExp(initial, "g");
      text = text.replace(regex, word);
    }

    if (text.length > 200) {
      return message.reply("200자 이하로 입력해주세요.");
    }

    const user = extractUserName(message.member.displayName); // 사용자 이름을 가져옵니다.
    // 마지막 글자가 받침이 있는지 확인합니다.
    const lastChar = text.charAt(text.length - 1);
    const nameLastChar = user.charAt(user.length - 1);
    // const hasJongseong = (lastChar.charCodeAt(0) - 0xac00) % 28 !== 0;
    const nameHasJongseong = (nameLastChar.charCodeAt(0) - 0xac00) % 28 !== 0;
    const particle = nameHasJongseong ? "이" : "가";

    const fullTxt = `${user}${particle} ${text}`; // 받침의 유무에 따라서 나눠서 말을 만들어줍니다.
    const gtts = language === "ko" ? new gTTS(fullTxt, "ko") : new gTTS(text, "es", "es-AR");
    const uniqueId = uuidv4(); // 고유 ID 생성
    const filePath = path.join(__dirname, `tts_${uniqueId}.mp3`);
    // 사용자가 음성 채널에 있는지 확인합니다.
    const voiceChannel = message.member.voice.channel;
    let serverName = message.guild ? message.guild.name : null;
    if (!voiceChannel) {
      logs.warn("유저가 음성 채널에 없어요.", serverName);
      return message.reply("먼저 음성 채널에 들어가주세요.");
    }
    // 음성 채널에 연결합니다.
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    connection.setMaxListeners(50); // 
    EventEmitter.defaultMaxListeners = 50;
    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("봇 연결~!");
      logs.info("봇 연결~!", serverName);
    });

    // 오디오 플레이어를 생성하고 음성 파일을 재생합니다.
    const player = createAudioPlayer();
    let idleTimer;

    // 이벤트 리스너를 한 번만 설정합니다.
    
    player.on(AudioPlayerStatus.Idle, () => {
      logs.info(`재생이 끝났습니다. :${user} || 내용 :  ${text} // 시간: ${date.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})}`, serverName);
      console.log(`재생이 끝났습니다. :${user} || 내용 :  ${text} // 시간: ${date.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})}`);
      resetIdleTimer();
    });

    player.on(AudioPlayerStatus.Playing, () => {
      if (idleTimer) clearTimeout(idleTimer);
      resetIdleTimer()
    });

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(async () => {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
          const leaveMessage = "5분간 명령이 없어 채팅방을 나갑니다.";
          const leaveGtts = new gTTS(leaveMessage, "ko");
          const leaveFilePath = path.join(__dirname, "leave.mp3");
          const tempFilePath = path.join(__dirname, "leave_temp.mp3");
          
          leaveGtts.save(leaveFilePath, (err) => {
            if (err) {
              console.error(err);
              logs.error(err, serverName);
              connection.destroy();
              return;
            }

            ffmpeg(leaveFilePath)
              .audioFilters(`atempo=${speed}`)
              .save(leaveFilePath)
              .on("end", () => {
                const leaveResource = createAudioResource(leaveFilePath);
                player.play(leaveResource);
                connection.subscribe(player);
                player.once(AudioPlayerStatus.Idle, () => {
                  if (fs.existsSync(leaveFilePath)) {
                    fs.unlinkSync(leaveFilePath);
                  }
                  if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                  }
                  connection.destroy();
                  console.log("5분동안 아무 동작이 없어 연결을 종료합니다. tts 157 : 종료");
                  logs.info("5분동안 아무 동작이 없어 연결 종료. tts 157 : 종료", serverName);

                });
              });
          });
        }
      }, 300000); // 5분
    }; // resetIdleTimer
    resetIdleTimer();

    const tempFilePath = filePath + ".temp";
    gtts.save(tempFilePath, (err) => {
      if (err) {
        console.error(err);
        logs.error(err,serverName);
        return message.reply("텍스트 변환 중 오류가 발생했습니다. ㅠ;");
      }
      
      if (queue.length >= 5) {
        logs.duplicate(user, text,serverName);
        return message.reply("너무 요청이 많아요... 잠시 후에 다시 시도해주세요.");
      }

      ffmpeg(tempFilePath)
        .audioFilters(`atempo=${speed}`) // 전역 속도 변수 사용
        .save(filePath)
        .on("end", () => {
          // console.log(speed, "speed로 재생중");
          fs.unlinkSync(tempFilePath); // 임시 파일 삭제
          const resource = createAudioResource(filePath);
          queue.push({ resource, filePath }); // 큐에 추가
          if (!isPlaying) {
            playNextInQueue(connection, player);
          }
        });
    }); // gtts.save

    const checkVoiceChannelMembers = () => {
      if (voiceChannel.members.size === 1) {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
          console.log("음성 채널에 아무도 없어 연결을 종료합니다.");
        }
      }
    }; // checkVoiceChannelMembers

    setInterval(checkVoiceChannelMembers, 10000);
  }, // execute
};

async function playNextInQueue(connection, player) {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const { resource, filePath } = queue.shift();
  player.play(resource);
  connection.subscribe(player);

  player.once(AudioPlayerStatus.Idle, () => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    playNextInQueue(connection, player);
  });
}

function extractUserName(userName) {
  return userName.replace(/\[.*?\]/g, '').trim();
}

function reduceRepeatedChars(text) {
  let replacedText = text.replace(/(ㅋㅋ|ㄴㄴ|ㄷㄷ|ㅇㅇ|ㅡㅡ|ㅠㅠ){3,}/g, (match) => match[0]);
  replacedText = replacedText.replace(/(ㅠㅜ|ㅜㅠ)+/g, '유유');
  return replacedText;
}