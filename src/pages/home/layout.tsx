/**
 * @file 页面布局
 */
import { For, JSX, createSignal, onMount } from "solid-js";
import { Home, Bot, LogOut, Settings, AlarmClock, Settings2, Spade, Sparkle } from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { onJobsChange } from "@/store/job";
import { PageKeys } from "@/store/routes";
import { Show } from "@/packages/ui/show";
import { Button, Dialog, DropdownMenu, Input, KeepAliveRouteView, Textarea } from "@/components/ui";
import { ButtonCore, DialogCore, DropdownMenuCore, InputCore, MenuCore, MenuItemCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { Application } from "@/domains/app";
import { HistoryCore } from "@/domains/history";
import { cn, sleep } from "@/utils/index";

export const HomeLayout: ViewComponent = (props) => {
  const { app, history, client, storage, pages, view } = props;

  //   const settingsRequest = new RequestCore(fetchSettings, {
  //     onLoading(loading) {
  //       settingsBtn.setLoading(loading);
  //     },
  //     onSuccess(v) {
  //       const { push_deer_token = "", extra_filename_rules = "", ignore_files_when_sync = "" } = v;
  //       notify1TokenInput.setValue(push_deer_token);
  //       filenameParseRuleInput.setValue(extra_filename_rules);
  //       ignoreFilesRuleInput.setValue(ignore_files_when_sync);
  //     },
  //     onFailed(error) {
  //       app.tip({
  //         text: ["获取设置失败", error.message],
  //       });
  //     },
  //   });
  //   const expiredDeletingRequest = new RequestCore(fetchSettings, {
  //     onLoading(loading) {
  //       expiredDeletingBtn.setLoading(loading);
  //     },
  //     onSuccess(v) {
  //       app.tip({
  //         text: ["清除成功"],
  //       });
  //     },
  //     onFailed(error) {
  //       app.tip({
  //         text: ["获取设置失败", error.message],
  //       });
  //     },
  //   });
  //   const settingsUpdateRequest = new RequestCore(updateSettings, {
  //     onLoading(loading) {
  //       settingsDialog.okBtn.setLoading(loading);
  //     },
  //     onSuccess() {
  //       app.tip({
  //         text: ["更新成功"],
  //       });
  //     },
  //     onFailed(error) {
  //       app.tip({
  //         text: ["更新失败", error.message],
  //       });
  //     },
  //   });
  const logoutBtn = new ButtonCore({
    async onClick() {
      logoutBtn.setLoading(true);
      app.$user.logout();
      await sleep(2000);
      logoutBtn.setLoading(false);
    },
  });
  const settingsDialog = new DialogCore({
    title: "配置",
    onOk() {},
  });
  const filenameParseRuleInput = new InputCore({
    defaultValue: "",
    placeholder: "额外解析规则",
  });
  const ignoreFilesRuleInput = new InputCore({
    defaultValue: "",
    placeholder: "转存时可忽略指定文件/文件夹",
  });
  const notify1TokenInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入 push deer token",
  });
  const notify1TestInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入文本测试消息推送",
  });
  const settingsBtn = new ButtonCore({
    onClick() {
      //       settingsRequest.run();
      settingsDialog.show();
    },
  });
  const expiredDeletingBtn = new ButtonCore({});

  const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  view.onCurViewChange((nextCurView) => {
    setCurSubView(nextCurView);
  });

  const [menus, setMenus] = createSignal([
    {
      text: "首页",
      icon: <Home class="w-6 h-6" />,
      url: "root.home_layout.index" as PageKeys,
    },
    {
      text: "种子搜索",
      icon: <Sparkle class="w-6 h-6" />,
      url: "root.home_layout.torrent" as PageKeys,
    },
    {
      text: "同步任务",
      icon: <AlarmClock class="w-6 h-6" />,
      url: "root.home_layout.resource_sync" as PageKeys,
    },
    {
      text: "任务",
      icon: <Bot class="w-6 h-6" />,
      badge: false,
      url: "root.home_layout.task_list" as PageKeys,
    },
    {
      text: "设置",
      icon: <Settings2 class="w-6 h-6" />,
      url: "root.home_layout.settings" as PageKeys,
    },
  ]);

  const [curRouteName, setCurRouteName] = createSignal(history.$router.name);

  // onMount(() => {
  // console.log("[PAGE]home/layout onMount", history.$router.href);
  // });
  history.onRouteChange(({ name }) => {
    setCurRouteName(name);
  });
  onJobsChange((jobs) => {
    setMenus(
      menus().map((menu) => {
        const { url } = menu;
        // if (url === "root.home_layout.job_list") {
        //   return {
        //     ...menu,
        //     badge: jobs.length !== 0,
        //   };
        // }
        return menu;
      })
    );
  });

  return (
    <>
      <div class="flex w-full h-full bg-white">
        <div class="w-[248px] py-4 pl-2 pr-2 border border-r-slate-300">
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex-1 space-y-1 p-2 w-full h-full overflow-y-auto rounded-xl self-start">
              <For each={menus()}>
                {(menu) => {
                  const { icon, text, url, badge } = menu;
                  return (
                    <Menu
                      app={app}
                      icon={icon}
                      history={history}
                      highlight={(() => {
                        return curRouteName() === url;
                      })()}
                      url={url}
                      badge={badge}
                    >
                      {text}
                    </Menu>
                  );
                }}
              </For>
            </div>
            {/* <div class="flex justify-center space-x-2 h-[68rpx] py-2">
              <Button class="" store={logoutBtn} variant="subtle" icon={<LogOut class="w-4 h-4" />}>
                退出登录
              </Button>
              <Button class="" store={settingsBtn} variant="subtle" icon={<Settings class="w-4 h-4" />}>
                设置
              </Button>
            </div> */}
          </div>
        </div>
        <div class="flex-1 bg-slate-100">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const routeName = subView.name;
                const PageContent = pages[routeName as Exclude<PageKeys, "root">];
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute inset-0",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <PageContent
                      app={app}
                      client={client}
                      storage={storage}
                      pages={pages}
                      history={history}
                      view={subView}
                    />
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </>
  );
};

function Menu(
  props: {
    app: Application;
    history: ViewComponentProps["history"];
    highlight?: boolean;
    url?: PageKeys;
    icon: JSX.Element;
    badge?: boolean;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const inner = (
    <div
      class={cn(
        "relative flex items-center px-4 py-2 space-x-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-300",
        props.highlight ? "bg-slate-200" : ""
      )}
      onClick={props.onClick}
    >
      <div class="w-6 h-6">{props.icon}</div>
      <div class="flex-1 text-lg text-slate-800">
        <div class="relative inline-block">
          {props.children}
          <Show when={props.badge}>
            <div class="absolute right-[-8px] top-0 w-2 h-2 rounded-full bg-red-500" />
          </Show>
        </div>
      </div>
    </div>
  );
  return (
    <Show when={props.url} fallback={inner}>
      <div
        onClick={() => {
          if (!props.url) {
            return;
          }
          props.history.push(props.url);
          // props.app.showView(props.view);
        }}
      >
        {inner}
      </div>
    </Show>
  );
}
