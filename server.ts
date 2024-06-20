import app from './functions/api';
import * as Log from './functions/common/log';

Log.initialize({
  logger: console,
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
