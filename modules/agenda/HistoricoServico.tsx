"use client";

import { EventoHistorico } from "./types";

type Props = {
  historico: EventoHistorico[];
};

function formatarDataHora(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString("pt-BR");
}

export default function HistoricoServico({ historico }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-lg font-black uppercase text-yellow-400">
        Histórico da Ordem de Serviço
      </h3>

      <div className="mt-4 space-y-3">
        {historico.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
            Nenhum evento registrado.
          </p>
        ) : (
          [...historico].reverse().map((evento) => (
            <div key={evento.id} className="rounded-xl border border-zinc-800 bg-black px-4 py-3">
              <p className="font-bold text-zinc-200">{evento.descricao}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatarDataHora(evento.dataHora)} · {evento.usuario}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
