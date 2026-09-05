"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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

type ClienteBanco = {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
  endereco: string | null;
  tipo_servico: string | null;
  origem: string | null;
  observacoes: string | null;
  status: string | null;
  criado_em: string | null;
  retorno_em: string | null;
};

type TelaSistema =
  | "dashboard"
  | "propostas"
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos"
  | "clientes"
  | "funil"
  | "agenda"
  | "funcionarios";

const CHAVE_CLIENTES = "choqueseg-pro-clientes";
const supabase = createClient();

function clienteBancoParaApp(item: ClienteBanco): Cliente {
  return {
    id: item.id,
    nome: item.nome,
    telefone: item.telefone ?? "",
    cidade: item.cidade ?? "",
    endereco: item.endereco ?? "",
    tipoServico: item.tipo_servico ?? "",
    origem: item.origem ?? "",
    observacoes: item.observacoes ?? "",
    status: (item.status ?? "Novo Contato") as StatusCliente,
    criadoEm: item.criado_em ?? new Date().toISOString(),
    retornoEm: item.retorno_em ?? "",
  };
}

function retornoVencido(cliente: Cliente) {
  if (cliente.status === "Retorno em 2 dias") return true;
  if (cliente.status !== "Orçamento Enviado" || !cliente.retornoEm) return false;

  const retorno = new Date(cliente.retornoEm).getTime();
  return Number.isFinite(retorno) && retorno <= Date.now();
}

