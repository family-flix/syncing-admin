import { request } from "@/domains/request/utils";

import { UserSettings } from "./types";

/**
 * 用户登录
 * @param body
 * @returns
 */
export function login(body: { email: string; password: string }) {
  return request.post<{
    id: string;
    username: string;
    // name: string;
    // email: string;
    avatar: string;
    verified: string;
    // created: string;
    token: string;
  }>("/api/user/login", body);
}

/**
 * 用户登录
 * @param body
 * @returns
 */
export function register(body: { email: string; password: string }) {
  return request.post<{
    id: string;
    username: string;
    // name: string;
    // email: string;
    avatar: string;
    verified: string;
    // created: string;
    token: string;
  }>("/api/user/register", body);
}

export function logout(body: { email: string; password: string }) {
  return request.post("/api/user/logout", body);
}

export function get_token() {
  return request.post("/api/token", {});
}

/**
 * 获取当前登录用户信息详情
 * @returns
 */
export function fetchUserProfile() {
  return request.post<{
    nickname: string;
    settings: UserSettings;
  }>("/api/user/profile");
}

/**
 * 成员通过授权链接访问首页时，验证该链接是否有效
 */
export function validate() {
  return request.post<{ ok: number }>("/api/admin/user/validate");
}

/**
 * 获取用户配置
 */
export function fetchUserSettings() {
  return request.post<UserSettings>("/api/user/fetch_settings");
}
/**
 * 更新用户配置
 */
export function updateUserSettings(values: Partial<UserSettings>) {
  const { site, paths, tokens } = values;
  return request.post("/api/user/update_settings", {
    site,
    paths,
    tokens,
  });
}
