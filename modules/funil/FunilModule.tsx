"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type StatusCliente =
  | "Novo Cliente"
  | "Orçamento Solicitado"
  | "Orçamento Enviado"
  | "Cliente Ainda Não Decidiu"
  | "Cliente Desistiu / Fechou com Outra Empresa"
  | "Serviço Fechado / Adiantamento Pago"
  | "Serviço Agendado"
  | "Em Execução"
  | "Serviço Concluído"
  | "Etapa de Obra"
  | "Projeto Aprovado"
  | "Instalação Concluída"
  | "Solicitar Vistoria"
  | "Medidor Trocado"
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
const supabase = createClient();

const ETAPAS: StatusCliente[] = [
  "Novo Cliente",
  "Orçamento Solicitado",
  "Orçamento Enviado",
  "Cliente Ainda Não Decidiu",
  "Cliente Desistiu / Fechou com Outra Empresa",
  "Serviço Fechado / Adiantamento Pago",
  "Serviço Agendado",
  "Em Execução",
  "Serviço Concluído",
  "Etapa de Obra",
  "Projeto Aprovado",
  "Instalação Concluída",
  "Solicitar Vistoria",
  "Medidor Trocado",
  "Pós-venda",
];

const ETAPAS_SOLAR: StatusCliente[] = [
  "Etapa de Obra",
  "Projeto Aprovado",
  "Instalação Concluída",
  "Solicitar Vistoria",
  "Medidor Trocado",
];

function normalizarStatusLegado(status: string): StatusCliente {
  const mapa: Record<string, StatusCliente> = {
    "Novo Contato": "Novo Cliente",
    "Novo Cliente": "Novo Cliente",
    "Orçamento Solicitado": "Orçamento Solicitado",
    "Orçamento Enviado": "Orçamento Enviado",
    "Retorno em 2 dias": "Cliente Ainda Não Decidiu",
    "Negociação": "Cliente Ainda Não Decidiu",
    "Cliente Ainda Não Decidiu": "Cliente Ainda Não Decidiu",
    "Cliente Desistiu / Fechou com Outra Empresa":
      "Cliente Desistiu / Fechou com Outra Empresa",
    "Serviço Fechado": "Serviço Fechado / Adiantamento Pago",
    "Serviço Fechado / Adiantamento Pago":
      "Serviço Fechado / Adiantamento Pago",
    "Agendado": "Serviço Agendado",
    "Serviço Agendado": "Serviço Agendado",
    "Em Execução": "Em Execução",
    "Concluído": "Serviço Concluído",
    "Serviço Concluído": "Serviço Concluído",
    "Etapa de Obra": "Etapa de Obra",
    "Projeto Aprovado": "Projeto Aprovado",
    "Instalação Concluída": "Instalação Concluída",
    "Solicitar Vistoria": "Solicitar Vistoria",
    "Medidor Trocado": "Medidor Trocado",
    "Pós-venda": "Pós-venda",
  };

  return mapa[status] ?? "Novo Cliente";
}

