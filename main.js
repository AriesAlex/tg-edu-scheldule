const { ref, computed, watch } = require('vue')
const getLessons = require('./get_lessons')
const { getTargetWeekday, stringForMinutes } = require('./date_utility')
const { broadcastLessons, newUserEvent } = require('./get_bot')
const express = require('express')

const lessons = ref([])
const loading = ref(true)
const error = ref(null)
const lessonsTimeMessage = ref('')

const server = express()
server.get('/', (req, res) =>
  res.send(
    lessonsTimeMessage.value +
      '<br><br>===<br><br>' +
      JSON.stringify(lessons.value, 0, 2)
  )
)
//server.listen('8080')

const targetWeekday = ref(getTargetWeekday())
const lessonsAsMessage = computed(() => {
  if (error.value) return '<b>Ошибка</b>\n\n ' + error.value
  if (loading.value) return 'Загрузка..'
  if (lessons.value.length == 0) return 'На сегодня нет уроков'
  return (
    `<b>${targetWeekday.value}</b>` +
    lessons.value
      .map(lesson => {
        let base = `${lesson.num}. ${lesson.time} ${lesson.name}`
        if (lesson.teacher) base += `\n    Учитель: ${lesson.teacher}`
        if (lesson.room) base += `\n    Кабинет: ${lesson.room}`
        return '\n\n' + (lesson.passed ? `<s>${base}</s>` : base)
      })
      .join('') +
    `\n\n${lessonsTimeMessage.value}`
  )
})

function getLessonsTimeMessage() {
  const now = new Date()
  const currentLesson = lessons.value.find(
    lesson => now >= lesson.startDate && now <= lesson.endDate
  )
  if (currentLesson) {
    const minutesUntilEnd = Math.round(
      (currentLesson.endDate - now) / 1000 / 60
    )
    return `${stringForMinutes(minutesUntilEnd)} до окончания ${
      currentLesson.num
    }-го урока`
  }
  const nextLesson = lessons.value.find(lesson => now < lesson.startDate)
  if (!nextLesson) return 'Все уроки окончены'
  const minutesUntilStart = Math.round((nextLesson.startDate - now) / 1000 / 60)
  return `${stringForMinutes(minutesUntilStart)} до начала ${
    nextLesson.num
  }-го урока`
}
async function updateLessons() {
  console.log('fetching for', getTargetWeekday())
  try {
    lessons.value = await getLessons()
    updateLessonsInfo()
    loading.value = false
    error.value = null
  } catch (e) {
    error.value = JSON.stringify(e, 0, 2)
    console.log('fetching error: ', e)
    setTimeout(updateLessons, 1000 * 60 * 15)
  }
}
function updateLessonsInfo() {
  targetWeekday.value = getTargetWeekday()
  lessonsTimeMessage.value = getLessonsTimeMessage()
  for (lesson of lessons.value) {
    lesson.passed = lesson.endDate < new Date()
  }
}
setInterval(updateLessonsInfo, 1000 * 30)

watch(targetWeekday, updateLessons, { immediate: true })
watch(lessonsAsMessage, broadcastLessons, { immediate: true })

newUserEvent.on(() => broadcastLessons(lessonsAsMessage.value))
