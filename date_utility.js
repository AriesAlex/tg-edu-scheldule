const config = require('./get_config')

function getTargetDate() {
  const date = new Date()
  const currentDay = date.getDate()
  date.setDate(
    date.getHours() >= config.nextDayHour ? currentDay + 1 : currentDay
  )
  return date
}

function getTargetWeekday() {
  const day = getTargetDate().toLocaleString('ru', { weekday: 'long' })
  return day.slice(0, 1).toUpperCase() + day.slice(1)
}

function addMinutes(time, minutes) {
  let [hours, minutes_, seconds] = time.split(':').map(Number)
  minutes_ += minutes
  hours += Math.floor(minutes_ / 60)
  minutes_ = minutes_ % 60
  hours = hours % 24
  let newTime = `${hours.toString().padStart(2, '0')}:${minutes_
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return newTime
}

function stringForMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const string = [
    hours == 0 ? null : `${hours} часов`,
    minutes == 0 ? null : `${minutes} минут`,
  ]
    .filter(n => n != null)
    .join(' ')
  return string == '' ? 'совсем немного' : string
}

module.exports = {
  getTargetDate,
  getTargetWeekday,
  addMinutes,
  stringForMinutes,
}
