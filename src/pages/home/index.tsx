/**
 * @file 首页
 */
import { createSignal, For, onMount, Show } from "solid-js";
import { Send, FileSearch, RefreshCcw, AlertTriangle, Loader, Bird, ChevronRight } from "lucide-solid";

import { ViewComponent } from "@/store/types";

import {
  Button,
  Dialog,
  ScrollView,
  Textarea,
  Checkbox,
  Input,
  LazyImage,
  ListView,
  Skeleton,
  DropdownMenu,
} from "@/components/ui";
import { ButtonCore, DialogCore, DropdownMenuCore, InputCore, MenuItemCore, ScrollViewCore } from "@/domains/ui/index";
import { ImageInListCore } from "@/domains/ui/image";
import { RequestCore } from "@/domains/request";
import { DriveTypes, FileType, ReportTypes } from "@/constants";
import { AliyunDriveFile, DriveFilesCore } from "@/domains/drive";
import { BizError } from "@/domains/error";
import { List } from "@/components/List";
import { RequestCoreV2 } from "@/domains/request/v2";
import { request } from "@/domains/request/utils";
import { createJob } from "@/store/job";
import { RefCore } from "@/domains/cur";

function noticeNasUploadFile(values: { file_id: string }) {
  const { file_id } = values;
  return request.post<{ task_id: string }>("/api/download/callback", {
    f: file_id,
  });
}

export const HomeIndexPage: ViewComponent = (props) => {
  const { app, history, view, client } = props;

  const syncRequest = new RequestCoreV2({
    fetch: noticeNasUploadFile,
    client,
  });
  const curFileWithPosition = new RefCore<[AliyunDriveFile, [number, number]]>();
  const curFile = new RefCore<AliyunDriveFile>();
  const filesRef = new RefCore<{ name: string }[]>();
  const driveFileManage = new DriveFilesCore({ id: "", client });
  const analysisItem = new MenuItemCore({
    label: "同步至云盘",
    async onClick() {
      if (!driveFileManage.virtualSelectedFolder) {
        app.tip({
          text: ["请先选择要索引的文件"],
        });
        return;
      }
      const [file] = driveFileManage.virtualSelectedFolder;
      analysisItem.disable();
      const r = await syncRequest.run({ file_id: file.file_id });
      driveFileManage.clearVirtualSelected();
      analysisItem.enable();
      if (r.error) {
        app.tip({
          text: ["索引失败", r.error.message],
        });
        return;
      }
      fileMenu.hide();
      createJob({
        job_id: r.data.task_id,
        onFinish() {
          app.tip({
            text: ["索引完成"],
          });
        },
      });
    },
  });
  const fileMenu = new DropdownMenuCore({
    side: "right",
    align: "start",
    items: [analysisItem],
    onHidden() {
      driveFileManage.clearVirtualSelected();
    },
  });

  const [folderColumns, setFolderColumns] = createSignal(driveFileManage.folderColumns);
  const [hasError, setHasError] = createSignal<BizError | null>(null);
  const [filesState, setFilesState] = createSignal(driveFileManage.state);
  const [selectedFile, setSelectedFile] = createSignal(curFile.value);

  curFile.onStateChange((v) => {
    setSelectedFile(v);
  });
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

  onMount(() => {
    (async () => {
      const r = await app.$user.fetchProfile();
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      driveFileManage.appendColumn({
        file_id: r.data.settings.paths.file,
        name: "文件",
      });
    })();
  });

  return (
    <>
      <div class="relative h-screen p-8 whitespace-nowrap">
        <div class="absolute left-8 right-8 top-8 bottom-8 overflow-x-auto">
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
                              const { file_id, name, type, selected, hover } = folder;
                              return (
                                <div
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    curFile.select(folder);
                                    driveFileManage.virtualSelect(folder, [0, index]);
                                    const { x, y } = event;
                                    fileMenu.toggle({
                                      x,
                                      y,
                                    });
                                  }}
                                >
                                  <div
                                    class="flex items-center justify-between p-2 cursor-pointer rounded-sm hover:bg-slate-300"
                                    // classList={{
                                    //   "bg-slate-200": selected,
                                    // }}
                                    classList={{
                                      "bg-slate-200": file_id === selectedFile()?.file_id,
                                      "outline outline-2 outline-slate-800": hover,
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
      </div>
      <DropdownMenu store={fileMenu}></DropdownMenu>
    </>
  );
};
