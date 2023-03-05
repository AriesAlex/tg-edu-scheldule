const config = require('./get_config')
const HttpsProxyAgent = require('https-proxy-agent')
const httpsAgent = new HttpsProxyAgent({
  host: config.proxyHost,
  port: config.proxyPort,
  auth: config.proxyAuth,
})

const axios = config.proxyHost
  ? require('axios').default.create({ httpsAgent })
  : require('axios')

const {
  getTargetDate,
  getTargetWeekday,
  addMinutes,
} = require('./date_utility')

async function fetchLessons() {
  const token = (
    await axios.post(
      'https://edu.gounn.ru/apiv3/auth?devkey=d9ca53f1e47e9d2b9493d35e2a5e36&out_format=json&auth_token&vendor=edu',
      {
        login: config.username,
        password: config.password,
      }
    )
  ).data.response.result.token

  const students = (
    await axios.get(
      `https://edu.gounn.ru/apiv3/getdiary?student=1985&rings=true&devkey=d9ca53f1e47e9d2b9493d35e2a5e36&out_format=json&auth_token=${token}&vendor=edu`
    )
  ).data.response.result.students
  const student = Object.values(students)[0]

  const day = Object.values(student.days).find(
    day => day.title == getTargetWeekday()
  )
  if (!day) return []
  const lessons = Object.values(day.items).sort(
    (item1, item2) => item1.sort - item2.sort
  )
  return lessons
}

module.exports = async function getLessons() {
  const lessons = await fetchLessons()
  for (const lesson of lessons) {
    if (Number(lesson.num) >= 6) {
      lesson.starttime = addMinutes(lesson.starttime, 5)
      lesson.endtime = addMinutes(lesson.endtime, 5)
    }
    const startTime = lesson.starttime
    const endTime = lesson.endtime
    lesson.time = `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}`

    lesson.startDate = new Date(getTargetDate())
    lesson.endDate = new Date(getTargetDate())

    lesson.startDate.setUTCHours(
      Number(startTime.split(':')[0]) - config.timezoneOffset
    )
    lesson.startDate.setMinutes(Number(startTime.split(':')[1]))
    lesson.startDate.setSeconds(0)

    lesson.endDate.setUTCHours(
      Number(endTime.split(':')[0]) - config.timezoneOffset
    )
    lesson.endDate.setMinutes(Number(endTime.split(':')[1]))
    lesson.endDate.setSeconds(0)
  }

  for (const lesson of lessons) {
    lesson.passed = lesson.endDate < new Date()
    if (!lesson.name) lesson.name = 'Неизвестный урок'
    lesson.name = lesson.name.replace(/[^\u0400-\u04FF\s]/g, '').trim()
    lesson.name = lesson.name.slice(0, 1).toUpperCase() + lesson.name.slice(1)
  }

  return lessons
}
