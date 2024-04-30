/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
// import { has_admin } from "@/services";
import { ListCore } from "@/domains/list/index";
import { ListCoreV2 } from "@/domains/list/v2";
import { Application } from "@/domains/app/index";
import { NavigatorCore } from "@/domains/navigator/index";
import { BizError } from "@/domains/error/index";
import { RouteViewCore } from "@/domains/route_view/index";
import { HistoryCore } from "@/domains/history/index";
import { UserCore } from "@/domains/user/index";
import { Result } from "@/types/index";

import { PageKeys, RouteConfig, routes } from "./routes";
import { storage } from "./storage";

NavigatorCore.prefix = "";

const user = new UserCore(storage.get("user"));
const router = new NavigatorCore({
  location: window.location,
});
const view = new RouteViewCore({
  name: "root",
  pathname: "/",
  title: "ROOT",
  visible: true,
  parent: null,
});
export const history = new HistoryCore<PageKeys, RouteConfig>({
  view,
  router,
  routes,
  views: {
    root: view,
  } as Record<PageKeys, RouteViewCore>,
});
export const app = new Application({
  user,
  async beforeReady() {
    console.log("before ready");
    // const r = await user.validate();
    // if (r.error) {
    //   app.tip({
    //     text: [r.error.message],
    //   });
    //   history.push("root.login");
    //   return Result.Err(r.error.message);
    // }
    return Result.Ok(null);
  },
});
user.onTip((msg) => {
  app.tip(msg);
});
user.onLogin((profile) => {
  storage.set("user", profile);
  history.push("root.home_layout.index");
});
user.onLogout(() => {
  storage.clear("user");
});
user.onExpired(() => {
  storage.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  history.push("root.login");
});

ListCore.commonProcessor = ListCoreV2.commonProcessor = <T>(
  originalResponse: any
): {
  dataSource: T[];
  page: number;
  pageSize: number;
  total: number;
  empty: boolean;
  noMore: boolean;
  error: BizError | null;
} => {
  if (originalResponse === null) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: null,
    };
  }
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, page_size, total, noMore, no_more, next_marker } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      empty: false,
      noMore: false,
      error: null,
      next_marker,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
    }
    if (noMore !== undefined) {
      result.noMore = noMore;
    }
    if (next_marker === null) {
      result.noMore = true;
    }
    if (list.length === 0 && page === 1) {
      result.empty = true;
    }
    if (list.length === 0) {
      result.noMore = true;
    }
    return result;
  } catch (error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: new BizError(`${(error as Error).message}`),
      // next_marker: "",
    };
  }
};
