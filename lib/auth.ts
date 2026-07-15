import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { schema } from "@/lib/db/schema";
import { Permission, Role } from "@/lib/permissions/roles";
import { userAllows } from "@/lib/permissions/require-permission";

export async function getAuth(){const context=await getCloudflareContext({async:true});const env=context.env as CloudflareEnv&{BETTER_AUTH_SECRET:string};return betterAuth({database:drizzleAdapter(drizzle(env.DB),{provider:"sqlite",schema}),secret:env.BETTER_AUTH_SECRET,baseURL:env.BETTER_AUTH_URL,emailAndPassword:{enabled:true,disableSignUp:true},user:{additionalFields:{role:{type:"string",required:false,defaultValue:"cashier",input:false},active:{type:"boolean",required:false,defaultValue:true,input:false}}}})}
export async function requireUser(){const auth=await getAuth();const current=await auth.api.getSession({headers:await headers()});if(!current)redirect("/login");const role=(current.user.role??"cashier") as Role;if(current.user.active===false)redirect("/login?error=Compte désactivé");return {user:current.user,session:current.session,role};}
const legacy:Record<string,Permission>={dashboard:"dashboard.view",employees:"workers.view",products:"products.edit",stock:"stock.adjust",suppliers:"suppliers.edit",purchases:"purchases.create",expenses:"expenses.create",reports:"reports.sales",audit:"audit.view",pos:"pos.use",register:"register.open",customers:"customers.create",credit:"customers.credit.payment"};
export async function requirePermission(permission:Permission|string){const context=await requireUser();const normalized=(legacy[permission]??permission) as Permission;if(!await userAllows(context.user.id,context.role,normalized))throw new Error("Accès non autorisé");return context;}
