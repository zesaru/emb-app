import { Database as DB } from "@/types/database.type";

type Users = DB["public"]["Tables"]["users"]["Row"];
type Compensatorys = DB["public"]["Tables"]["compensatorys"]["Row"];
type Vacations = DB["public"]["Tables"]["vacations"]["Row"];

declare global {
  type Database = DB;
  type CompensatorioUsuario = Compensatorys & {
    author: User;
  };
}