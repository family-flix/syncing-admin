/**
 * 当前登录用户相关逻辑
 */
import { BaseDomain, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request/index";
import { HttpClientCore } from "@/domains/http_client/index";
import { connect } from "@/domains/http_client/connect.axios";
import { Result } from "@/domains/result/index";

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

  $validateAPI: RequestCore<typeof validate>;
  $loginAPI: RequestCore<typeof login>;
  $registerAPI: RequestCore<typeof register>;
  $profileAPI: RequestCore<typeof fetchUserProfile>;
  $settingsAPI: RequestCore<typeof fetchUserSettings>;
  $settingsUpdateAPI: RequestCore<typeof updateUserSettings>;

  get state(): UserState {
    return {
      id: this.id,
      nickname: this.nickname,
      avatar: this.avatar,
      token: this.token,
    };
  }
  values: Partial<{ email: string; password: string }> = {};

  constructor(props: Partial<{ _name: string }> & UserProps, client: HttpClientCore) {
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

    this.$validateAPI = new RequestCore(validate, {
      client,
    });
    this.$loginAPI = new RequestCore(login, {
      client,
    });
    this.$registerAPI = new RequestCore(register, {
      client,
    });
    this.$profileAPI = new RequestCore(fetchUserProfile, {
      client,
    });
    this.$settingsAPI = new RequestCore(fetchUserSettings, {
      client,
    });
    this.$settingsUpdateAPI = new RequestCore(updateUserSettings, {
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
