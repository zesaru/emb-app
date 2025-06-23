import { type Database } from "./database.type";

export type UsersEntity = Database["public"]["Tables"]["users"]["Row"];
export type CompensatorysEntity = Database["public"]["Tables"]["compensatorys"]["Row"];
export type VacationsEntity = Database["public"]["Tables"]["vacations"]["Row"];
export type AttendancesEntity = Database["public"]["Tables"]["attendances"]["Row"];

export interface CompensatorysWithUser extends CompensatorysEntity {
  users: UsersEntity[];
}

export interface VacationsWithUser extends VacationsEntity {
  users: UsersEntity[];
}

export interface AttendancesWithUser extends AttendancesEntity {
  users: UsersEntity[];
  t_time_start: string | null;
  t_time_finish: string | null;
}
