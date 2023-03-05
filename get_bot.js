const TelegramBot = require('node-telegram-bot-api')
const config = require('./get_config')
const fs = require('fs-extra')
const { reactive, watch } = require('vue')

if (!fs.existsSync('users.json') || fs.readFileSync('users.json').length < 2)
  fs.writeFileSync('users.json', '[]')

class Event {
  listeners = []
  emit() {
    this.listeners.forEach(cb => cb())
  }
  on(cb) {
    this.listeners.push(cb)
  }
}
const newUserEvent = new Event()
const bot = new TelegramBot(config.tgToken, { polling: true })
bot.on('message', async msg => {
  if (msg.text != config.registerCode) return
  const chatId = msg.chat.id
  const users = reactive(require('./users.json'))
  watch(users, users =>
    fs.writeFileSync('users.json', JSON.stringify(users, 0, 2))
  )

  if (users.map(user => user.chatId).includes(chatId)) return
  const messageId = (await bot.sendMessage(chatId, 'Вы подписались на журнал'))
    .message_id
  const username = (await bot.getChat(chatId)).username
  users.push({ chatId, messageId, username })
  newUserEvent.emit()
})

async function broadcastLessons(message) {
  if (!message) return
  const users = reactive(require('./users.json'))
  watch(users, users =>
    fs.writeFileSync('users.json', JSON.stringify(users, 0, 2))
  )

  for (const user of users) {
    if (!user.messageId) {
      user.messageId = (
        await bot.sendMessage(user.chatId, message, {
          parse_mode: 'HTML',
        })
      ).message_id
      return
    }

    bot
      .editMessageText(message, {
        chat_id: user.chatId,
        message_id: user.messageId,
        parse_mode: 'HTML',
      })
      .catch(async e => {
        console.log('error while editing:', e.toString())

        if (
          e.toString().includes('exactly the same') ||
          e.toString().includes('ETIMEDOUT')
        )
          return

        console.log('erasing old and sendind new msg')
        user.messageId = (
          await bot.sendMessage(user.chatId, message, {
            parse_mode: 'HTML',
          })
        ).message_id
        eraseOldMessages(user)
      })
  }
}

eraseOldMessagesForAllUsers()
function eraseOldMessagesForAllUsers() {
  for (const user of require('./users.json')) eraseOldMessages(user)
}
function eraseOldMessages(user) {
  for (let id = user.messageId - 1; id >= 0; id--) {
    bot.deleteMessage(user.chatId, id).catch(() => {})
  }
}

module.exports = { bot, broadcastLessons, newUserEvent }
