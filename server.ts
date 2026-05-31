import app from './functions/api.js'
import * as Log from './functions/common/log.js'

Log.initialize({
  logger: console,
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
