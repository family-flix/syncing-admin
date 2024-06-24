export type UserSettings = {
  site: {
    hostname: string;
    token: string;
  };
  paths: {
    file: string;
    torrent: string;
  };
  tokens: {
    mteam: string;
  };
};