function ehEnergiaSolar(tipoServico: string) {
  const tipo = (tipoServico ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return tipo.includes("solar");
}

function agruparEtapas(etapas: StatusCliente[], tamanho = 4) {
  const grupos: StatusCliente[][] = [];
  for (let i = 0; i < etapas.length; i += tamanho) {
    grupos.push(etapas.slice(i, i + tamanho));
  }
  return grupos;
}

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
  const [clienteDetalhes, setClienteDetalhes] = useState<Cliente | null>(null);
  const [clienteMensagem, setClienteMensagem] = useState<Cliente | null>(null);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [carregandoNuvem, setCarregandoNuvem] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarClientesDaNuvem() {
      const { data, error } = await supabase
        .from("clientes")
        .select(
          "id,nome,telefone,cidade,endereco,tipo_servico,origem,observacoes,status,criado_em,retorno_em",
        )
        .order("criado_em", { ascending: false });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar clientes no Funil:", error);

        const dadosSalvos = localStorage.getItem(CHAVE_CLIENTES);
        if (dadosSalvos) {
          try {
            const listaSalva = JSON.parse(dadosSalvos) as Cliente[];
            const listaMigrada = listaSalva.map((cliente) => ({
              ...cliente,
              status: normalizarStatusLegado(String(cliente.status)),
              retornoEm: cliente.retornoEm ?? "",
            }));
            setClientes(listaMigrada);
          } catch {
            localStorage.removeItem(CHAVE_CLIENTES);
          }
        }

        setDadosCarregados(true);
        setCarregandoNuvem(false);
        return;
      }

      const listaNuvem: Cliente[] = (data ?? []).map((item) => ({
        id: String(item.id),
        nome: String(item.nome ?? ""),
        telefone: String(item.telefone ?? ""),
        cidade: String(item.cidade ?? ""),
        endereco: String(item.endereco ?? ""),
        tipoServico: String(item.tipo_servico ?? ""),
        origem: String(item.origem ?? ""),
        observacoes: String(item.observacoes ?? ""),
        status: normalizarStatusLegado(String(item.status ?? "")),
        criadoEm: String(item.criado_em ?? new Date().toISOString()),
        retornoEm: String(item.retorno_em ?? ""),
      }));

      setClientes(listaNuvem);
      localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(listaNuvem));
      setDadosCarregados(true);
      setCarregandoNuvem(false);
    }

    void carregarClientesDaNuvem();

    const canalClientes = supabase
      .channel("funil-clientes-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clientes",
        },
        () => {
          void carregarClientesDaNuvem();
        },
      )
      .subscribe();

    const recarregarAoVoltar = () => {
      if (document.visibilityState === "visible") {
        void carregarClientesDaNuvem();
      }
    };

    window.addEventListener("focus", recarregarAoVoltar);
    document.addEventListener("visibilitychange", recarregarAoVoltar);

    const intervalo = window.setInterval(() => {
      void carregarClientesDaNuvem();
    }, 20_000);

    return () => {
      ativo = false;
      void supabase.removeChannel(canalClientes);
      window.removeEventListener("focus", recarregarAoVoltar);
      document.removeEventListener("visibilitychange", recarregarAoVoltar);
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_CLIENTES,
      JSON.stringify(clientes),
    );
  }, [clientes, dadosCarregados]);

  useEffect(() => {
    if (!dadosCarregados) return;

    async function verificarRetornosVencidos() {
      const agora = Date.now();
      const vencidos = clientes.filter((cliente) => {
        if (cliente.status !== "Orçamento Enviado" || !cliente.retornoEm) {
          return false;
        }

        const retorno = new Date(cliente.retornoEm).getTime();
        return Number.isFinite(retorno) && retorno <= agora;
      });

      if (vencidos.length === 0) return;

      const ids = vencidos.map((cliente) => cliente.id);

      setClientes((atuais) =>
        atuais.map((cliente) =>
          ids.includes(cliente.id)
            ? { ...cliente, status: "Cliente Ainda Não Decidiu" as StatusCliente }
            : cliente,
        ),
      );

      const { error } = await supabase
        .from("clientes")
        .update({ status: "Cliente Ainda Não Decidiu" })
        .in("id", ids);

      if (error) {
        console.error("Erro ao atualizar retornos vencidos:", error);
      }
    }

    void verificarRetornosVencidos();
    const intervalo = window.setInterval(() => {
      void verificarRetornosVencidos();
    }, 60_000);

    return () => window.clearInterval(intervalo);
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

  function podeMoverParaEtapa(cliente: Cliente, novaEtapa: StatusCliente) {
    if (ETAPAS_SOLAR.includes(novaEtapa) && !ehEnergiaSolar(cliente.tipoServico)) {
      window.alert(
        "Esta etapa é exclusiva para clientes de Energia Solar.",
      );
      return false;
    }

    return true;
  }

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

    const clienteAtual = clientes.find((cliente) => cliente.id === clienteId);
    if (!clienteAtual) return;
    if (!podeMoverParaEtapa(clienteAtual, novaEtapa)) return;

    const retornoEm =
      novaEtapa === "Orçamento Enviado"
        ? adicionarDoisDias(new Date())
        : clienteAtual.retornoEm;

    setClientes((atuais) =>
      atuais.map((cliente) =>
        cliente.id === clienteId
          ? { ...cliente, status: novaEtapa, retornoEm }
          : cliente,
      ),
    );

    void supabase
      .from("clientes")
      .update({ status: novaEtapa, retorno_em: retornoEm })
      .eq("id", clienteId)
      .then(({ error }) => {
        if (error) console.error("Erro ao atualizar cliente no funil:", error);
      });

    setClienteArrastado(null);
  }

  function alterarStatus(
    clienteId: string,
    novaEtapa: StatusCliente,
  ) {
    const clienteAtual = clientes.find((cliente) => cliente.id === clienteId);
    if (!clienteAtual) return;
    if (!podeMoverParaEtapa(clienteAtual, novaEtapa)) return;

    const retornoEm =
      novaEtapa === "Orçamento Enviado"
        ? adicionarDoisDias(new Date())
        : clienteAtual.retornoEm;

    setClientes((atuais) =>
      atuais.map((cliente) =>
        cliente.id === clienteId
          ? { ...cliente, status: novaEtapa, retornoEm }
          : cliente,
      ),
    );

    void supabase
      .from("clientes")
      .update({ status: novaEtapa, retorno_em: retornoEm })
      .eq("id", clienteId)
      .then(({ error }) => {
        if (error) console.error("Erro ao atualizar cliente no funil:", error);
      });
  }

  function montarMensagemFollowUp(cliente: Cliente) {
    const primeiroNome = cliente.nome.trim().split(/\s+/)[0] || "cliente";
    const nomeFormatado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();

    const servico = cliente.tipoServico?.trim() || "seu orçamento";

    return (
      `Olá, ${nomeFormatado}! Tudo bem?\n\n` +
      `Passando para saber se você conseguiu analisar a proposta de ${servico} que enviamos.\n\n` +
      `Ficou alguma dúvida ou posso te ajudar em algum ponto para avançarmos?\n\n` +
      `Fico à disposição.\nEquipe CHOQUESEG`
    );
  }

  function prepararMensagemFollowUp(cliente: Cliente) {
    setClienteMensagem(cliente);
    setMensagemWhatsApp(montarMensagemFollowUp(cliente));
  }

  function abrirWhatsAppFollowUp() {
    if (!clienteMensagem) return;

    const numero = clienteMensagem.telefone.replace(/\D/g, "");
    const destino =
      numero.startsWith("55") && numero.length >= 12
        ? numero
        : numero.length >= 10
          ? `55${numero}`
          : "";

    if (!destino) {
      alert("O telefone deste cliente não é válido.");
      return;
    }

    if (!mensagemWhatsApp.trim()) {
      alert("A mensagem não pode ficar vazia.");
      return;
    }

    window.open(
      `https://wa.me/${destino}?text=${encodeURIComponent(mensagemWhatsApp)}`,
      "_blank",
      "noopener,noreferrer",
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
          <p className="mt-1 text-xs font-bold text-zinc-600">
            {carregandoNuvem ? "Sincronizando com a nuvem..." : "Funil sincronizado automaticamente"}
          </p>
        </div>

        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar cliente..."
          className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400 lg:max-w-sm"
        />
      </div>

      <div className="mt-7 space-y-5">
        {agruparEtapas(ETAPAS, 5).map((grupo, indiceGrupo) => (
          <LinhaEtapas
            key={`grupo-${indiceGrupo}`}
            etapas={grupo}
            clientesFiltrados={clientesFiltrados}
            clienteArrastado={clienteArrastado}
            iniciarArraste={iniciarArraste}
            permitirSoltar={permitirSoltar}
            soltarNaEtapa={soltarNaEtapa}
            alterarStatus={alterarStatus}
            setClienteDetalhes={setClienteDetalhes}
            prepararMensagemFollowUp={prepararMensagemFollowUp}
          />
        ))}
      </div>

      {clienteMensagem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setClienteMensagem(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-green-500/40 bg-black p-6 shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">
                  Follow-up comercial
                </p>
                <h3 className="mt-1 text-2xl font-black uppercase text-white">
                  Preparar mensagem
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Cliente: {clienteMensagem.nome}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setClienteMensagem(null)}
                className="rounded-lg border border-zinc-700 px-3 py-2 font-black text-zinc-300"
              >
                ✕
              </button>
            </div>

            <textarea
              value={mensagemWhatsApp}
              onChange={(evento) => setMensagemWhatsApp(evento.target.value)}
              rows={10}
              className="mt-5 w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm leading-relaxed text-white outline-none focus:border-green-500"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={abrirWhatsAppFollowUp}
                className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-black uppercase text-white"
              >
                💬 Abrir WhatsApp com esta mensagem
              </button>

              <button
                type="button"
                onClick={() =>
                  setMensagemWhatsApp(montarMensagemFollowUp(clienteMensagem))
                }
                className="rounded-xl border border-yellow-400 px-4 py-3 font-black uppercase text-yellow-400"
              >
                Restaurar mensagem sugerida
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              O envio não é automático. Você pode revisar e editar a mensagem antes de abrir o WhatsApp.
            </p>
          </div>
        </div>
      )}

      {clienteDetalhes && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setClienteDetalhes(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-yellow-400/40 bg-black p-6 shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  CRM CHOQUESEG
                </p>
                <h3 className="mt-1 text-2xl font-black uppercase text-white">
                  Detalhes do cliente
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setClienteDetalhes(null)}
                className="rounded-lg border border-zinc-700 px-3 py-2 font-black text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
              <DetalheCliente titulo="Nome" valor={clienteDetalhes.nome} />
              <DetalheCliente titulo="Telefone" valor={clienteDetalhes.telefone} />
              <DetalheCliente titulo="Cidade" valor={clienteDetalhes.cidade || "Não informada"} />
              <DetalheCliente titulo="Endereço" valor={clienteDetalhes.endereco || "Não informado"} />
              <DetalheCliente titulo="Serviço" valor={clienteDetalhes.tipoServico || "Não informado"} />
              <DetalheCliente titulo="Origem" valor={clienteDetalhes.origem || "Não informada"} />
              <DetalheCliente titulo="Status" valor={clienteDetalhes.status} />
              <DetalheCliente
                titulo="Próximo retorno"
                valor={
                  clienteDetalhes.retornoEm
                    ? formatarData(clienteDetalhes.retornoEm)
                    : "Ainda não agendado"
                }
                destaque={Boolean(clienteDetalhes.retornoEm)}
              />
              <DetalheCliente
                titulo="Observações"
                valor={clienteDetalhes.observacoes || "Nenhuma observação"}
              />
            </div>

            <button
              type="button"
              onClick={() => setClienteDetalhes(null)}
              className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function LinhaEtapas({
  etapas,
  clientesFiltrados,
  clienteArrastado,
  iniciarArraste,
  permitirSoltar,
  soltarNaEtapa,
  alterarStatus,
  setClienteDetalhes,
  prepararMensagemFollowUp,
}: {
  etapas: StatusCliente[];
  clientesFiltrados: Cliente[];
  clienteArrastado: string | null;
  iniciarArraste: (evento: DragEvent<HTMLElement>, clienteId: string) => void;
  permitirSoltar: (evento: DragEvent<HTMLDivElement>) => void;
  soltarNaEtapa: (
    evento: DragEvent<HTMLDivElement>,
    novaEtapa: StatusCliente,
  ) => void;
  alterarStatus: (clienteId: string, novaEtapa: StatusCliente) => void;
  setClienteDetalhes: (cliente: Cliente | null) => void;
  prepararMensagemFollowUp: (cliente: Cliente) => void;
}) {
  const topoRef = useRef<HTMLDivElement | null>(null);
  const conteudoRef = useRef<HTMLDivElement | null>(null);
  const sincronizando = useRef(false);

  function sincronizar(
    origem: "topo" | "conteudo",
    valor: number,
  ) {
    if (sincronizando.current) return;
    sincronizando.current = true;

    const destino =
      origem === "topo" ? conteudoRef.current : topoRef.current;

    if (destino) destino.scrollLeft = valor;

    requestAnimationFrame(() => {
      sincronizando.current = false;
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-2">
      <div
        ref={topoRef}
        onScroll={(evento) =>
          sincronizar("topo", evento.currentTarget.scrollLeft)
        }
        className="overflow-x-auto pb-2"
      >
        <div className="h-2 min-w-[1050px] 2xl:min-w-0" />
      </div>

      <div
        ref={conteudoRef}
        onScroll={(evento) =>
          sincronizar("conteudo", evento.currentTarget.scrollLeft)
        }
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="grid min-w-[1050px] grid-cols-5 gap-2.5 2xl:min-w-0">
          {etapas.map((etapa) => {
            const clientesDaEtapa = clientesFiltrados.filter(
              (cliente) => cliente.status === etapa,
            );

            const etapaSolar = ETAPAS_SOLAR.includes(etapa);

            return (
              <div
                key={etapa}
                onDragOver={permitirSoltar}
                onDrop={(evento) => soltarNaEtapa(evento, etapa)}
                className={`min-w-0 rounded-2xl border p-2.5 ${
                  etapaSolar
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-zinc-800 bg-black"
                }`}
              >
                <div className="flex min-h-[44px] items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <h3
                      className={`text-xs font-black uppercase leading-tight ${
                        etapaSolar ? "text-blue-300" : "text-yellow-400"
                      }`}
                    >
                      {etapa}
                    </h3>
                    {etapaSolar && (
                      <p className="mt-1 text-[10px] font-bold uppercase text-blue-500">
                        Energia Solar
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                      etapaSolar
                        ? "bg-blue-400 text-black"
                        : "bg-yellow-400 text-black"
                    }`}
                  >
                    {clientesDaEtapa.length}
                  </span>
                </div>

                <div className="mt-2.5 min-h-[150px] space-y-2.5">
                  {clientesDaEtapa.length === 0 ? (
                    <div className="flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-center text-xs text-zinc-600">
                      Arraste um cliente para esta etapa
                    </div>
                  ) : (
                    clientesDaEtapa.map((cliente) => (
                      <article
                        key={cliente.id}
                        draggable
                        onDragStart={(evento) =>
                          iniciarArraste(evento, cliente.id)
                        }
                        className={`cursor-grab rounded-xl border bg-zinc-950 p-2.5 shadow-lg transition active:cursor-grabbing ${
                          clienteArrastado === cliente.id
                            ? "border-yellow-400 opacity-60"
                            : "border-zinc-800 hover:border-yellow-400/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate font-black uppercase text-white">
                              {cliente.nome}
                            </h4>
                            <p className="mt-1 text-xs font-bold text-yellow-400">
                              {cliente.telefone}
                            </p>
                          </div>
                          <span className="text-lg">⋮⋮</span>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-zinc-400">
                          <p>📍 {cliente.cidade || "Cidade não informada"}</p>
                          <p>🛠 {cliente.tipoServico}</p>
                          <p>📣 {cliente.origem}</p>

                          {etapa === "Cliente Ainda Não Decidiu" &&
                            cliente.retornoEm && (
                              <p className="font-bold text-orange-300">
                                ⏰ Retorno do orçamento: {formatarData(cliente.retornoEm)}
                              </p>
                            )}
                        </div>

                        <select
                          value={cliente.status}
                          onChange={(evento) =>
                            alterarStatus(
                              cliente.id,
                              evento.target.value as StatusCliente,
                            )
                          }
                          onClick={(evento) => evento.stopPropagation()}
                          className="mt-3 w-full rounded-lg border border-zinc-700 bg-black px-2 py-2 text-[11px] font-bold text-white outline-none focus:border-yellow-400"
                        >
                          {ETAPAS.map((opcao) => (
                            <option key={opcao} value={opcao}>
                              {opcao}
                            </option>
                          ))}
                        </select>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-yellow-400/50 px-2 py-2 text-[11px] font-black uppercase text-yellow-400"
                          >
                            Proposta
                          </button>

                          <button
                            type="button"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              setClienteDetalhes(cliente);
                            }}
                            className="rounded-lg border border-zinc-700 px-2 py-2 text-[11px] font-black uppercase text-zinc-300"
                          >
                            Detalhes
                          </button>

                          {etapa === "Cliente Ainda Não Decidiu" &&
                            cliente.retornoEm && (
                              <button
                                type="button"
                                onClick={(evento) => {
                                  evento.stopPropagation();
                                  prepararMensagemFollowUp(cliente);
                                }}
                                className="col-span-2 rounded-lg bg-green-600 px-2 py-2.5 text-[11px] font-black uppercase text-white"
                              >
                                💬 Preparar mensagem
                              </button>
                            )}
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

function DetalheCliente({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[140px_1fr]">
      <span className="font-bold uppercase text-zinc-500">{titulo}</span>
      <span className={destaque ? "font-black text-yellow-400" : "font-bold text-zinc-200"}>
        {valor}
      </span>
    </div>
  );
}