import { type Database } from "./database.type";

export type UsersEntity = Database["public"]["Tables"]["users"]["Row"];
type CompensatorysEntity = Database["public"]["Tables"]["compensatorys"]["Row"];
export type CompensatorysWithUser = CompensatorysEntity & { user:UsersEntity };