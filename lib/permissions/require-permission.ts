import { getD1 } from "@/lib/db";
import { Permission, Role, roleAllows } from "./roles";
export async function userAllows(userId:string,role:Role,permission:Permission){if(role==="global_admin")return true;const db=await getD1();const custom=await db.prepare("SELECT allowed FROM worker_permissions WHERE user_id=? AND permission=?").bind(userId,permission).first<{allowed:number}>();return custom?custom.allowed===1:roleAllows(role,permission)}
