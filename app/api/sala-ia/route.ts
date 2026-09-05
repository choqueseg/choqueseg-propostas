import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      mensagem: "Sala IA temporariamente desativada.",
    },
    { status: 503 },
  );
}