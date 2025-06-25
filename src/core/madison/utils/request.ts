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
  // baseURL: import.meta.env.BLOG_BASE_API, // url = base url + request url
  baseURL: 'http://223.193.36.216:8002/',
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
