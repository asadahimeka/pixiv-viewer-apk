import { fetch } from '@tauri-apps/plugin-http'
import buildURL from 'axios/lib/helpers/buildURL'
import buildFullPath from 'axios/lib/core/buildFullPath'
import { AxiosError } from 'axios'

const base64Encode = str => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)))

const buildBasicAuthorization = basicCredentials => {
  const username = basicCredentials.username || ''
  const password = basicCredentials.password ? encodeURIComponent(basicCredentials.password) : ''
  return {
    Authorization: `Basic ${base64Encode(`${username}:${password}`)}`,
  }
}

const buildJWTAuthorization = token => {
  return {
    Authorization: `Bearer ${token}`,
  }
}

const transform = (data, type) => {
  switch (type) {
    case 'arraybuffer': {
      return new Response(data).arrayBuffer()
    }
    case 'blob': {
      return new Response(data).blob()
    }
    case 'formdata': {
      return new Response(data).formData()
    }
    case 'json': {
      return new Response(data).json()
    }
    case 'text': {
      return new Response(data).text()
    }
    default: {
      throw new Error('Response type unsupported type: ' + type)
    }
  }
}

export default config => {
  return new Promise((resolve, reject) => {
    const requestUrl = buildURL(buildFullPath(config.baseURL, config.url), config.params, config.paramsSerializer)
    const requestConfig = {
      method: config.method,
      headers: {
        ...config.headers,
        ...(config.auth && buildBasicAuthorization(config.auth)),
        ...(config.jwt && buildJWTAuthorization(config.jwt)),
      },
      connectTimeout: config.timeout < 1000 ? undefined : config.timeout,
      maxRedirections: config.maxRedirects,
      body: config.data,
    }
    fetch(requestUrl, requestConfig)
      .then(response => {
        const statusText = response.statusText
        const responseType = config.responseType || 'json'
        if (response.ok) {
          if (response.body !== null) {
            transform(response.body, responseType).then(body => {
              return resolve({
                data: body,
                status: response.status,
                statusText,
                headers: {
                  ...response.headers,
                },
                config,
              })
            }).catch(reason => {
              return reject(
                new AxiosError(reason, AxiosError.ERR_BAD_RESPONSE, config, {
                  url: requestUrl,
                  ...requestConfig,
                })
              )
            })
          } else {
            return resolve({
              data: response.body,
              status: response.status,
              statusText,
              headers: {
                ...response.headers,
              },
              config,
            })
          }
        } else {
          if (response.body !== null) {
            transform(response.body, responseType).then(body => {
              return reject(
                new AxiosError(
                  'Request failed with status code ' + response.status,
                  [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
                  config,
                  {
                    url: requestUrl,
                    ...requestConfig,
                  },
                  {
                    config,
                    data: body,
                    headers: response.headers,
                    status: response.status,
                    statusText,
                  }
                )
              )
            }).catch(reason => {
              return reject(
                new AxiosError(reason, AxiosError.ERR_BAD_RESPONSE, config, {
                  url: requestUrl,
                  ...requestConfig,
                })
              )
            })
          } else {
            return reject(
              new AxiosError(
                'Request failed with status code ' + response.status,
                [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
                config,
                {
                  url: requestUrl,
                  ...requestConfig,
                },
                {
                  config,
                  data: response.body,
                  headers: response.headers,
                  status: response.status,
                  statusText,
                }
              )
            )
          }
        }
      })
      .catch(reason => {
        return reject(new AxiosError(reason, AxiosError.ERR_BAD_REQUEST, config))
      })
  })
}
