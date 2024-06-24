import { UserCore } from "@/biz/user";

import { storage } from "./storage";

export const user = new UserCore(storage.get("user"));
