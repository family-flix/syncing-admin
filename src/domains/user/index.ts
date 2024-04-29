/**
 * 当前登录用户相关逻辑
 */
import { BaseDomain, Handler } from "@/domains/base";
import { RequestCoreV2 } from "@/domains/request/v2";
import { HttpClientCore } from "@/domains/http_client/index";
import { connect } from "@/domains/http_client/connect.axios";
import { Result } from "@/types/index";

import { fetchUserSettings, fetchUserProfile, login, register, validate, updateUserSettings } from "./services";
import { UserSettings } from "./types";

export enum Events {
  Tip,
  Error,
  Login,
  Logout,
  /** 身份凭证失效 */
  Expired,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: UserState & { token: string };
  [Events.Logout]: void;
  [Events.Expired]: void;
  [Events.StateChange]: UserState;
};

type UserProps = {
  id: string;
  nickname: string;
  avatar: string;
  token: string;
};
type UserState = UserProps & {
  // id: string;
  // username: string;
  // avatar: string;
  // token: string;
};

export class UserCore extends BaseDomain<TheTypesOfEvents> {
  name = "UserCore";
  debug = false;

  id: string = "";
  nickname: string = "Anonymous";
  avatar: string = "";
  token: string = "";
  isLogin: boolean = false;
  needRegister = false;

  $validateAPI: RequestCoreV2<{
    fetch: typeof validate;
    client: HttpClientCore;
  }>;
  $loginAPI: RequestCoreV2<{
    fetch: typeof login;
    client: HttpClientCore;
  }>;
  $registerAPI: RequestCoreV2<{
    fetch: typeof register;
    client: HttpClientCore;
  }>;
  $profileAPI: RequestCoreV2<{
    fetch: typeof fetchUserProfile;
    client: HttpClientCore;
  }>;
  $settingsAPI: RequestCoreV2<{
    fetch: typeof fetchUserSettings;
    client: HttpClientCore;
  }>;
  $settingsUpdateAPI: RequestCoreV2<{
    fetch: typeof updateUserSettings;
    client: HttpClientCore;
  }>;

  get state(): UserState {
    return {
      id: this.id,
      nickname: this.nickname,
      avatar: this.avatar,
      token: this.token,
    };
  }
  values: Partial<{ email: string; password: string }> = {};

  constructor(props: Partial<{ _name: string }> & UserProps) {
    super(props);

    // if (!props) {
    //   this.hasLogin === false;
    //   return;
    // }
    const { id, nickname: username, avatar, token } = props;
    console.log("[DOMAIN]user/index - initialize", props);
    this.id = id;
    this.nickname = username;
    this.avatar = avatar;
    this.isLogin = !!token;
    this.token = token;

    const _client = new HttpClientCore({
      headers: {
        Authorization: token,
      },
    });
    connect(_client);
    // @ts-ignore
    const client: HttpClientCore = {
      async setHeaders<T>(...args: Parameters<typeof _client.setHeaders>) {
        return _client.setHeaders(...args);
      },
      async appendHeaders<T>(...args: Parameters<typeof _client.appendHeaders>) {
        return _client.appendHeaders(...args);
      },
      async get<T>(...args: Parameters<typeof _client.get>) {
        const r = await _client.get<{ code: number; msg: string; data: T }>(...args);
        if (r.error) {
          return Result.Err(r.error.message);
        }
        const { code, msg, data } = r.data;
        if (code !== 0) {
          return Result.Err(msg, code, data);
        }
        return Result.Ok(data);
      },
      async post<T>(...args: Parameters<typeof _client.post>) {
        const r = await _client.post<{ code: number; msg: string; data: T }>(...args);
        if (r.error) {
          return Result.Err(r.error.message);
        }
        const { code, msg, data } = r.data;
        if (code !== 0) {
          return Result.Err(msg, code, data);
        }
        return Result.Ok(data);
      },
    };
    this.$validateAPI = new RequestCoreV2({
      fetch: validate,
      client,
    });
    this.$loginAPI = new RequestCoreV2({
      fetch: login,
      client,
    });
    this.$registerAPI = new RequestCoreV2({
      fetch: register,
      client,
    });
    this.$profileAPI = new RequestCoreV2({
      fetch: fetchUserProfile,
      client,
    });
    this.$settingsAPI = new RequestCoreV2({
      fetch: fetchUserSettings,
      client,
    });
    this.$settingsUpdateAPI = new RequestCoreV2({
      fetch: updateUserSettings,
      client,
    });
    this.onLogin(() => {
      client.appendHeaders({
        Authorization: this.token,
      });
    });
  }
  inputEmail(value: string) {
    this.values.email = value;
  }
  inputPassword(value: string) {
    this.values.password = value;
  }
  /** 校验用户凭证是否有效 */
  async validate() {
    if (!this.isLogin) {
      return Result.Err("未登录");
    }
    const r = await this.$validateAPI.run();
    if (r.error) {
      if (r.error.code === 900) {
        this.isLogin = false;
        this.emit(Events.Expired);
      }
      return Result.Err(r.error);
    }
    return Result.Ok(null);
  }
  /** 用户名密码登录 */
  async login() {
    const { email, password } = this.values;
    if (!email) {
      const msg = this.tip({ text: ["请输入邮箱"] });
      return Result.Err(msg);
    }
    if (!password) {
      const msg = this.tip({ text: ["请输入密码"] });
      return Result.Err(msg);
    }
    const r = await this.$loginAPI.run({ email, password });
    if (r.error) {
      this.tip({ text: ["登录失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.values = {};
    this.isLogin = true;
    const { id, username, avatar, token } = r.data;
    this.id = id;
    this.nickname = username;
    this.avatar = avatar;
    this.token = token;
    this.emit(Events.Login, { ...this.state, token: this.token });
    return Result.Ok(r.data);
  }
  /** 退出登录 */
  logout() {
    this.isLogin = false;
    this.emit(Events.Logout);
  }
  async register() {
    console.log("[DOMAIN]user/index - register", this.values);
    const { email, password } = this.values;
    if (!email) {
      const msg = this.tip({ text: ["请输入邮箱"] });
      return Result.Err(msg);
    }
    if (!password) {
      const msg = this.tip({ text: ["请输入密码"] });
      return Result.Err(msg);
    }
    const r = await this.$registerAPI.run({ email, password });
    console.log(r);
    if (r.error) {
      this.tip({ text: ["注册失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.values = {};
    this.isLogin = true;
    const { id, username, avatar, token } = r.data;
    this.id = id;
    this.nickname = username;
    this.avatar = avatar;
    this.token = token;
    this.needRegister = false;
    this.emit(Events.Login, { ...this.state, token: this.token });
    return Result.Ok(r.data);
  }
  async fetchProfile() {
    if (!this.isLogin) {
      return Result.Err("请先登录");
    }
    const r = await this.$profileAPI.run();
    if (r.error) {
      return r;
    }
    return Result.Ok(r.data);
  }
  async fetchSettings() {}
  async updateSettings(values: UserSettings) {
    const r = await this.$settingsUpdateAPI.run(values);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    return Result.Ok(null);
  }

  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
  onLogin(handler: Handler<TheTypesOfEvents[Events.Login]>) {
    return this.on(Events.Login, handler);
  }
  onLogout(handler: Handler<TheTypesOfEvents[Events.Logout]>) {
    return this.on(Events.Logout, handler);
  }
  onExpired(handler: Handler<TheTypesOfEvents[Events.Expired]>) {
    return this.on(Events.Expired, handler);
  }
}