export default function DashboardModule({
  alterarTela,
}: {
  alterarTela: (tela: TelaSistema) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregarEAtualizarRetornos() {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select(
            "id,nome,telefone,cidade,endereco,tipo_servico,origem,observacoes,status,criado_em,retorno_em",
          )
          .order("criado_em", { ascending: false });

        if (error) throw error;

        let lista = (data ?? []).map((item) =>
          clienteBancoParaApp(item as ClienteBanco),
        );

        const agora = Date.now();
        const vencidos = lista.filter((cliente) => {
          if (cliente.status !== "Orçamento Enviado" || !cliente.retornoEm) {
            return false;
          }

          const retorno = new Date(cliente.retornoEm).getTime();
          return Number.isFinite(retorno) && retorno <= agora;
        });

        if (vencidos.length > 0) {
          const ids = vencidos.map((cliente) => cliente.id);

          const { error: erroAtualizacao } = await supabase
            .from("clientes")
            .update({ status: "Retorno em 2 dias" })
            .in("id", ids);

          if (erroAtualizacao) throw erroAtualizacao;

          lista = lista.map((cliente) =>
            ids.includes(cliente.id)
              ? { ...cliente, status: "Retorno em 2 dias" as StatusCliente }
              : cliente,
          );
        }

        if (!ativo) return;

        setClientes(lista);
        localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(lista));
      } catch (erro) {
        console.error("Erro ao atualizar Dashboard:", erro);

        const dadosSalvos = localStorage.getItem(CHAVE_CLIENTES);

        if (!dadosSalvos || !ativo) {
          if (ativo) setClientes([]);
          return;
        }

        try {
          const listaLocal = JSON.parse(dadosSalvos) as Cliente[];
          const agora = Date.now();

          const listaAtualizada = listaLocal.map((cliente) => {
            if (
              cliente.status === "Orçamento Enviado" &&
              cliente.retornoEm
            ) {
              const retorno = new Date(cliente.retornoEm).getTime();

              if (Number.isFinite(retorno) && retorno <= agora) {
                return {
                  ...cliente,
                  status: "Retorno em 2 dias" as StatusCliente,
                };
              }
            }

            return cliente;
          });

          setClientes(listaAtualizada);
          localStorage.setItem(
            CHAVE_CLIENTES,
            JSON.stringify(listaAtualizada),
          );
        } catch {
          setClientes([]);
        }
      }
    }

    void carregarEAtualizarRetornos();

    const intervalo = window.setInterval(() => {
      void carregarEAtualizarRetornos();
    }, 60_000);

    const aoFocar = () => {
      void carregarEAtualizarRetornos();
    };

    window.addEventListener("focus", aoFocar);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", aoFocar);
    };
  }, []);

  const indicadores = useMemo(() => {
    function contar(status: StatusCliente) {
      return clientes.filter((cliente) => cliente.status === status).length;
    }

    const aguardandoRetorno = clientes.filter(retornoVencido).length;
    const orcamentosEnviadosAguardandoPrazo = clientes.filter(
      (cliente) =>
        cliente.status === "Orçamento Enviado" && !retornoVencido(cliente),
    ).length;

    return {
      totalClientes: clientes.length,
      novoContato: contar("Novo Contato"),
      orcamentoSolicitado: contar("Orçamento Solicitado"),
      orcamentoEnviado: orcamentosEnviadosAguardandoPrazo,
      retorno: aguardandoRetorno,
      negociacao: contar("Negociação"),
      servicoFechado: contar("Serviço Fechado"),
      agendado: contar("Agendado"),
      emExecucao: contar("Em Execução"),
      concluido: contar("Concluído"),
      posVenda: contar("Pós-venda"),
    };
  }, [clientes]);

  const cards = [
    {
      titulo: "Total de clientes",
      valor: indicadores.totalClientes,
      detalhe: "Clientes cadastrados",
      tela: "clientes" as TelaSistema,
      icone: "👥",
    },
    {
      titulo: "Aguardando retorno",
      valor: indicadores.retorno,
      detalhe: "Retorno após 2 dias do envio",
      tela: "funil" as TelaSistema,
      icone: "⏰",
    },
    {
      titulo: "Orçamentos solicitados",
      valor: indicadores.orcamentoSolicitado,
      detalhe: "Precisam de proposta",
      tela: "funil" as TelaSistema,
      icone: "📝",
    },
    {
      titulo: "Orçamentos enviados",
      valor: indicadores.orcamentoEnviado,
      detalhe: "Aguardando prazo de retorno",
      tela: "funil" as TelaSistema,
      icone: "📤",
    },
    {
      titulo: "Serviços fechados",
      valor: indicadores.servicoFechado,
      detalhe: "Aguardando agendamento",
      tela: "funil" as TelaSistema,
      icone: "🤝",
    },
    {
      titulo: "Serviços agendados",
      valor: indicadores.agendado,
      detalhe: "Agenda da equipe",
      tela: "agenda" as TelaSistema,
      icone: "📅",
    },
    {
      titulo: "Em execução",
      valor: indicadores.emExecucao,
      detalhe: "Serviços em andamento",
      tela: "agenda" as TelaSistema,
      icone: "🚚",
    },
    {
      titulo: "Concluídos",
      valor: indicadores.concluido,
      detalhe: "Serviços finalizados",
      tela: "agenda" as TelaSistema,
      icone: "✅",
    },
  ];

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Painel administrativo
        </p>

        <h2 className="mt-1 text-3xl font-black uppercase">
          Dashboard CHOQUESEG PRO
        </h2>

        <p className="mt-2 text-zinc-400">
          Acompanhe clientes, orçamentos e serviços em tempo real.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.titulo}
            type="button"
            onClick={() => alterarTela(card.tela)}
            className="rounded-2xl border border-zinc-800 bg-black p-5 text-left transition hover:border-yellow-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-zinc-400">
                  {card.titulo}
                </p>

                <p className="mt-3 text-4xl font-black text-yellow-400">
                  {card.valor}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  {card.detalhe}
                </p>
              </div>

              <span className="text-3xl">{card.icone}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-zinc-800 bg-black p-5">
          <h3 className="text-xl font-black uppercase text-yellow-400">
            Acessos rápidos
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Atalho nome="Novo cliente" icone="👤" onClick={() => alterarTela("clientes")} />
            <Atalho nome="Abrir funil" icone="📊" onClick={() => alterarTela("funil")} />
            <Atalho nome="Nova proposta" icone="📄" onClick={() => alterarTela("propostas")} />
            <Atalho nome="Agenda" icone="📅" onClick={() => alterarTela("agenda")} />
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-400/30 bg-black p-5">
          <h3 className="text-xl font-black uppercase text-yellow-400">
            Resumo do funil
          </h3>

          <div className="mt-4 space-y-3">
            <Resumo nome="Novo contato" valor={indicadores.novoContato} />
            <Resumo nome="Negociação" valor={indicadores.negociacao} />
            <Resumo nome="Pós-venda" valor={indicadores.posVenda} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Atalho({
  nome,
  icone,
  onClick,
}: {
  nome: string;
  icone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-zinc-950 px-4 py-4 font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
    >
      <span className="text-xl">{icone}</span>
      <span>{nome}</span>
    </button>
  );
}

function Resumo({ nome, valor }: { nome: string; valor: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
      <span className="font-bold text-zinc-300">{nome}</span>
      <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-black">
        {valor}
      </span>
    </div>
  );
}
