import { createSignal, onMount } from "solid-js";
import { Show, For } from "solid-js";
import { ChevronRight, Loader } from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Button, Input, ScrollView, Skeleton, Textarea } from "@/components/ui/index";
import { Dialog, ListView } from "@/components/ui/index";
import { List } from "@/components/List";
import { ButtonCore, DialogCore, InputCore, ScrollViewCore } from "@/domains/ui/index";
import { DriveFilesCore } from "@/domains/drive";
import { RefCore } from "@/domains/cur";
import { RequestCoreV2 } from "@/domains/request/v2";
import { BizError } from "@/domains/error";
import { FileType } from "@/constants/index";
import { fetchUserSettings } from "@/domains/user/services";

function UserSettingsManagePageLogic(props: ViewComponentProps & { $ui: ReturnType<typeof UserSettingsManagePageUI> }) {
  const { app, client, $ui } = props;

  const $profile = new RequestCoreV2({ fetch: fetchUserSettings, client });

  return {
    async ready() {
      const r = await $profile.run();
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      const { site, paths, tokens } = r.data;
      $ui.$hostnameInput.setValue(site.hostname ?? "");
      $ui.$tokenInput.setValue(site.token ?? "");
      $ui.$torrentDirInput.setValue(paths.torrent ?? "");
      $ui.$fileDirInput.setValue(paths.file ?? "");
      $ui.$mteamTokenInput.setValue(tokens.mteam ?? "");
    },
  };
}
function UserSettingsManagePageUI(props: ViewComponentProps) {
  const { app, client } = props;
  const $hostnameInput = new InputCore({
    defaultValue: "",
  });
  const $tokenInput = new InputCore({
    defaultValue: "",
  });
  const $fileDirInput = new InputCore({
    defaultValue: "",
  });
  const $torrentDirInput = new InputCore({
    defaultValue: "",
  });
  const $mteamTokenInput = new InputCore({
    defaultValue: "",
  });
  const $cur = new RefCore<number>({});
  const $submit = new ButtonCore({
    async onClick() {
      const { hostname, token, file, torrent, mteam_token } = {
        hostname: $hostnameInput.value,
        token: $tokenInput.value,
        file: $fileDirInput.value,
        torrent: $torrentDirInput.value,
        mteam_token: $mteamTokenInput.value,
      };
      const tip = (() => {
        if (!hostname) {
          return "请输入 hostname";
        }
        if (!token) {
          return "请输入 token";
        }
        if (!file) {
          return "请输入 file";
        }
        if (!torrent) {
          return "请输入 torrent";
        }
        return null;
      })();
      if (tip) {
        app.tip({
          text: [tip],
        });
        return;
      }
      $submit.setLoading(true);
      const r = await app.$user.updateSettings({
        site: {
          hostname,
          token,
        },
        paths: {
          file,
          torrent,
        },
        tokens: {
          mteam: mteam_token,
        },
      });
      $submit.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["更新成功"],
      });
    },
  });
  const scrollView = new ScrollViewCore({});
  const driveFileManage = new DriveFilesCore({ id: "", client });
  const foldersModal = new DialogCore({
    onOk() {
      const curFolder = driveFileManage.state.curFolder;
      if (!curFolder) {
        app.tip({
          text: ["请选择文件夹"],
        });
        return;
      }
      console.log(curFolder);
      if ($cur.value === 1) {
        $fileDirInput.setValue(curFolder.file_id);
      }
      if ($cur.value === 2) {
        $torrentDirInput.setValue(curFolder.file_id);
      }
      foldersModal.hide();
    },
  });

  return {
    scrollView,
    driveFileManage,
    $hostnameInput,
    $tokenInput,
    $fileDirInput,
    $torrentDirInput,
    $mteamTokenInput,
    $cur,
    $submit,
    foldersModal,
  };
}

