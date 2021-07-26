# express-proxy

```js
const { createProxyController } = require('express-proxy');

const proxy = createProxyController({
  baseURL: 'http://test.com/test',
  headers: (req) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${req.locals.token}`,
  })
});

router.get('/toasts/:id', proxy('/v1/toasts/:id')) // http://test.com/v1/toasts/:id
router.get('/v1/roasts', proxy()); // http://test.com/v1/roasts
```
