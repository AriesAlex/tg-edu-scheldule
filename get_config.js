const fs = require('fs-extra')
const jsonConfig = fs.existsSync('config.json')
  ? fs.readJSONSync('config.json')
  : {}
const envConfig = { ...process.env }
for (const envKey of Object.keys(envConfig)) {
  if (envKey.startsWith('app_')) envConfig[envKey.slice(4)] = envConfig[envKey]
  delete envConfig[envKey]
}

module.exports = {
  ...jsonConfig,
  ...envConfig,
}
