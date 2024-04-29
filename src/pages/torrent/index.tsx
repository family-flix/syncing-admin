import { For, Show, createSignal } from "solid-js";

import { ViewComponent } from "@/store/types";
import {
  MTeamMediaItem,
  downloadMTeamMedia,
  searchTorrentInMTeam,
  searchTorrentInMTeamProcess,
} from "@/services/index";
import { Button, Input, ScrollView } from "@/components/ui";
import { ButtonCore, ButtonInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request/v2";

export const TorrentSearchPage: ViewComponent = (props) => {
  const { app, client } = props;

  const $input = new InputCore({
    defaultValue: "",
    onEnter() {
      $search.click();
    },
  });
  const $search = new ButtonCore({
    onClick() {
      const keyword = $input.value;
      if (!keyword) {
        app.tip({
          text: ["请输入查询关键字"],
        });
        return;
      }
      $list.search({
        keyword,
      });
    },
  });
  const $reset = new ButtonCore({
    onClick() {
      $list.reset();
    },
  });
  const $list = new ListCoreV2(
    new RequestCoreV2({
      client,
      fetch: searchTorrentInMTeam,
      process: searchTorrentInMTeamProcess,
      onLoading: (loading: boolean) => {
        $search.setLoading(loading);
      },
    })
  );
  const $download = new RequestCoreV2({
    fetch: downloadMTeamMedia,
    client,
  });
  const $downloadBtn = new ButtonInListCore<MTeamMediaItem>({
    async onClick(record) {
      $downloadBtn.setLoading(true);
      const r = await $download.run({ id: record.id });
      $downloadBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["下载成功"],
      });
    },
  });
  const scrollView = new ScrollViewCore();

  const [response, setResponse] = createSignal($list.response);

  $list.onStateChange((v) => {
    setResponse(v);
  });

  return (
    <ScrollView store={scrollView} class="h-screen p-8">
      <div class="text-2xl">种子搜索</div>
      <div class="mt-8 flex items-center mt-4 space-x-4">
        <Input store={$input} />
        <div class="flex items-center space-x-1">
          <Button store={$search}>搜索</Button>
          <Button store={$reset}>重置</Button>
        </div>
      </div>
      <div class="space-y-4">
        <For each={response().dataSource}>
          {(item) => {
            const { id, title, text, processing, has_downloaded } = item;
            return (
              <div class="p-2">
                <div class="text-xl">{title}</div>
                <div>{text}</div>
                <Show when={has_downloaded} fallback={<Button store={$downloadBtn.bind(item)}>下载</Button>}>
                  <div>已下载</div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </ScrollView>
  );
};
