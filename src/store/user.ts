import { UserCore } from "@/biz/user";

import { storage } from "./storage";
import { client } from "./request";

export const user = new UserCore(storage.get("user"), client);
