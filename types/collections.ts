import { type Database } from "./database.type";

export type UsersEntity = Database["public"]["Tables"]["users"]["Row"];
export type CompensatorysEntity = Database["public"]["Tables"]["compensatorys"]["Row"];
export type VacationsEntity = Database["public"]["Tables"]["vacations"]["Row"];

export interface CompensatorysWithUser extends CompensatorysEntity
{
user1: any; users:UsersEntity[] 
};
export interface VacationsWithUser extends VacationsEntity
{
user1: any; users:UsersEntity[] 
};
