const fs = require('fs-extra')
const jsonConfig = fs.existsSync('config.json')
  ? fs.readJSONSync('config.json')
  : {}
const envConfig = { ...process.env }
for (const envKey of Object.keys(envConfig)) {
  if (!envKey.startsWith('app_')) delete envConfig[envKey]
  else envConfig[envConfig] = envConfig[envConfig].slice(4)
}

module.exports = {
  ...jsonConfig,
  ...envConfig,
}
