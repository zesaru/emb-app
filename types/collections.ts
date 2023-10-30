import { type Database } from "./database.type";

export type UsersEntity = Database["public"]["Tables"]["users"]["Row"];
export type CompensatorysEntity = Database["public"]["Tables"]["compensatorys"]["Row"];
export type VacationsEntity = Database["public"]["Tables"]["vacations"]["Row"];
export type AttendancesEntity = Database["public"]["Tables"]["attendances"]["Row"];

export interface CompensatorysWithUser extends CompensatorysEntity
{
user1: any; users:UsersEntity[] 
};
export interface VacationsWithUser extends VacationsEntity
{
user1: any; users:UsersEntity[] 
};

export interface AttendancesWithUser extends AttendancesEntity
{
  t_time_start: any;
  t_time_finish: any;
user1: any; users:UsersEntity[] 
};
