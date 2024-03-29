import { Database as DB } from "@/typesdatabase.type";
import Compensatorios from './(dashboard)/(routes)/compensatorios/page';

type Users = DB["public"]["Tables"]["users"]["Row"];
type Compensatorys = DB["public"]["Tables"]["compensatorys"]["Row"];
export type VacationsEntity = Database["public"]["Tables"]["vacations"]["Row"];

declare global {
  type Database = DB;
  type CompensatorioUsuario = Compensatorys & {
    author: User;
  };
}