"use client";

import { useEffect, useState } from "react";
import AssinaturaServico from "./AssinaturaServico";
import ChecklistServico from "./ChecklistServico";
import FotosServico from "./FotosServico";
import HistoricoServico from "./HistoricoServico";
import MateriaisServico from "./MateriaisServico";
import {
  EventoHistorico,
  FotoServico,
  ItemChecklist,
  MaterialUtilizado,
  Servico,
} from "./types";

type Props = {
  servico: Servico;
  usuarioNome: string;
  ehAdministrador: boolean;
  aoFechar: () => void;
  aoSalvar: (servico: Servico) => void;
  aoAbrirMaps: (endereco: string, cidade: string) => void;
};

const CHECKLIST_PADRAO = [
  "Cliente presente ou responsável autorizado",
  "Fotos antes da execução registradas",
  "Equipamentos e materiais conferidos",
  "Estrutura e local de instalação conferidos",
  "Instalação e conexões revisadas",
  "Sistema energizado com segurança",
  "Testes de funcionamento realizados",
  "Cliente orientado sobre o sistema",
];

const CHECKLIST_ENERGIA_SOLAR = [
  "Levar água",
  "Levar protetor solar",
  "Levar o almoço",
  "Conferir capacete e EPIs",
  "Conferir cinto de segurança e equipamentos para trabalho em altura",
  "Conferir módulos solares",
  "Conferir inversor ou microinversores",
  "Conferir estrutura de fixação",
  "Conferir cabos solares e conectores",
  "Conferir proteções elétricas e ferramentas necessárias",
];

