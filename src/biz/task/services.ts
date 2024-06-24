import dayjs from "dayjs";

import { media_request } from "@/biz/requests/index";
import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp } from "@/domains/request/utils";
import { ListResponse, RequestedResource } from "@/types";
import { Result } from "@/domains/result/index";

import { TaskStatus, TaskTypes } from "./constants";

/**
 * 获取当前用户所有异步任务
 */
export function fetchJobList(params: FetchParams) {
  return media_request.post<
    ListResponse<{
      id: string;
      unique_id: string;
      type: TaskTypes;
      status: TaskStatus;
      desc: string;
      output_id: string;
      error?: string;
      created: string;
    }>
  >("/api/task/list", params);
}
export type JobItem = RequestedResource<typeof fetchJobListProcess>["list"][0];
export function fetchJobListProcess(res: TmpRequestResp<typeof fetchJobList>) {
  if (res.error) {
    return Result.Err(res.error);
  }
  const result = {
    ...res.data,
    list: res.data.list.map((task) => {
      const { created, output_id, status, ...rest } = task;
      return {
        ...rest,
        output_id,
        status,
        statusText: (() => {
          if (status === TaskStatus.Running) {
            return "运行中";
          }
          if (status === TaskStatus.Paused) {
            return "已终止";
          }
          if (status === TaskStatus.Finished) {
            return "已完成";
          }
          return "未知";
        })(),
        created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
        // created: relative_time_from_now(created),
      };
    }),
  };
  return Result.Ok(result);
}

/**
 * 查询索引任务详情
 */
export function fetchTaskProfile(id: string) {
  return media_request.post<{
    id: string;
    desc: string;
    type: TaskTypes;
    status: TaskStatus;
    lines: string[];
    // more_line: boolean;
    created: string;
    content: string;
  }>("/api/task/profile", { id: Number(id) });
}
export function fetchTaskProfileProcess(r: TmpRequestResp<typeof fetchTaskProfile>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, desc, status, type, lines, created } = r.data;
  const data = {
    id,
    desc,
    status,
    type,
    statusText: (() => {
      if (status === TaskStatus.Running) {
        return "运行中";
      }
      if (status === TaskStatus.Paused) {
        return "已终止";
      }
      if (status === TaskStatus.Finished) {
        return "已完成";
      }
      return "未知";
    })(),
    content: lines
      .map((l) => {
        try {
          const r = JSON.parse(l);
          return r;
        } catch (err) {
          console.log(l);
        }
        return null;
      })
      .filter(Boolean),
    hasMoreContent: false,
    created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
  };
  return Result.Ok(data);
}
export type JobProfile = RequestedResource<typeof fetchTaskProfileProcess>;

/** 获取指定异步任务的日志列表 */
export function fetchOutputLinesOfJob(body: { job_id: string; page: number; pageSize: number }) {
  const { job_id, page, pageSize } = body;
  return media_request.post<
    ListResponse<{
      id: string;
      content: string;
      created: string;
    }>
  >(`/api/admin/job/${job_id}/logs`, {
    page,
    page_size: pageSize,
  });
}
export function fetchOutputLinesOfJobProcess(r: TmpRequestResp<typeof fetchOutputLinesOfJob>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { no_more, total, list } = r.data;
  return Result.Ok({
    page: r.data.page,
    page_size: r.data.page_size,
    noMore: no_more,
    total,
    list: list.map((log) => {
      const { content, created } = log;
      return {
        ...JSON.parse(content),
        // created: dayjs(created).format("YYYY/MM/DD HH:mm:ss.SSS"),
      };
    }),
  });
}

/**
 * 查询索引任务状态
 */
export function fetchTaskStatus(id: string) {
  return media_request.post<{ id: string; desc: string; type: TaskTypes; status: TaskStatus; error?: string }>(
    "/api/task/status",
    { id: Number(id) }
  );
}
// export type JobItem = RequestedResource<typeof fetch_job_status>;

/**
 * 中止指定任务
 * @param id
 * @returns
 */
export function pauseTask(id: string) {
  return media_request.post<{ id: string }>("/api/task/pause", {
    id: Number(id),
    force: "1",
  });
}
