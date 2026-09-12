import { useState } from "react";
import { Servico } from "./types";

type CardServicoProps = {
  servico: Servico;

  // Props usadas pela versão atual da Agenda
  usuarioNome?: string;
  ehAdministrador: boolean;
  podeVerContatoCliente?: boolean;
  aoFechar?: () => void;
  aoSalvar?: (atualizado: Servico) => Promise<string | boolean> | string | boolean;

  // Ações
  aoCancelar?: (servicoId: string) => Promise<boolean> | boolean | void;
  aoExcluir: (servicoId: string) => Promise<void> | void;
  aoAbrirMaps: (endereco: string, cidade?: string) => void;

  // Compatibilidade com versões anteriores do Card
  aoAbrir?: (servico: Servico) => void;
  aoAlterarStatus?: (
    servicoId: string,
    novoStatus: Servico["status"],
  ) => Promise<void> | void;
};

function formatarData(data: string) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

export default function CardServico({
  servico,
  ehAdministrador,
  aoFechar,
  aoSalvar,
  aoCancelar,
  aoExcluir,
  aoAbrirMaps,
  aoAbrir,
  aoAlterarStatus,
}: CardServicoProps) {
  const [expandido, setExpandido] = useState(false);

  const checklistTotal = servico.checklist?.length ?? 0;
  const checklistConcluido =
    servico.checklist?.filter((item) => item.concluido).length ?? 0;

  const faixaHorario = servico.horarioFim
    ? `${servico.horario} às ${servico.horarioFim}`
    : servico.horario;

  async function abrirServico() {
    if (aoAbrir) {
      aoAbrir(servico);
      return;
    }

    // Se a Agenda atual trabalha com modal/controlador externo,
    // mantém compatibilidade sem forçar comportamento inexistente.
    if (aoFechar) {
      // Não fechamos nada aqui; a prop fica apenas aceita pelo componente.
    }
  }

  async function alterarStatus(novoStatus: Servico["status"]) {
    if (aoAlterarStatus) {
      await aoAlterarStatus(servico.id, novoStatus);
      return;
    }

    if (aoSalvar) {
      await aoSalvar({ ...servico, status: novoStatus });
    }
  }

  return (
    <article className="rounded-2xl border border-zinc-800 bg-black transition hover:border-zinc-700">
      <button
        type="button"
        onClick={() => setExpandido((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={expandido}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="shrink-0 text-sm font-black text-yellow-400">
              {faixaHorario || "Horário não informado"}
            </p>

            <span className="text-zinc-600">•</span>

            <h3 className="truncate text-lg font-black uppercase text-white">
              {servico.clienteNome}
            </h3>
          </div>

          <p className="mt-1 truncate text-sm font-bold text-zinc-300">
            🛠 {servico.tipoServico || "Serviço não informado"}
          </p>
        </div>

        <span className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-black text-zinc-300">
          {expandido ? "▲" : "▼"}
        </span>
      </button>

      {expandido && (
        <div className="border-t border-zinc-800 px-4 pb-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-300">
              {servico.status}
            </span>

            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400">
              📅 {formatarData(servico.data)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <Informacao
              titulo="Horário"
              valor={faixaHorario || "Não informado"}
            />

            <Informacao
              titulo="Equipe"
              valor={servico.equipe || "Não informada"}
            />

            <Informacao
              titulo="Endereço"
              valor={
                [servico.endereco, servico.cidade]
                  .filter(Boolean)
                  .join(", ") || "Não informado"
              }
            />

            <Informacao
              titulo="Checklist"
              valor={
                checklistTotal > 0
                  ? `${checklistConcluido}/${checklistTotal}`
                  : "Sem checklist"
              }
            />
          </div>

          {servico.descricao && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
              <p className="mb-1 text-xs font-black uppercase text-zinc-500">
                Descrição
              </p>
              {servico.descricao}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(aoAbrir || aoFechar) && (
              <button
                type="button"
                onClick={(evento) => {
                  evento.stopPropagation();
                  void abrirServico();
                }}
                className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
              >
                Abrir serviço
              </button>
            )}

            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation();
                aoAbrirMaps(servico.endereco, servico.cidade);
              }}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black uppercase text-black"
            >
              Abrir no Maps
            </button>

            {ehAdministrador && (
              <select
                value={servico.status}
                onClick={(evento) => evento.stopPropagation()}
                onChange={(evento) =>
                  void alterarStatus(
                    evento.target.value as Servico["status"],
                  )
                }
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-bold text-white"
              >
                <option>Agendado</option>
                <option>Confirmado</option>
                <option>Em execução</option>
                <option>Concluído</option>
                <option>Cancelado</option>
              </select>
            )}

            {ehAdministrador && aoCancelar && (
              <button
                type="button"
                onClick={(evento) => {
                  evento.stopPropagation();
                  void aoCancelar(servico.id);
                }}
                className="rounded-xl border border-orange-500/70 px-4 py-2 text-sm font-black uppercase text-orange-300"
              >
                Cancelar / desmarcar
              </button>
            )}

            {ehAdministrador && (
              <button
                type="button"
                onClick={(evento) => {
                  evento.stopPropagation();
                  void aoExcluir(servico.id);
                }}
                className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-black uppercase text-red-400"
              >
                Excluir definitivamente
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Informacao({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-1 break-words font-bold text-zinc-200">
        {valor}
      </p>
    </div>
  );
}
