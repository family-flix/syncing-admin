import { media_request } from "@/biz/requests";
import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp } from "@/domains/request/utils";
import { ListResponse, RequestedResource } from "@/types/index";
import { Result } from "@/domains/result/index";
import { bytes_to_size } from "@/utils/index";

export function searchTorrentInMTeam(values: FetchParams & { keyword: string }) {
  const { page, pageSize, keyword } = values;
  return media_request.post<
    ListResponse<{
      id: string;
      createdDate: string;
      lastModifiedDate: string;
      name: string;
      smallDescr: string;
      imdb: string;
      imdbRating: string;
      douban: string;
      doubanRating: string;
      dmmCode: null;
      downloadStatus: null | {
        completed: boolean;
      };
      author: null;
      category: string;
      source: string;
      medium: string;
      standard: string;
      videoCodec: string;
      audioCodec: string;
      team: string;
      processing: string;
      numfiles: string;
      size: string;
      tags: string;
      labels: string;
      msUp: number;
      anonymous: boolean;
      infoHash: null;
      status: {
        id: string;
        createdDate: string;
        lastModifiedDate: string;
        pickType: string;
        toppingLevel: number;
        toppingEndTime: string;
        discount: string;
        discountEndTime: string;
        timesCompleted: string;
        comments: string;
        lastAction: string;
        views: string;
        hits: string;
        support: number;
        oppose: number;
        status: string;
        seeders: string;
        leechers: string;
        banned: boolean;
        visible: boolean;
      };
      editedBy: null;
      editDate: null;
      collection: boolean;
      inRss: boolean;
      canVote: boolean;
      imageList: string[];
      resetBox: null;
    }>
  >("/api/torrent/search", {
    page,
    page_size: pageSize,
    keyword,
    site: "mteam",
  });
}

export function searchTorrentInMTeamProcess(r: TmpRequestResp<typeof searchTorrentInMTeam>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((item) => {
      const { id, smallDescr, name, size, downloadStatus, processing, createdDate, status } = item;
      return {
        id,
        title: smallDescr,
        text: name,
        size: bytes_to_size(Number(size)),
        processing: Number(processing),
        has_downloaded: (() => {
          if (!downloadStatus) {
            return false;
          }
          if (downloadStatus.completed) {
            return true;
          }
          return false;
        })(),
        discount_status: status.discount,
        created_at: createdDate,
      };
    }),
  });
}

export type MTeamMediaItem = RequestedResource<typeof searchTorrentInMTeamProcess>["list"][number];

export function downloadMTeamMedia(values: { id: string }) {
  const { id } = values;
  return media_request.post<void>("/api/torrent/download", {
    id,
    site: "mteam",
  });
}


export function noticeNasUploadFile(values: { file_id: string }) {
  const { file_id } = values;
  return media_request.post<{ task_id: string }>("/api/download/callback", {
    f: file_id,
  });
}


