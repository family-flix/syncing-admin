/**
 * @file 路由配置
 */
const configure = {
  root: {
    title: "ROOT",
    pathname: "/",
    children: {
      home_layout: {
        title: "首页布局",
        pathname: "/home",
        children: {
          index: {
            title: "首页",
            pathname: "/home/index",
            children: {},
          },
          torrent: {
            title: "种子搜索",
            pathname: "/home/torrent",
            children: {},
          },
          settings: {
            title: "系统设置",
            pathname: "/settings",
            children: {},
          },
          // drive_list: {
          //   title: "云盘列表",
          //   pathname: "/home/drive",
          //   children: {},
          // },
          // drive_profile: {
          //   title: "云盘详情",
          //   pathname: "/home/drive_profile",
          //   children: {},
          // },
          task_list: {
            title: "日志",
            pathname: "/home/log",
            children: {},
          },
          task_profile: {
            title: "日志详情",
            pathname: "/home/log_profile",
            children: {},
          },
          // resource_sync: {
          //   title: "同步任务列表",
          //   pathname: "/home/resource_sync",
          //   children: {},
          // },
          // transfer: {
          //   title: "文件转存",
          //   pathname: "/home/transfer",
          //   children: {},
          // },
        },
      },
      login: {
        title: "管理员登录",
        pathname: "/login",
        children: {},
      },
      register: {
        title: "管理员注册",
        pathname: "/register",
        children: {},
      },
      notfound: {
        title: "404",
        pathname: "/notfound",
        children: {},
      },
    },
  },
};

function apply(
  configure: OriginalRouteConfigure,
  parent: {
    pathname: PathnameKey;
    name: string;
  }
): RouteConfig[] {
  const routes = Object.keys(configure).map((key) => {
    const config = configure[key];
    const { title, pathname, children } = config;
    // 一个 hack 操作，过滤掉 root
    const name = [parent.name, key].filter(Boolean).join(".") as PageKeys;
    if (children) {
      const subRoutes = apply(children, {
        name,
        pathname,
      });
      return [
        {
          title,
          name,
          pathname,
          // component,
          parent: {
            name: parent.name,
          },
        },
        ...subRoutes,
      ];
    }
    return [
      {
        title,
        name,
        pathname,
        // component,
        parent: {
          name: parent.name,
        },
      },
    ];
  });
  return routes.reduce((a, b) => {
    return a.concat(b);
  }, []);
}
type PageKeysType<T extends OriginalRouteConfigure, K = keyof T> = K extends keyof T & (string | number)
  ? `${K}` | (T[K] extends object ? `${K}.${PageKeysType<T[K]["children"]>}` : never)
  : never;
const configs = apply(configure, {
  name: "",
  pathname: "/",
});
export const routes: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.name]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});
export const routesWithPathname: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.pathname]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});
export type PathnameKey = string;
export type PageKeys = PageKeysType<typeof configure>;
export type RouteConfig = {
  /** 使用该值定位唯一 route/page */
  name: PageKeys;
  title: string;
  pathname: PathnameKey;
  parent: {
    name: string;
  };
};
type OriginalRouteConfigure = Record<
  PathnameKey,
  {
    title: string;
    pathname: string;
    children: OriginalRouteConfigure;
  }
>;
