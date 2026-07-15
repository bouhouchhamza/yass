"use client";
export function PrintReceipt(){return <button className="btn btn-primary no-print" onClick={()=>window.print()}>Imprimer le reçu</button>}
