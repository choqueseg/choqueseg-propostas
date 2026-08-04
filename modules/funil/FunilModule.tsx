"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";

type StatusCliente =
  | "Novo Contato"
  | "Orçamento Solicitado"
  | "Orçamento Enviado"
  | "Retorno em 2 dias"
  | "Negociação"
  | "Serviço Fechado"
  | "Agendado"
  | "Em Execução"
  | "Concluído"
  | "Pós-venda";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: string;
  origem: string;
  observacoes: string;
  status: StatusCliente;
  criadoEm: string;
  retornoEm: string;
};

const CHAVE_CLIENTES = "choqueseg-pro-clientes";

const ETAPAS: StatusCliente[] = [
  "Novo Contato",
  "Orçamento Solicitado",
  "Orçamento Enviado",
  "Retorno em 2 dias",
  "Negociação",
  "Serviço Fechado",
  "Agendado",
  "Em Execução",
  "Concluído",
  "Pós-venda",
];

function adicionarDoisDias(data: Date) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + 2);
  return novaData.toISOString();
}

function formatarData(dataIso: string) {
  if (!dataIso) return "Não definida";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(dataIso));
}

export default function FunilModule() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [busca, setBusca] = useState("");
  const [clienteArrastado, setClienteArrastado] =
    useState<string | null>(null);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_CLIENTES);

    if (dadosSalvos) {
      try {
        setClientes(JSON.parse(dadosSalvos) as Cliente[]);
      } catch {
        localStorage.removeItem(CHAVE_CLIENTES);
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CLIENTES,
      JSON.stringify(clientes),
    );
  }, [clientes, dadosCarregados]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) =>
      [
        cliente.nome,
        cliente.telefone,
        cliente.cidade,
        cliente.tipoServico,
        cliente.origem,
        cliente.status,
      ].some((campo) =>
        campo.toLowerCase().includes(termo),
      ),
    );
  }, [busca, clientes]);

  function iniciarArraste(
    evento: DragEvent<HTMLElement>,
    clienteId: string,
  ) {
    setClienteArrastado(clienteId);
    evento.dataTransfer.setData("text/plain", clienteId);
    evento.dataTransfer.effectAllowed = "move";
  }

  function permitirSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";
  }

  function soltarNaEtapa(
    evento: DragEvent<HTMLDivElement>,
    novaEtapa: StatusCliente,
  ) {
    evento.preventDefault();

    const clienteId =
      evento.dataTransfer.getData("text/plain") ||
      clienteArrastado;

    if (!clienteId) return;

    setClientes((atuais) =>
      atuais.map((cliente) =>
        cliente.id === clienteId
          ? {
              ...cliente,
              status: novaEtapa,
              retornoEm:
                novaEtapa === "Retorno em 2 dias"
                  ? adicionarDoisDias(new Date())
                  : cliente.retornoEm,
            }
          : cliente,
      ),
    );

    setClienteArrastado(null);
  }

  function alterarStatus(
    clienteId: string,
    novaEtapa: StatusCliente,
  ) {
    setClientes((atuais) =>
      atuais.map((cliente) =>
        cliente.id === clienteId
          ? {
              ...cliente,
              status: novaEtapa,
              retornoEm:
                novaEtapa === "Retorno em 2 dias"
                  ? adicionarDoisDias(new Date())
                  : cliente.retornoEm,
            }
          : cliente,
      ),
    );
  }

  return (
    <section className="p-4 md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-yellow-400">
            CRM CHOQUESEG
          </p>

          <h2 className="mt-1 text-3xl font-black uppercase">
            Funil de vendas
          </h2>

          <p className="mt-2 text-zinc-400">
            Arraste os clientes entre as etapas do atendimento.
          </p>
        </div>

        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar cliente..."
          className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400 lg:max-w-sm"
        />
      </div>

      <div className="mt-7 overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {ETAPAS.map((etapa) => {
            const clientesDaEtapa =
              clientesFiltrados.filter(
                (cliente) => cliente.status === etapa,
              );

            return (
              <div
                key={etapa}
                onDragOver={permitirSoltar}
                onDrop={(evento) =>
                  soltarNaEtapa(evento, etapa)
                }
                className="w-[310px] shrink-0 rounded-2xl border border-zinc-800 bg-black p-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black uppercase text-yellow-400">
                    {etapa}
                  </h3>

                  <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-black text-black">
                    {clientesDaEtapa.length}
                  </span>
                </div>

                <div className="mt-3 min-h-[180px] space-y-3">
                  {clientesDaEtapa.length === 0 ? (
                    <div className="flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-center text-sm text-zinc-600">
                      Arraste um cliente para esta etapa
                    </div>
                  ) : (
                    clientesDaEtapa.map((cliente) => (
                      <article
                        key={cliente.id}
                        draggable
                        onDragStart={(evento) =>
                          iniciarArraste(
                            evento,
                            cliente.id,
                          )
                        }
                        className={`cursor-grab rounded-xl border bg-zinc-950 p-4 shadow-lg transition active:cursor-grabbing ${
                          clienteArrastado === cliente.id
                            ? "border-yellow-400 opacity-60"
                            : "border-zinc-800 hover:border-yellow-400/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black uppercase text-white">
                              {cliente.nome}
                            </h4>

                            <p className="mt-1 text-sm font-bold text-yellow-400">
                              {cliente.telefone}
                            </p>
                          </div>

                          <span className="text-lg">⋮⋮</span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-zinc-400">
                          <p>
                            📍{" "}
                            {cliente.cidade ||
                              "Cidade não informada"}
                          </p>

                          <p>🛠 {cliente.tipoServico}</p>

                          <p>📣 {cliente.origem}</p>

                          {etapa === "Retorno em 2 dias" && (
                            <p className="font-bold text-orange-300">
                              ⏰ Retorno:{" "}
                              {formatarData(
                                cliente.retornoEm,
                              )}
                            </p>
                          )}
                        </div>

                        <select
                          value={cliente.status}
                          onChange={(evento) =>
                            alterarStatus(
                              cliente.id,
                              evento.target
                                .value as StatusCliente,
                            )
                          }
                          onClick={(evento) =>
                            evento.stopPropagation()
                          }
                          className="mt-4 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-bold text-white outline-none focus:border-yellow-400"
                        >
                          {ETAPAS.map((opcao) => (
                            <option
                              key={opcao}
                              value={opcao}
                            >
                              {opcao}
                            </option>
                          ))}
                        </select>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-yellow-400/50 px-2 py-2 text-xs font-black uppercase text-yellow-400"
                          >
                            Proposta
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-zinc-700 px-2 py-2 text-xs font-black uppercase text-zinc-300"
                          >
                            Detalhes
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}