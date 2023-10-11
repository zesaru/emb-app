import { type Database } from "./database.type";

export type UsersEntity = Database["public"]["Tables"]["users"]["Row"];
export type CompensatorysEntity = Database["public"]["Tables"]["compensatorys"]["Row"];
export interface CompensatorysWithUser extends CompensatorysEntity
{ users:UsersEntity[] };