"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Proposta = {
  id: string;
  cliente_id?: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_cidade: string | null;
  tipo_proposta: string | null;
  valor_total: number | null;
  status: string | null;
  criada_em: string | null;
  atualizada_em: string | null;
};

function moeda(valor: number | null) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function nomeTipo(tipo: string | null) {
  const valor = String(tipo ?? "").trim().toLowerCase();

  if (valor === "energia_solar" || valor === "energia-solar") {
    return "Energia Solar";
  }

  if (
    valor === "seguranca_eletronica" ||
    valor === "seguranca-eletronica"
  ) {
    return "Segurança Eletrônica";
  }

  if (valor === "eletrica" || valor === "instalacoes_eletricas") {
    return "Instalações Elétricas";
  }

  if (valor === "automacao") {
    return "Automação";
  }

  return tipo || "Não informado";
}

function formatarData(data: string | null) {
  if (!data) return "Data não informada";

  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return data;

  return valor.toLocaleString("pt-BR");
}

type Props = {
  aoAbrirProposta: (proposta: Proposta) => void;
};

export default function HistoricoPropostas({ aoAbrirProposta }: Props) {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarPropostas() {
    try {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("propostas")
        .select(
          "id,cliente_id,cliente_nome,cliente_telefone,cliente_cidade,tipo_proposta,valor_total,status,criada_em,atualizada_em",
        )
        .order("criada_em", { ascending: false });

      if (error) throw error;

      setPropostas((data ?? []) as Proposta[]);
    } catch (e) {
      console.error("Erro ao carregar histórico de propostas:", e);
      setErro(
        e instanceof Error
          ? `Não foi possível carregar o histórico: ${e.message}`
          : "Não foi possível carregar o histórico de propostas.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarPropostas();
  }, []);

  const tiposDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        propostas
          .map((item) => item.tipo_proposta)
          .filter((item): item is string => Boolean(item)),
      ),
    );
  }, [propostas]);

  const statusDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        propostas
          .map((item) => item.status)
          .filter((item): item is string => Boolean(item)),
      ),
    );
  }, [propostas]);

  const propostasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return propostas.filter((item) => {
      const atendeBusca =
        !termo ||
        String(item.cliente_nome ?? "").toLowerCase().includes(termo) ||
        String(item.cliente_telefone ?? "").toLowerCase().includes(termo) ||
        String(item.cliente_cidade ?? "").toLowerCase().includes(termo) ||
        String(item.id ?? "").toLowerCase().includes(termo);

      const atendeTipo =
        tipo === "todos" || String(item.tipo_proposta ?? "") === tipo;

      const atendeStatus =
        status === "todos" || String(item.status ?? "") === status;

      return atendeBusca && atendeTipo && atendeStatus;
    });
  }, [propostas, busca, tipo, status]);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-7">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-yellow-400/30 bg-black p-5 md:p-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-yellow-400">
            CHOQUESEG PRO
          </p>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase">
                Histórico de Propostas
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Consulte as propostas salvas na plataforma.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void carregarPropostas()}
              className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400"
            >
              Atualizar
            </button>
          </div>
        </header>

        <section className="mt-5 grid gap-3 rounded-3xl border border-zinc-800 bg-black p-4 md:grid-cols-[1fr_220px_180px]">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente, telefone, cidade ou código..."
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
          >
            <option value="todos">Todos os tipos</option>
            {tiposDisponiveis.map((item) => (
              <option key={item} value={item}>
                {nomeTipo(item)}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
          >
            <option value="todos">Todos os status</option>
            {statusDisponiveis.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </section>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            {propostasFiltradas.length} proposta(s) encontrada(s)
          </p>
        </div>

        {carregando ? (
          <div className="mt-5 rounded-3xl border border-zinc-800 bg-black p-10 text-center font-bold text-zinc-400">
            Carregando propostas...
          </div>
        ) : erro ? (
          <div className="mt-5 rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300">
            {erro}
          </div>
        ) : propostasFiltradas.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-zinc-700 bg-black p-10 text-center text-zinc-500">
            Nenhuma proposta encontrada.
          </div>
        ) : (
          <section className="mt-5 space-y-3">
            {propostasFiltradas.map((proposta) => (
              <article
                key={proposta.id}
                className="rounded-2xl border border-zinc-800 bg-black p-4 transition hover:border-yellow-400/50 md:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black uppercase text-white">
                        {proposta.cliente_nome || "Cliente não informado"}
                      </h2>

                      <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-400">
                        {nomeTipo(proposta.tipo_proposta)}
                      </span>

                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black uppercase text-zinc-300">
                        {proposta.status || "Sem status"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm text-zinc-400 sm:grid-cols-2">
                      <p>
                        Telefone:{" "}
                        <strong className="text-zinc-200">
                          {proposta.cliente_telefone || "Não informado"}
                        </strong>
                      </p>
                      <p>
                        Cidade:{" "}
                        <strong className="text-zinc-200">
                          {proposta.cliente_cidade || "Não informada"}
                        </strong>
                      </p>
                      <p>
                        Criada em:{" "}
                        <strong className="text-zinc-200">
                          {formatarData(proposta.criada_em)}
                        </strong>
                      </p>
                      <p className="truncate">
                        Código:{" "}
                        <strong className="text-zinc-200">{proposta.id}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:items-end">
                    <div className="rounded-2xl bg-yellow-400 px-4 py-3 text-right text-black">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                        Valor
                      </p>
                      <p className="text-xl font-black">
                        {moeda(proposta.valor_total)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => aoAbrirProposta(proposta)}
                      className="w-full rounded-xl border border-yellow-400 px-4 py-2 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black md:w-auto"
                    >
                      ✏️ Abrir / Editar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
