"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function DashboardModule({
  alterarTela,
}: {
  alterarTela: (tela: TelaSistema) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    function carregarClientes() {
      const dadosSalvos = localStorage.getItem(CHAVE_CLIENTES);

      if (!dadosSalvos) {
        setClientes([]);
        return;
      }

      try {
        setClientes(JSON.parse(dadosSalvos) as Cliente[]);
      } catch {
        setClientes([]);
      }
    }

    carregarClientes();

    window.addEventListener("storage", carregarClientes);

    return () => {
      window.removeEventListener("storage", carregarClientes);
    };
  }, []);

  const indicadores = useMemo(() => {
    function contar(status: StatusCliente) {
      return clientes.filter((cliente) => cliente.status === status)
        .length;
    }

    return {
      totalClientes: clientes.length,
      novoContato: contar("Novo Contato"),
      orcamentoSolicitado: contar("Orçamento Solicitado"),
      orcamentoEnviado: contar("Orçamento Enviado"),
      retorno: contar("Retorno em 2 dias"),
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
      detalhe: "Retorno em 2 dias",
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
      detalhe: "Aguardando resposta",
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
            <Atalho
              nome="Novo cliente"
              icone="👤"
              onClick={() => alterarTela("clientes")}
            />

            <Atalho
              nome="Abrir funil"
              icone="📊"
              onClick={() => alterarTela("funil")}
            />

            <Atalho
              nome="Nova proposta"
              icone="📄"
              onClick={() => alterarTela("propostas")}
            />

            <Atalho
              nome="Agenda"
              icone="📅"
              onClick={() => alterarTela("agenda")}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-400/30 bg-black p-5">
          <h3 className="text-xl font-black uppercase text-yellow-400">
            Resumo do funil
          </h3>

          <div className="mt-4 space-y-3">
            <Resumo
              nome="Novo contato"
              valor={indicadores.novoContato}
            />
            <Resumo
              nome="Negociação"
              valor={indicadores.negociacao}
            />
            <Resumo
              nome="Pós-venda"
              valor={indicadores.posVenda}
            />
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

function Resumo({
  nome,
  valor,
}: {
  nome: string;
  valor: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
      <span className="font-bold text-zinc-300">{nome}</span>

      <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-black">
        {valor}
      </span>
    </div>
  );
}