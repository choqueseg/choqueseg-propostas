"use client";

import { Servico } from "./types";

type CardServicoProps = {
  servico: Servico;
  ehAdministrador: boolean;
  aoAbrir: (servico: Servico) => void;
  aoExcluir: (servicoId: string) => void;
  aoAlterarStatus: (
    servicoId: string,
    novoStatus: Servico["status"],
  ) => void;
  aoAbrirMaps: (endereco: string, cidade: string) => void;
};

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

export default function CardServico({
  servico,
  ehAdministrador,
  aoAbrir,
  aoExcluir,
  aoAlterarStatus,
  aoAbrirMaps,
}: CardServicoProps) {
  const checklistTotal = servico.checklist?.length ?? 0;
  const checklistConcluido =
    servico.checklist?.filter((item) => item.concluido).length ?? 0;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black uppercase">
              {servico.clienteNome}
            </h3>
            <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-300">
              {servico.status}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-zinc-400">
            <p>📅 {formatarData(servico.data)} às {servico.horario}</p>
            <p>🛠 {servico.tipoServico || "Serviço não informado"}</p>
            <p>👷 {servico.equipe}</p>
            <p>📍 {servico.endereco}, {servico.cidade}</p>
            {servico.descricao && <p>📝 {servico.descricao}</p>}
            {checklistTotal > 0 && (
              <p>✅ Checklist: {checklistConcluido}/{checklistTotal}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aoAbrir(servico)}
            className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
          >
            Abrir serviço
          </button>

          <button
            type="button"
            onClick={() => aoAbrirMaps(servico.endereco, servico.cidade)}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black uppercase text-black"
          >
            Abrir no Maps
          </button>

          {ehAdministrador && (
            <select
              value={servico.status}
              onChange={(evento) =>
                aoAlterarStatus(
                  servico.id,
                  evento.target.value as Servico["status"],
                )
              }
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-bold text-white"
            >
              <option>Agendado</option>
              <option>Em execução</option>
              <option>Concluído</option>
            </select>
          )}

          {ehAdministrador && (
            <button
              type="button"
              onClick={() => aoExcluir(servico.id)}
              className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-black uppercase text-red-400"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
