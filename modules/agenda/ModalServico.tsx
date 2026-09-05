

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
  podeVerContatoCliente: boolean;
  aoFechar: () => void;
  aoSalvar: (servico: Servico) => Promise<boolean | string> | boolean | string | void;
  aoAbrirMaps: (endereco: string, cidade: string) => void;
};

const CHECKLIST_SAIDA_PADRAO = [
  "Ferramentas",
  "Escada",
  "Capacete e EPIs",
  "Fios e cabos",
  "Material de acordo com o serviço",
  "Água, almoço, cimento e gesso",
];

function normalizarTexto(valor?: string) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function itensEspecificosDoServico(_tipoServico?: string) {
  return [];
}

function criarChecklist(
  itens?: ItemChecklist[],
  tipoServico?: string,
) {
  const titulosObrigatorios = [
    ...CHECKLIST_SAIDA_PADRAO,
    ...itensEspecificosDoServico(tipoServico),
  ];

  const itensExistentes = itens ?? [];

  const obrigatorios = titulosObrigatorios.map((titulo, indice) => {
    const existente = itensExistentes.find(
      (item) =>
        item.titulo.trim().toLowerCase() === titulo.trim().toLowerCase(),
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

  const extras = itensExistentes.filter(
    (item) =>
      item.id.startsWith("extra-") ||
      !titulosObrigatorios.some(
        (titulo) =>
          titulo.trim().toLowerCase() === item.titulo.trim().toLowerCase(),
      ),
  );

  return [...obrigatorios, ...extras];
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
  podeVerContatoCliente,
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
  const checklistEncerrado = Boolean(rascunho.saidaEmpresaEm) || bloqueado;
  const chegouAoCliente = Boolean(rascunho.chegadaClienteEm);
  const servicoIniciado = Boolean(rascunho.iniciadoEm);
  const servicoConcluido = rascunho.status === "Concluído";

  const checklistCompleto =
    (rascunho.checklist ?? []).length > 0 &&
    (rascunho.checklist ?? []).every((item) => item.concluido);

  const fotosAntes = (rascunho.fotos ?? []).filter(
    (foto) => foto.etapa === "Antes",
  ).length;
  const fotosDepois = (rascunho.fotos ?? []).filter(
    (foto) => foto.etapa === "Depois",
  ).length;

  const etapasFotosPermitidas: FotoServico["etapa"][] = servicoConcluido
    ? []
    : !chegouAoCliente
      ? []
      : !servicoIniciado
        ? ["Antes"]
        : ["Durante", "Depois"];

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
  if (!checklistCompleto) {
    setMensagem(
      "Conclua todo o checklist de saída antes de registrar a saída da empresa.",
    );
    return;
  }

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
    if (fotosAntes === 0) {
      setMensagem(
        "Registre pelo menos uma foto ANTES antes de iniciar o serviço.",
      );
      return;
    }

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

  async function concluirServico() {
    if (!servicoIniciado) {
      setMensagem("Inicie o serviço antes de concluir a ordem.");
      return;
    }

    if (fotosDepois === 0) {
      setMensagem(
        "Registre pelo menos uma foto DEPOIS antes de concluir o serviço.",
      );
      return;
    }

    if (!rascunho.assinaturaCliente) {
      setMensagem(
        "Registre a assinatura do cliente antes de concluir o serviço.",
      );
      return;
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

    setMensagem("Concluindo serviço e atualizando estoque...");

    const salvo = await aoSalvar(atualizado);

    if (salvo === false) {
      setMensagem(
        "Não foi possível concluir o serviço. Verifique a mensagem da Agenda.",
      );
      return;
    }

    setRascunho(atualizado);

    if (typeof salvo === "string" && salvo.trim()) {
      setMensagem(salvo);
    } else {
      setMensagem("Serviço concluído com sucesso.");
    }
  }

  const etapaAtual =
    servicoConcluido
      ? 8
      : rascunho.assinaturaCliente && fotosDepois > 0
        ? 7
        : servicoIniciado
          ? 5
          : fotosAntes > 0 && chegouAoCliente
            ? 4
            : chegouAoCliente
              ? 3
              : rascunho.saidaEmpresaEm
                ? 2
                : 1;

  const etapasFluxo = [
    "Saída da empresa",
    "Cheguei ao cliente",
    "Fotos antes",
    "Iniciar serviço",
    "Execução",
    "Fotos depois",
    "Assinatura",
    "Concluir serviço",
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 p-2 backdrop-blur-sm md:p-4">
      <div className="mx-auto min-h-full max-w-[1500px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-zinc-800 bg-black/95 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-yellow-400">
              Ordem de serviço
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

        {mensagem && (
          <div className="mx-4 mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
            {mensagem}
          </div>
        )}

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.15fr)]">
          <div className="min-w-0 space-y-4">
            {!rascunho.saidaEmpresaEm && (
              <ChecklistServico
                itens={rascunho.checklist ?? []}
                aoAlterar={atualizarChecklist}
                bloqueado={checklistEncerrado}
                tipoServico={rascunho.tipoServico}
                aoSairDaEmpresa={registrarSaidaEmpresa}
                podeSair={checklistCompleto}
                saidaRegistrada={Boolean(rascunho.saidaEmpresaEm)}
              />
            )}

            {rascunho.saidaEmpresaEm &&
              !rascunho.chegadaClienteEm &&
              !servicoConcluido && (
                <section className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <h3 className="text-lg font-black uppercase text-yellow-400">
                    Deslocamento
                  </h3>
                  <p className="mt-2 text-zinc-400">
                    Saída registrada. Ao chegar, confirme a chegada ao cliente.
                  </p>
                  <button
                    type="button"
                    onClick={registrarChegadaCliente}
                    className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-4 font-black uppercase text-black"
                  >
                    Cheguei ao cliente
                  </button>
                </section>
              )}

            {chegouAoCliente && !servicoIniciado && !servicoConcluido && (
              <section className="space-y-4">
                <FotosServico
                  fotos={rascunho.fotos ?? []}
                  aoAlterar={atualizarFotos}
                  bloqueado={bloqueado}
                  etapasPermitidas={["Antes"]}
                />

                <button
                  type="button"
                  onClick={iniciarServico}
                  disabled={fotosAntes === 0}
                  className="w-full rounded-xl bg-yellow-400 px-5 py-4 font-black uppercase text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Iniciar serviço
                </button>
              </section>
            )}

            {servicoIniciado && !servicoConcluido && (
              <div className="space-y-4">
                <MateriaisServico
                  materiais={rascunho.materiais ?? []}
                  aoAlterar={atualizarMateriais}
                  bloqueado={bloqueado}
                />

                <FotosServico
                  fotos={rascunho.fotos ?? []}
                  aoAlterar={atualizarFotos}
                  bloqueado={bloqueado}
                  etapasPermitidas={["Durante", "Depois"]}
                />

                <section className="rounded-2xl border border-zinc-800 bg-black p-5">
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
                    rows={4}
                    placeholder="Informe detalhes da execução, dificuldades, pendências ou orientações."
                    className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </section>

                <AssinaturaServico
                  assinatura={rascunho.assinaturaCliente}
                  aoAlterar={(assinaturaCliente) =>
                    setRascunho((atual) => ({ ...atual, assinaturaCliente }))
                  }
                  bloqueado={bloqueado}
                />

                <button
                  type="button"
                  onClick={concluirServico}
                  disabled={fotosDepois === 0 || !rascunho.assinaturaCliente}
                  className="w-full rounded-xl bg-yellow-400 px-5 py-4 font-black uppercase text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Concluir serviço
                </button>
              </div>
            )}

            {servicoConcluido && (
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <h3 className="text-lg font-black uppercase text-emerald-300">
                  Serviço concluído
                </h3>
                <p className="mt-2 text-zinc-300">
                  A ordem foi finalizada e permanece disponível para consulta.
                </p>
              </section>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-zinc-800 bg-black p-5">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {etapasFluxo.map((titulo, indice) => {
                  const numero = indice + 1;
                  const concluida = numero < etapaAtual;
                  const ativa = numero === etapaAtual;

                  return (
                    <div key={titulo} className="min-w-0 text-center">
                      <div
                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black ${
                          ativa
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : concluida
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : "border-zinc-700 bg-zinc-950 text-zinc-500"
                        }`}
                      >
                        {concluida ? "✓" : numero}
                      </div>
                      <p
                        className={`mt-2 text-[10px] font-bold leading-tight sm:text-xs ${
                          ativa ? "text-yellow-400" : "text-zinc-500"
                        }`}
                      >
                        {titulo}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-black p-5">
              <h3 className="text-lg font-black uppercase text-yellow-400">
                Dados do cliente
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Info titulo="Cliente" valor={rascunho.clienteNome} />
                <Info
                  titulo="Telefone / WhatsApp"
                  valor={
                    podeVerContatoCliente
                      ? rascunho.clienteTelefone || "Não informado"
                      : "Contato restrito à gerência"
                  }
                />
                <div className="sm:col-span-2">
                  <Info
                    titulo="Endereço"
                    valor={`${rascunho.endereco}, ${rascunho.cidade}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => aoAbrirMaps(rascunho.endereco, rascunho.cidade)}
                className="mt-4 rounded-xl border border-yellow-400 px-4 py-3 font-black uppercase text-yellow-400"
              >
                Abrir no Maps
              </button>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-black p-5">
              <h3 className="text-lg font-black uppercase text-yellow-400">
                Informações do serviço
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info titulo="Tipo de serviço" valor={rascunho.tipoServico} />
                <Info titulo="Responsável" valor={rascunho.equipe} />
                <Info titulo="Data" valor={rascunho.data} />
                <Info titulo="Horário" valor={rascunho.horario} />
                <div className="sm:col-span-2">
                  <Info titulo="Descrição" valor={rascunho.descricao || "—"} />
                </div>
              </div>
            </section>

            <HistoricoServico historico={rascunho.historico ?? []} />
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-zinc-800 bg-black p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={salvarAndamento}
            disabled={bloqueado}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-black uppercase text-zinc-300 disabled:opacity-40"
          >
            Salvar andamento
          </button>

          <button
            type="button"
            onClick={aoFechar}
            className="rounded-xl border border-red-500 px-5 py-3 font-black uppercase text-red-400"
          >
            Fechar ordem
          </button>
        </footer>
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