const path = require('node:path')
const { once } = require('node:events')
const { createRequire } = require('node:module')
const serverRequire = createRequire(path.resolve(__dirname, '../../server/package.json'))

module.exports = async () => {
  serverRequire('dotenv').config({
    path: path.resolve(__dirname, '../../server/.env'),
    quiet: true,
  })
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'fatal'
  process.env.RATE_LIMIT_MAX = '10000'
  process.env.CORS_ORIGIN = 'http://127.0.0.1:5175'
  process.env.JWT_SECRET = 'client-browser-tests-only'
  process.env.JWT_EXPIRES_IN = '900'
  const { createApplicationTestDatabase } = serverRequire(
    './tests/helpers/application-database.cjs',
  )
  const fixture = await createApplicationTestDatabase(process.env.DATABASE_URL)
  let server
  try {
    global.__prisma = fixture.db
    const { app } = serverRequire('./dist/src/app.js')
    server = app.listen(4010, '127.0.0.1')
    await once(server, 'listening')
  } catch (error) {
    await fixture.cleanup()
    throw error
  }
  return async () => {
    try {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      )
    } finally {
      await fixture.cleanup()
    }
    console.log('Client browser test schema removed.')
  }
}