export const UserSettingsManagePage: ViewComponent = (props) => {
  const { app, client } = props;

  const $ui = UserSettingsManagePageUI(props);
  const $page = UserSettingsManagePageLogic({ ...props, $ui });

  const [folderColumns, setFolderColumns] = createSignal($ui.driveFileManage.folderColumns);
  const [hasError, setHasError] = createSignal<BizError | null>(null);
  const [filesState, setFilesState] = createSignal($ui.driveFileManage.state);

  $ui.driveFileManage.onFolderColumnChange((v) => setFolderColumns(v));
  $ui.driveFileManage.onError((e) => setHasError(e));
  $ui.driveFileManage.onStateChange((v) => setFilesState(v));

  onMount(() => {
    $page.ready();
  });

  return (
    <>
      <ScrollView store={$ui.scrollView} class="h-screen p-8">
        <h1 class="text-2xl">用户设置</h1>
        <div class="mt-8 space-y-4">
          <div>
            <div class="text-xl">Media Site</div>
            <div class="mt-2 space-y-2">
              <div class="">
                <div>域名</div>
                <Input store={$ui.$hostnameInput} />
              </div>
              <div class="">
                <div>token</div>
                <Textarea store={$ui.$tokenInput} />
              </div>
            </div>
          </div>
          <div>
            <div class="text-xl">文件路径</div>
            <div class="mt-2 space-y-2">
              <div class="">
                <div>视频文件</div>
                <Input store={$ui.$fileDirInput} />
                <div
                  onClick={() => {
                    if (!$ui.driveFileManage.initialized) {
                      $ui.driveFileManage.appendColumn({
                        file_id: "root",
                        name: "文件",
                      });
                    }
                    $ui.$cur.select(1);
                    $ui.foldersModal.show();
                  }}
                >
                  选择文件夹
                </div>
              </div>
              <div class="">
                <div>种子</div>
                <Input store={$ui.$torrentDirInput} />
                <div
                  onClick={() => {
                    if (!$ui.driveFileManage.initialized) {
                      $ui.driveFileManage.appendColumn({
                        file_id: "root",
                        name: "文件",
                      });
                    }
                    $ui.$cur.select(2);
                    $ui.foldersModal.show();
                  }}
                >
                  选择文件夹
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="my-8 h-[1px] bg-black" style="opacity: 0.4;" />
            <div class="text-xl">PT 站授权凭证</div>
            <div class="mt-2 space-y-2">
              <div class="">
                <div>MTeam</div>
                <Input store={$ui.$mteamTokenInput} />
              </div>
            </div>
          </div>
        </div>
        <div class="mt-8">
          <Button store={$ui.$submit}>保存</Button>
        </div>
      </ScrollView>
      <Dialog title="选择文件夹" store={$ui.foldersModal}>
        <div class="w-[520px] overflow-x-auto h-[320px]">
          <Show
            when={filesState().initialized}
            fallback={
              <div class="position h-full">
                <div class="flex items-center justify-center space-x-2 text-slate-800">
                  <Loader class="w-6 h-6 animate-spin" />
                  <div>加载中</div>
                </div>
              </div>
            }
          >
            <div class="flex-1 flex space-x-2 max-w-full max-h-full overflow-x-auto bg-white">
              <For each={folderColumns()}>
                {(column, columnIndex) => {
                  return (
                    <ScrollView
                      store={column.view}
                      class="flex-shrink-0 px-2 pt-2 pb-12 border-r-2 overflow-x-hidden w-[240px] max-h-full overflow-y-auto"
                    >
                      <ListView
                        store={column.list}
                        skeleton={
                          <div>
                            <div class="space-y-2">
                              <Skeleton class="w-12 h-[24px]" />
                              <Skeleton class="w-full h-[24px]" />
                              <Skeleton class="w-4 h-[24px]" />
                            </div>
                          </div>
                        }
                      >
                        <div>
                          <List
                            store={column.list}
                            renderItem={(folder, index) => {
                              // @ts-ignore
                              const { file_id, name, type, selected } = folder;
                              return (
                                <div>
                                  <div
                                    class="flex items-center justify-between p-2 cursor-pointer rounded-sm hover:bg-slate-300"
                                    classList={{
                                      "bg-slate-200": selected,
                                    }}
                                    onClick={() => {
                                      $ui.driveFileManage.select(folder, [columnIndex(), index]);
                                    }}
                                  >
                                    <div class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">{name}</div>
                                    <Show when={type === FileType.Folder}>
                                      <ChevronRight class="ml-2 w-4 h-4" />
                                    </Show>
                                  </div>
                                </div>
                              );
                            }}
                          />
                        </div>
                      </ListView>
                    </ScrollView>
                  );
                }}
              </For>
              <div class="flex-shrink-0 px-2 pb-12 border-r-2 overflow-x-hidden min-w-[240px] max-h-full overflow-y-auto"></div>
            </div>
          </Show>
        </div>
      </Dialog>
    </>
  );
};
