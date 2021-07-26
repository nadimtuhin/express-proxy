const axios = require('axios');
const invariant = require('invariant');
const querystring = require('querystring');
const { isFunction } = require('lodash');

const urlJoin = require('./urlJoin');

// https://github.com/Abazhenov/express-async-handler/blob/master/index.js
function asyncWrapper(controller) {
  return (...args) => {
    const fnReturn = controller(...args);
    const next = args[args.length - 1];

    return Promise.resolve(fnReturn).catch(next);
  };
}

async function axiosProxyRequest({ url, headers={}, method='GET', data }) {
  invariant(url, 'url is required for axiosProxyRequest');

  try {
    const options = {
      url,
      method,
      headers,
    };

    if (data) {
      options['data'] = data;
    }

    console.log(options);

    const response = await axios(options);

    return response;
  } catch (error) {
    throw error;
  }
}

function replaceUrlTemplate(url, urlVariables) {
  const placeholders = Object.keys(urlVariables);
  placeholders.forEach(placeholder => {
    const pattern = new RegExp(`:${placeholder}`);
    url = url.replace(pattern, urlVariables[placeholder]);
  });

  return url;
}

exports.createProxyController = function createProxyController(config) {
  // if handler=true return response returned from axiosProxyRequest
  // if handler=Function pass response
  return function proxyController(proxyPath, handler) {
    return asyncWrapper(async (req, res) => {
      let qs = querystring.stringify(req.query);
      if (qs) qs = `?${qs}`;
      let modifiedProxyPath = '';

      if (proxyPath) {
        modifiedProxyPath = replaceUrlTemplate(proxyPath, req.params);
      } else {
        modifiedProxyPath = req.path;
      }

      const payload = {
        url: urlJoin(config.baseURL, modifiedProxyPath, qs),
        headers: config.headers(req),
        method: req.method,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) { // req.method is always uppercase
        payload['data'] = JSON.stringify(req.body);
      }

      const remoteResponse = await axiosProxyRequest(payload);

      if (!handler) {
        return res.json(remoteResponse.data).status(remoteResponse.status);
      } else if (isFunction(handler)) {
        return handler(req, res, remoteResponse);
      } else {
        return remoteResponse;
      }
    });
  }
}

// const proxy = createProxyController({
//   baseURL: 'http://test.com/test',
//   headers: (req) => ({
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${req.locals.token}`,
//   })
// });

// router.get('/test', proxy('/roast')) // http://test.com/test/roast