function ehServicoEnergiaSolar(tipoServico?: string) {
  const tipo = (tipoServico ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return tipo.includes("energia solar") || tipo.includes("solar");
}

function criarChecklist(
  itens?: ItemChecklist[],
  tipoServico?: string,
) {
  const titulosObrigatorios = ehServicoEnergiaSolar(tipoServico)
    ? [...CHECKLIST_ENERGIA_SOLAR, ...CHECKLIST_PADRAO]
    : CHECKLIST_PADRAO;

  const itensExistentes = itens ?? [];

  return titulosObrigatorios.map((titulo, indice) => {
    const existente = itensExistentes.find(
      (item) => item.titulo.trim().toLowerCase() === titulo.trim().toLowerCase(),
    );

    return (
      existente ?? {
        id: `checklist-${indice + 1}-${titulo
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,
        titulo,
        concluido: false,
      }
    );
  });
}

function criarEvento(usuario: string, descricao: string): EventoHistorico {
  return {
    id: crypto.randomUUID(),
    dataHora: new Date().toISOString(),
    usuario,
    descricao,
  };
}

export default function ModalServico({
  servico,
  usuarioNome,
  ehAdministrador,
  aoFechar,
  aoSalvar,
  aoAbrirMaps,
}: Props) {
  const [rascunho, setRascunho] = useState<Servico>(() => ({
    ...servico,
    checklist: criarChecklist(servico.checklist, servico.tipoServico),
    materiais: servico.materiais ?? [],
    fotos: servico.fotos ?? [],
    historico: servico.historico ?? [],
  }));
  const [mensagem, setMensagem] = useState("");

  const bloqueado = rascunho.status === "Concluído" && !ehAdministrador;

  useEffect(() => {
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [aoFechar]);

  function atualizarChecklist(checklist: ItemChecklist[]) {
    setRascunho((atual) => ({ ...atual, checklist }));
  }

  function atualizarMateriais(materiais: MaterialUtilizado[]) {
    setRascunho((atual) => ({ ...atual, materiais }));
  }

  function atualizarFotos(fotos: FotoServico[]) {
    setRascunho((atual) => ({ ...atual, fotos }));
  }

  function salvarAndamento() {
    const historico = [
      ...(rascunho.historico ?? []),
      criarEvento(usuarioNome, "Andamento da Ordem de Serviço salvo"),
    ];
    const atualizado = { ...rascunho, historico };
    setRascunho(atualizado);
    aoSalvar(atualizado);
    setMensagem("Andamento salvo com sucesso.");
  }
function registrarSaidaEmpresa() {
  const agora = new Date().toISOString();

  const atualizado: Servico = {
    ...rascunho,
    status: "Em deslocamento",
    saidaEmpresaEm: rascunho.saidaEmpresaEm ?? agora,
    historico: [
      ...(rascunho.historico ?? []),
      criarEvento(usuarioNome, "Equipe saiu da empresa"),
    ],
  };

  setRascunho(atualizado);
  aoSalvar(atualizado);
  setMensagem("Saída da empresa registrada.");
}

function registrarChegadaCliente() {
  const agora = new Date().toISOString();

  const atualizado: Servico = {
    ...rascunho,
    chegadaClienteEm: rascunho.chegadaClienteEm ?? agora,
    historico: [
      ...(rascunho.historico ?? []),
      criarEvento(usuarioNome, "Equipe chegou ao cliente"),
    ],
  };

  setRascunho(atualizado);
  aoSalvar(atualizado);
  setMensagem("Chegada ao cliente registrada.");
}
  function iniciarServico() {
    const agora = new Date().toISOString();
    const atualizado: Servico = {
      ...rascunho,
      status: "Em execução",
      iniciadoEm: rascunho.iniciadoEm ?? agora,
      iniciadoPor: rascunho.iniciadoPor ?? usuarioNome,
      historico: [
        ...(rascunho.historico ?? []),
        criarEvento(usuarioNome, "Serviço iniciado"),
      ],
    };
    setRascunho(atualizado);
    aoSalvar(atualizado);
    setMensagem("Serviço iniciado.");
  }

  function concluirServico() {
    const itensPendentes = (rascunho.checklist ?? []).filter(
      (item) => !item.concluido,
    ).length;

    if (itensPendentes > 0) {
      const continuar = window.confirm(
        `Ainda existem ${itensPendentes} itens pendentes no checklist. Deseja concluir mesmo assim?`,
      );
      if (!continuar) return;
    }

    if (!rascunho.assinaturaCliente) {
      const continuar = window.confirm(
        "A assinatura do cliente não foi registrada. Deseja concluir mesmo assim?",
      );
      if (!continuar) return;
    }

    const agora = new Date().toISOString();
    const atualizado: Servico = {
      ...rascunho,
      status: "Concluído",
      iniciadoEm: rascunho.iniciadoEm ?? agora,
      iniciadoPor: rascunho.iniciadoPor ?? usuarioNome,
      concluidoEm: agora,
      concluidoPor: usuarioNome,
      historico: [
        ...(rascunho.historico ?? []),
        criarEvento(usuarioNome, "Serviço concluído"),
      ],
    };

    setRascunho(atualizado);
    aoSalvar(atualizado);
    setMensagem("Serviço concluído com sucesso.");
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto min-h-full max-w-6xl rounded-3xl border border-yellow-400/30 bg-zinc-950 shadow-2xl">
        <header className="sticky top-0 z-10 flex flex-col gap-4 rounded-t-3xl border-b border-zinc-800 bg-black/95 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-yellow-400">
              Ordem de Serviço
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase text-white">
              {rascunho.clienteNome}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {rascunho.tipoServico} · Responsável: {rascunho.equipe}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-black uppercase text-yellow-300">
              {rascunho.status}
            </span>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-black uppercase text-zinc-300"
            >
              Fechar
            </button>
          </div>
        </header>

        <div className="space-y-5 p-4 md:p-6">
          {mensagem && (
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
              {mensagem}
            </div>
          )}

          <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-black p-5 md:grid-cols-2 lg:grid-cols-4">
            <Info titulo="Cliente" valor={rascunho.clienteNome} />
            <Info titulo="Telefone" valor={rascunho.clienteTelefone || "Não informado"} />
            <Info titulo="Data e horário" valor={`${rascunho.data} às ${rascunho.horario}`} />
            <Info titulo="Responsável" valor={rascunho.equipe} />
            <div className="md:col-span-2 lg:col-span-3">
              <Info titulo="Endereço" valor={`${rascunho.endereco}, ${rascunho.cidade}`} />
            </div>
            <button
              type="button"
              onClick={() => aoAbrirMaps(rascunho.endereco, rascunho.cidade)}
              className="rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black"
            >
              Abrir no Maps
            </button>
          </section>
<section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
  <h3 className="text-lg font-black uppercase text-yellow-400">
    Deslocamento e custos
  </h3>

  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <CampoNumero
      label="Quilometragem inicial"
      valor={rascunho.quilometragemInicial}
      onChange={(valor) =>
        setRascunho((atual) => ({
          ...atual,
          quilometragemInicial: valor,
        }))
      }
      bloqueado={bloqueado}
    />

    <CampoNumero
      label="Quilometragem final"
      valor={rascunho.quilometragemFinal}
      onChange={(valor) =>
        setRascunho((atual) => ({
          ...atual,
          quilometragemFinal: valor,
        }))
      }
      bloqueado={bloqueado}
    />

    <CampoNumero
      label="Combustível"
      valor={rascunho.despesas?.combustivel}
      onChange={(valor) =>
        setRascunho((atual) => ({
          ...atual,
          despesas: {
            combustivel: valor ?? 0,
            alimentacao: atual.despesas?.alimentacao ?? 0,
            pedagio: atual.despesas?.pedagio ?? 0,
            outros: atual.despesas?.outros ?? 0,
            descricaoOutros: atual.despesas?.descricaoOutros,
          },
        }))
      }
      bloqueado={bloqueado}
      moeda
    />

    <CampoNumero
      label="Alimentação"
      valor={rascunho.despesas?.alimentacao}
      onChange={(valor) =>
        setRascunho((atual) => ({
          ...atual,
          despesas: {
            combustivel: atual.despesas?.combustivel ?? 0,
            alimentacao: valor ?? 0,
            pedagio: atual.despesas?.pedagio ?? 0,
            outros: atual.despesas?.outros ?? 0,
            descricaoOutros: atual.despesas?.descricaoOutros,
          },
        }))
      }
      bloqueado={bloqueado}
      moeda
    />

    <CampoNumero
      label="Pedágio"
      valor={rascunho.despesas?.pedagio}
      onChange={(valor) =>
        setRascunho((atual) => ({
          ...atual,
          despesas: {
            combustivel: atual.despesas?.combustivel ?? 0,
            alimentacao: atual.despesas?.alimentacao ?? 0,
            pedagio: valor ?? 0,
            outros: atual.despesas?.outros ?? 0,
            descricaoOutros: atual.despesas?.descricaoOutros,
          },
        }))
      }
      bloqueado={bloqueado}
      moeda
    />

    <CampoNumero
      label="Outras despesas"
      valor={rascunho.despesas?.outros}
      onChange={(valor) =>
        setRascunho((atual) => ({
          ...atual,
          despesas: {
            combustivel: atual.despesas?.combustivel ?? 0,
            alimentacao: atual.despesas?.alimentacao ?? 0,
            pedagio: atual.despesas?.pedagio ?? 0,
            outros: valor ?? 0,
            descricaoOutros: atual.despesas?.descricaoOutros,
          },
        }))
      }
      bloqueado={bloqueado}
      moeda
    />
  </div>

  <div className="mt-4">
    <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
      Descrição de outras despesas
    </label>

    <input
      type="text"
      value={rascunho.despesas?.descricaoOutros ?? ""}
      disabled={bloqueado}
      onChange={(evento) =>
        setRascunho((atual) => ({
          ...atual,
          despesas: {
            combustivel: atual.despesas?.combustivel ?? 0,
            alimentacao: atual.despesas?.alimentacao ?? 0,
            pedagio: atual.despesas?.pedagio ?? 0,
            outros: atual.despesas?.outros ?? 0,
            descricaoOutros: evento.target.value,
          },
        }))
      }
      placeholder="Ex.: estacionamento, compra emergencial ou ferramenta"
      className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
    />
  </div>
</section>
          <ChecklistServico
            itens={rascunho.checklist ?? []}
            aoAlterar={atualizarChecklist}
            bloqueado={bloqueado}
          />

          <MateriaisServico
            materiais={rascunho.materiais ?? []}
            aoAlterar={atualizarMateriais}
            bloqueado={bloqueado}
          />

          <FotosServico
            fotos={rascunho.fotos ?? []}
            aoAlterar={atualizarFotos}
            bloqueado={bloqueado}
          />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-lg font-black uppercase text-yellow-400">
              Observações técnicas
            </h3>
            <textarea
              value={rascunho.observacoesTecnico ?? ""}
              disabled={bloqueado}
              onChange={(evento) =>
                setRascunho((atual) => ({
                  ...atual,
                  observacoesTecnico: evento.target.value,
                }))
              }
              rows={5}
              placeholder="Informe detalhes da execução, dificuldades, pendências ou orientações ao cliente."
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </section>

          <AssinaturaServico
            assinatura={rascunho.assinaturaCliente}
            aoAlterar={(assinaturaCliente) =>
              setRascunho((atual) => ({ ...atual, assinaturaCliente }))
            }
            bloqueado={bloqueado}
          />

          <HistoricoServico historico={rascunho.historico ?? []} />

          <footer className="flex flex-col-reverse gap-3 rounded-2xl border border-zinc-800 bg-black p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={salvarAndamento}
              disabled={bloqueado}
              className="rounded-xl border border-yellow-400 px-5 py-3 font-black uppercase text-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar andamento
            </button>

            {rascunho.status === "Agendado" && (
  <button
    type="button"
    onClick={registrarSaidaEmpresa}
    className="rounded-xl bg-blue-500 px-5 py-3 font-black uppercase text-white"
  >
    Sair da empresa
  </button>
)}

{rascunho.status === "Em deslocamento" &&
  !rascunho.chegadaClienteEm && (
    <button
      type="button"
      onClick={registrarChegadaCliente}
      className="rounded-xl bg-orange-500 px-5 py-3 font-black uppercase text-black"
    >
      Cheguei ao cliente
    </button>
  )}

{rascunho.status === "Em deslocamento" &&
  rascunho.chegadaClienteEm && (
    <button
      type="button"
      onClick={iniciarServico}
      className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
    >
      Iniciar serviço
    </button>
  )}

            {rascunho.status !== "Concluído" && (
              <button
                type="button"
                onClick={concluirServico}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-black uppercase text-black"
              >
                Concluir serviço
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
function CampoNumero({
  label,
  valor,
  onChange,
  bloqueado,
  moeda = false,
}: {
  label: string;
  valor?: number;
  onChange: (valor?: number) => void;
  bloqueado: boolean;
  moeda?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <div className="relative">
        {moeda && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
            R$
          </span>
        )}

        <input
          type="number"
          min="0"
          step={moeda ? "0.01" : "1"}
          value={valor ?? ""}
          disabled={bloqueado}
          onChange={(evento) =>
            onChange(
              evento.target.value === ""
                ? undefined
                : Number(evento.target.value),
            )
          }
          className={`w-full rounded-xl border border-zinc-700 bg-black py-3 pr-4 text-white outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-70 ${
            moeda ? "pl-11" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-1 font-bold text-zinc-200">{valor || "—"}</p>
    </div>
  );
}