import { For, createSignal } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { ListCore } from "@/domains/list";
import { ListCoreV2 } from "@/domains/list/v2";

export function List<T>(props: {
  store: ListCore<any, T> | ListCoreV2<any, T>;
  renderItem: (v: T, index: number) => JSX.Element;
}) {
  const { store, renderItem } = props;

  const [dataSource, setDataSOurce] = createSignal(store.response.dataSource);

  store.onStateChange((nextResponse) => {
    setDataSOurce(nextResponse.dataSource);
  });

  return (
    <For each={dataSource()}>
      {(item, index) => {
        return renderItem(item, index());
      }}
    </For>
  );
}
