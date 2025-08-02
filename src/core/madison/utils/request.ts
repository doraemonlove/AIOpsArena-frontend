import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios'
import { getToken } from './token'
import type { MadisonApiRes } from '../types'

function requestConfig(token: boolean = false) {
  return function (config: InternalAxiosRequestConfig) {
    if (token) {
      config.headers['Authorization'] = 'token ' + getToken()
    }
    return config
  }
}

function requestError(token: boolean = false) {
  return function (error: any) {
    return error
  }
}

function response() {
  return function (response: AxiosResponse) {
    return response
  }
}

function responseError() {
  return function (error: any) {
    // return Promise.reject({ msg: error.response.data.message, error })
    return error.response
  }
}

const config = {
  baseURL: import.meta.env.VITE_BASE_URL, // url = base url + request url
  // baseURL: 'http://223.193.36.216:8002/',
  headers: {
    'Cache-Control': import.meta.env.BLOG_NO_CACHE === 'true' ? 'no-cache' : null
  }
}

// create an axios instance
//
const serviceNoToken_ = axios.create(config)

serviceNoToken_.interceptors.request.use(requestConfig(), requestError())

serviceNoToken_.interceptors.response.use(response(), responseError())

export function serviceNoToken<T>(config: AxiosRequestConfig) {
  return serviceNoToken_<MadisonApiRes<T>>(config)
}

const service_ = axios.create(config)

service_.interceptors.request.use(requestConfig(true), requestError(true))

service_.interceptors.response.use(response(), responseError())

export function service<T>(config: AxiosRequestConfig) {
  return service_<MadisonApiRes<T>>(config)
}

export function createLoopQuery<P extends {}, V>(
  params: P,
  loopQueryFunc: (params: P) => Promise<AxiosResponse<MadisonApiRes<V>, any>>,
  loopFinCheck: (data: MadisonApiRes<V>) => boolean,
  loopFinCallback: (data: MadisonApiRes<V>) => void,
  loopErrorCallback: () => void,
  loopStopCallback: () => void,
  interval: number = 2000
): {
  stop: () => void
} {
  let stoped = false
  let timer: NodeJS.Timeout | null = null
  /**
   * 轮询停止方法
   */
  const stop = () => {
    stoped = true
    if (timer !== null) clearTimeout(timer)
    loopStopCallback()
  }

  const func = async () => {
    try {
      const res = await loopQueryFunc(params)
      if (stoped) return
      const data = res !== undefined ? res.data : res
      const check = loopFinCheck(data)
      if (check) {
        loopFinCallback(data)
      } else {
        timer = setTimeout(func, interval)
      }
    } catch (_) {
      loopErrorCallback()
    }
  }

  func()

  return {
    stop
  }
}
