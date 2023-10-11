import { type Database } from "./database.type";

export type UsersEntity = Database["public"]["Tables"]["users"]["Row"];
//compensatorys
export type CompensatorysEntity = Database["public"]["Tables"]["compensatorys"]["Row"];