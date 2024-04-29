import { JSXElement } from "solid-js";

import { ViewComponent } from "@/store/types";
import { HomeLayout } from "@/pages/home/layout";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { TaskListPage } from "@/pages/task";
import { TaskProfilePage } from "@/pages/task/profile";
import { NotFoundPage } from "@/pages/notfound";
import { HomeIndexPage } from "@/pages/home";
import { UserSettingsManagePage } from "@/pages/home/settings";
import { TorrentSearchPage } from "@/pages/torrent";

import { PageKeys } from "./routes";

export const pages: Omit<Record<PageKeys, ViewComponent>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.index": HomeIndexPage,
  "root.home_layout.settings": UserSettingsManagePage,
  "root.home_layout.torrent": TorrentSearchPage,
  // "root.home_layout.drive_list": DriveListPage,
  // "root.home_layout.drive_profile": DriveProfilePage,
  // "root.home_layout.resource_sync": SyncTaskListPage,
  "root.home_layout.task_list": TaskListPage,
  "root.home_layout.task_profile": TaskProfilePage,
  // "root.home_layout.transfer": SharedFilesTransferPage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.notfound": NotFoundPage,
};
