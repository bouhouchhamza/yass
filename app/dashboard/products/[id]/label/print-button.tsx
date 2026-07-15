"use client";
import { Printer } from "lucide-react";
export function PrintButton(){return <button onClick={()=>window.print()} className="btn btn-primary no-print"><Printer size={18}/> Imprimer</button>}
