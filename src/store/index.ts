/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作，以及全局状态或变量的声明
 */
import { UserCore } from "@/biz/user/index";
import { media_request } from "@/biz/requests";
import { ListCore } from "@/domains/list/index";
import { Application } from "@/domains/app/index";
import { NavigatorCore } from "@/domains/navigator/index";
import { BizError } from "@/domains/error/index";
import { RouteViewCore } from "@/domains/route_view/index";
import { HistoryCore } from "@/domains/history/index";
import { onRequestCreated } from "@/domains/request/index";
import { RouteConfig } from "@/domains/route_view/utils";
import { ImageCore } from "@/domains/ui/index";
import { Result } from "@/domains/result/index";
import { connect as connectApplication } from "@/domains/app/connect.web";
import { connect as connectHistory } from "@/domains/history/connect.web";

import { PageKeys, routes, routesWithPathname } from "./routes";
import { client } from "./request";
import { storage } from "./storage";

onRequestCreated((ins) => {
  ins.onFailed((e) => {
    console.log("[STORE]onRequestCreated in ins.onFailed", e);
    app.tip({
      text: [e.message],
    });
    if (e.code === 900) {
      history.push("root.login");
    }
  });
  if (!ins.client) {
    ins.client = client;
  }
});

ImageCore.setPrefix(window.location.origin);
class ExtendsUser extends UserCore {
  say() {
    console.log(`My name is ${this.nickname}`);
  }
}
const user = new ExtendsUser(storage.get("user"), client);
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
view.isRoot = true;
export const history = new HistoryCore<PageKeys, RouteConfig<PageKeys>>({
  view,
  router,
  routes,
  views: {
    root: view,
  } as Record<PageKeys, RouteViewCore>,
});
export const app = new Application({
  storage,
  user,
  async beforeReady() {
    const { pathname, query } = history.$router;
    let route = routesWithPathname[pathname || "/"];
    if (route === undefined || route.parent === null) {
      route = routes["root.home_layout.index"];
    }
    client.appendHeaders({
      Authorization: user.token,
    });
    media_request.appendHeaders({
      Authorization: user.token,
    });
    console.log("[ROOT]onMount", pathname, route, app.$user.isLogin);
    if (!route) {
      history.push("root.notfound");
      return Result.Err("not found");
    }
    if (!route.options?.require?.includes("login")) {
      if (!history.isLayout(route.name)) {
        // 页面无需登录且非 layout
        history.push(route.name, query, { ignore: true });
        return Result.Ok(null);
      }
      return Result.Ok(null);
    }
    // await app.$user.fetchProfile();
    if (!user.isLogin) {
      app.tip({
        text: ["请先登录"],
      });
      history.push("root.login", { redirect: route.pathname });
      return Result.Err("need login");
    }
    if (!history.isLayout(route.name)) {
      history.push(route.name, query, { ignore: true });
      return Result.Ok(null);
    }
    history.push("root.home_layout.index", {}, { ignore: true });
    return Result.Ok(null);
  },
});
connectApplication(app);
connectHistory(history);
history.onClickLink(({ href, target }) => {
  const { pathname, query } = NavigatorCore.parse(href);
  const route = routesWithPathname[pathname];
  // console.log("[ROOT]history.onClickLink", pathname, query, route);
  if (!route) {
    app.tip({
      text: ["没有匹配的页面"],
    });
    return;
  }
  if (target === "_blank") {
    const u = history.buildURLWithPrefix(route.name, query);
    window.open(u);
    return;
  }
  history.push(route.name, query);
  return;
});
history.onRouteChange(({ reason, view, href, ignore }) => {
  // console.log("[ROOT]rootView.onRouteChange", href, history.$router.href);
  const { title } = view;
  app.setTitle(title);
  if (ignore) {
    return;
  }
  if (app.env.ios) {
    return;
  }
  if (reason === "push") {
    history.$router.pushState(href);
  }
  if (reason === "replace") {
    history.$router.replaceState(href);
  }
});
user.onTip((msg) => {
  console.log("[STORE]user.onTip(msg", msg);
  app.tip(msg);
});
user.onLogin((profile) => {
  storage.set("user", profile);
  client.appendHeaders({
    Authorization: user.token,
  });
  media_request.appendHeaders({
    Authorization: user.token,
  });
  history.push("root.home_layout.index");
});
user.onLogout(() => {
  storage.clear("user");
  media_request.deleteHeaders("Authorization");
  history.push("root.login");
});
user.onExpired(() => {
  storage.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  history.push("root.login");
});

ListCore.commonProcessor = <T>(
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
