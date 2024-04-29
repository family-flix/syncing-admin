import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp, request } from "@/domains/request/utils";
import { FileType } from "@/constants/index";
import { Result, Unpacked, UnpackedResult } from "@/types/index";

/**
 * 获取指定云盘内文件夹列表
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 * @param {string} body.file_id 文件夹id（如果传入说明是获取指定文件夹下的文件列表
 * @param {string} body.next_marker 在获取文件列表时，如果是获取下一页，就需要传入该值
 * @param {string} body.name 传入该值时，使用该值进行搜索
 * @param {string} body.page_size 每页文件数量
 */
export function fetchDriveFiles(
  body: {
    /** 云盘id */
    drive_id: string;
    /** 文件夹id */
    file_id: string;
    next_marker: string;
    /** 按名称搜索时的关键字 */
    name?: string;
  } & FetchParams
) {
  const { drive_id, file_id, name, next_marker, page, pageSize = 24 } = body;
  return request.post<{
    items: {
      file_id: string;
      name: string;
      next_marker: string;
      parent_file_id: string;
      size: number;
      type: "folder" | "file";
      thumbnail: string;
    }[];
    next_marker: string;
  }>("/api/file/list", {
    drive_id,
    name,
    file_id,
    next_marker,
    page,
    page_size: pageSize,
  });
}
export function fetchDriveFilesProcess(r: TmpRequestResp<typeof fetchDriveFiles>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { items } = r.data;
  return Result.Ok({
    list: items.map((file) => {
      const { file_id, name, parent_file_id, size, type, thumbnail } = file;
      return {
        file_id,
        name,
        type: type === "file" ? FileType.File : FileType.Folder,
        size,
        parent_paths: [
          {
            file_id: parent_file_id,
            name: "",
          },
        ],
      };
    }),
    no_more: r.data.next_marker === null,
    next_marker: r.data.next_marker,
  });
}

export type DriveFile = UnpackedResult<Unpacked<ReturnType<typeof fetchDriveFilesProcess>>>["list"][number];
