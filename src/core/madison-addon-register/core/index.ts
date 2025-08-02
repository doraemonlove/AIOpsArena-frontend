import type { RegisterOptions, SendEmailOptions } from '../types'
import { register, sendEmail } from './api'
import { messageUseI18n } from '@/core/madison/utils'
import { MadisonAddon } from '@/core/madison/core/addon-base'

export enum SendEmailState {
  READY,
  SENDING,
  SENDED
}

export class Register extends MadisonAddon {
  private timer: NodeJS.Timeout | null = null
  private state: SendEmailState = SendEmailState.READY
  private waitTime: number = 1000 * 60

  logoutCallback(): void {}

  async register(options: RegisterOptions, autoLogin: boolean = true): Promise<boolean> {
    const res = await register(options)
    const data = res.data
    if (data.code === 0) {
      this.messageI18n('Visitor.Register.Success')
    } else {
      if (data.message === 'User.register.EmailAlreadyRegistered') {
        this.messageI18n('Visitor.Register.EmailExisted')
      } else if (data.message === 'User.register.UsernameAlreadyRegistered') {
        this.messageI18n('Visitor.Register.UsernameExisted')
      } else if (data.message === 'User.register.InvalidVerificationCode') {
        this.messageI18n('Visitor.CodeError')
      } else {
        this.messageI18n('Visitor.Register.Failure')
      }
    }
    /** 是否执行自动登录 */
    if (data.code === 0 && autoLogin) {
      return await this.__madison.login.login({
        type: 'username',
        key: options.username,
        password: options.password
      })
    }
    return data.code === 0
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (this.state !== SendEmailState.READY) return false
    this.timer = setTimeout(() => {
      this.state = SendEmailState.READY
    }, this.waitTime)
    this.state = SendEmailState.SENDING
    const res = await sendEmail(options)
    const data = res.data
    if (data.code !== 0) {
      this.state = SendEmailState.READY
      this.messageI18n('Visitor.CodeFailure')
    } else {
      this.state = SendEmailState.SENDED
      this.messageI18n('Visitor.CodeSuccess')
    }

    return data.code === 0
  }
}
