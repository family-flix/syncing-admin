import { PageKeysType, build } from "@/domains/route_view/utils";
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
            options: {
              require: ["login"],
            },
          },
          torrent: {
            title: "种子搜索",
            pathname: "/home/torrent",
            options: {
              require: ["login"],
            },
          },
          settings: {
            title: "系统设置",
            pathname: "/settings",
            options: {
              require: ["login"],
            },
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
            options: {
              require: ["login"],
            },
          },
          task_profile: {
            title: "日志详情",
            pathname: "/home/log_profile",
            options: {
              require: ["login"],
            },
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
        options: {
          require: ["login"],
        },
      },
      login: {
        title: "管理员登录",
        pathname: "/login",
      },
      register: {
        title: "管理员注册",
        pathname: "/register",
      },
      notfound: {
        title: "404",
        pathname: "/notfound",
      },
    },
  },
};

export type PageKeys = PageKeysType<typeof configure>;
const result = build<PageKeys>(configure);
export const routes = result.routes;
console.log("[]routes", routes);
export const routesWithPathname = result.routesWithPathname;
