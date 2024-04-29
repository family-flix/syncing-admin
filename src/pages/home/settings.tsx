import { createSignal, onMount } from "solid-js";
import { Show, For } from "solid-js";
import { ChevronRight, Loader } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { Button, Input, ScrollView, Skeleton, Textarea } from "@/components/ui/index";
import { Dialog, ListView } from "@/components/ui/index";
import { List } from "@/components/List";
import { ButtonCore, DialogCore, InputCore, ScrollViewCore } from "@/domains/ui/index";
import { DriveFilesCore } from "@/domains/drive";
import { BizError } from "@/domains/error";
import { FileType } from "@/constants/index";
import { RefCore } from "@/domains/cur";

export const UserSettingsManagePage: ViewComponent = (props) => {
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
  const $cur = new RefCore<number>({});
  const $submit = new ButtonCore({
    async onClick() {
      const { hostname, token, file, torrent } = {
        hostname: $hostnameInput.value,
        token: $tokenInput.value,
        file: $fileDirInput.value,
        torrent: $torrentDirInput.value,
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
      const r = await app.$user.updateSettings({
        site: {
          hostname,
          token,
        },
        paths: {
          file,
          torrent,
        },
      });
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
  const driveFileManage = new DriveFilesCore({ id: "", client });

  const [folderColumns, setFolderColumns] = createSignal(driveFileManage.folderColumns);
  const [hasError, setHasError] = createSignal<BizError | null>(null);
  const [filesState, setFilesState] = createSignal(driveFileManage.state);

  driveFileManage.onFolderColumnChange((nextColumns) => {
    console.log("[COMPONENT]onFolderColumnChange", nextColumns);
    setFolderColumns(nextColumns);
  });
  driveFileManage.onError((e) => {
    setHasError(e);
  });
  driveFileManage.onStateChange((nextState) => {
    setFilesState(nextState);
  });

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">任务列表</h1>
        <div class="mt-8 space-y-4">
          <div>
            <div class="text-xl">Media Site</div>
            <div class="mt-2 space-y-2">
              <div class="">
                <div>域名</div>
                <Input store={$hostnameInput} />
              </div>
              <div class="">
                <div>token</div>
                <Textarea store={$tokenInput} />
              </div>
            </div>
          </div>
          <div>
            <div class="text-xl">文件路径</div>
            <div class="mt-2 space-y-2">
              <div class="">
                <div>视频文件</div>
                <Input store={$fileDirInput} />
                <div
                  onClick={() => {
                    if (!driveFileManage.initialized) {
                      driveFileManage.appendColumn({
                        file_id: "root",
                        name: "文件",
                      });
                    }
                    $cur.select(1);
                    foldersModal.show();
                  }}
                >
                  选择文件夹
                </div>
              </div>
              <div class="">
                <div>种子</div>
                <Input store={$torrentDirInput} />
                <div
                  onClick={() => {
                    if (!driveFileManage.initialized) {
                      driveFileManage.appendColumn({
                        file_id: "root",
                        name: "文件",
                      });
                    }
                    $cur.select(2);
                    foldersModal.show();
                  }}
                >
                  选择文件夹
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-8">
          <Button store={$submit}>保存</Button>
        </div>
      </ScrollView>
      <Dialog title="选择文件夹" store={foldersModal}>
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
                                      driveFileManage.select(folder, [columnIndex(), index]);
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
