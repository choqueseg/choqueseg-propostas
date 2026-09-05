"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const LINK_AVALIACAO_GOOGLE =
  "https://g.page/r/CTbFpWqrl-nMEBO/review";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  tipoServico: string;
};

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function normalizarWhatsApp(valor: string) {
  const numeros = somenteNumeros(valor);

  if (!numeros) return "";

  if (numeros.startsWith("55") && numeros.length >= 12) {
    return numeros;
  }

  if (numeros.length === 10 || numeros.length === 11) {
    return `55${numeros}`;
  }

  return numeros;
}

function montarMensagem(nomeCliente: string) {
  const primeiroNome = nomeCliente.trim()
    ? `, ${nomeCliente.trim().split(/\s+/)[0]}`
    : "";

  return (
    `Olá${primeiroNome}!\n\n` +
    `A CHOQUESEG agradece pela confiança em nosso trabalho.\n\n` +
    `Sua avaliação é muito importante para nós e ajuda outras pessoas a conhecerem nosso trabalho.\n\n` +
    `Se você ficou satisfeito com nosso serviço, clique nas 5 estrelas e deixe uma breve opinião sobre sua experiência com a CHOQUESEG.\n\n` +
    `${LINK_AVALIACAO_GOOGLE}\n\n` +
    `Muito obrigado pela confiança!\n` +
    `Equipe CHOQUESEG`
  );
}

export default function AvaliacaoGoogleModule() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState(() => montarMensagem(""));

  useEffect(() => {
    let ativo = true;

    async function carregarClientes() {
      try {
        setCarregando(true);
        setErro("");

        const { data, error } = await supabase
          .from("clientes")
          .select("id,nome,telefone,status,tipo_servico")
          .order("nome", { ascending: true });

        if (!ativo) return;
        if (error) throw error;

        setClientes(
          (data ?? []).map((item) => ({
            id: String(item.id),
            nome: item.nome ?? "",
            telefone: item.telefone ?? "",
            status: item.status ?? "",
            tipoServico: item.tipo_servico ?? "",
          })),
        );
      } catch (e) {
        if (!ativo) return;

        console.error("Erro ao carregar clientes para avaliação:", e);
        setErro(
          e instanceof Error
            ? `Não foi possível carregar os clientes: ${e.message}`
            : "Não foi possível carregar os clientes.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarClientes();

    const canal = supabase
      .channel("avaliacoes-google-clientes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clientes",
        },
        () => {
          void carregarClientes();
        },
      )
      .subscribe();

    const recarregarAoVoltar = () => {
      if (document.visibilityState === "visible") {
        void carregarClientes();
      }
    };

    window.addEventListener("focus", recarregarAoVoltar);
    document.addEventListener("visibilitychange", recarregarAoVoltar);

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
      window.removeEventListener("focus", recarregarAoVoltar);
      document.removeEventListener("visibilitychange", recarregarAoVoltar);
    };
  }, []);

  useEffect(() => {
    setMensagem(montarMensagem(nome));
  }, [nome]);

  const clientesPosVenda = useMemo(
    () =>
      clientes
        .filter((cliente) => cliente.status === "Pós-venda")
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [clientes],
  );

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const listaOrdenada = [...clientes].sort((a, b) => {
      const prioridadeA = a.status === "Pós-venda" ? 0 : 1;
      const prioridadeB = b.status === "Pós-venda" ? 0 : 1;

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }

      return a.nome.localeCompare(b.nome);
    });

    if (!termo) return listaOrdenada;

    return listaOrdenada.filter((cliente) => {
      return (
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.telefone.toLowerCase().includes(termo) ||
        cliente.tipoServico.toLowerCase().includes(termo) ||
        cliente.status.toLowerCase().includes(termo)
      );
    });
  }, [clientes, busca]);

  function selecionarCliente(id: string) {
    setClienteId(id);

    const cliente = clientes.find((item) => item.id === id);

    if (!cliente) {
      setNome("");
      setTelefone("");
      return;
    }

    setNome(cliente.nome);
    setTelefone(cliente.telefone);
  }

  function limparSelecao() {
    setClienteId("");
    setNome("");
    setTelefone("");
    setBusca("");
    setMensagem(montarMensagem(""));
  }

  function enviarAvaliacao() {
    const numero = normalizarWhatsApp(telefone);

    if (!numero || numero.length < 12) {
      alert("Digite um telefone válido com DDD.");
      return;
    }

    if (!mensagem.trim()) {
      alert("Digite a mensagem que será enviada.");
      return;
    }

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-7">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-yellow-400/30 bg-black p-5 md:p-7">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-yellow-400">
            CHOQUESEG PRO
          </p>

          <h1 className="mt-2 text-3xl font-black uppercase md:text-4xl">
            ⭐ Avaliações Google
          </h1>

          <p className="mt-3 max-w-3xl text-zinc-400">
            Clientes que chegarem ao Pós-venda no Funil aparecem
            automaticamente aqui. A mensagem continua editável e o envio
            permanece sob sua confirmação no WhatsApp.
          </p>
        </header>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-black p-5 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black uppercase text-yellow-400">
                Clientes em pós-venda
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Prioridade para solicitar avaliação.
              </p>
            </div>

            <span className="w-fit rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-black">
              {clientesPosVenda.length}
            </span>
          </div>

          {clientesPosVenda.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
              Nenhum cliente em Pós-venda no momento.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {clientesPosVenda.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => selecionarCliente(cliente.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    clienteId === cliente.id
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-zinc-800 bg-zinc-950 hover:border-yellow-400/50"
                  }`}
                >
                  <p className="font-black uppercase text-white">
                    {cliente.nome}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {cliente.tipoServico || "Serviço não informado"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-yellow-400">
                    {cliente.telefone || "Sem telefone"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800 bg-black p-5 md:p-7">
          <div>
            <label className="mb-2 block text-sm font-black uppercase text-zinc-300">
              Buscar cliente cadastrado
            </label>

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite nome, telefone, serviço ou status..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-black uppercase text-zinc-300">
              Cliente
            </label>

            <select
              value={clienteId}
              onChange={(e) => selecionarCliente(e.target.value)}
              disabled={carregando}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="">
                {carregando
                  ? "Carregando clientes..."
                  : "Selecione um cliente ou digite o telefone abaixo"}
              </option>

              {clientesFiltrados.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.status === "Pós-venda" ? "⭐ " : ""}
                  {cliente.nome} — {cliente.telefone || "sem telefone"} —{" "}
                  {cliente.status || "sem status"}
                </option>
              ))}
            </select>
          </div>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {erro}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black uppercase text-zinc-300">
                Nome do cliente
              </label>

              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black uppercase text-zinc-300">
                Telefone / WhatsApp
              </label>

              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex.: (79) 99999-9999"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-black uppercase text-yellow-400">
              Mensagem do WhatsApp — editável
            </label>

            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={10}
              className="w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm leading-relaxed text-zinc-200 outline-none focus:border-yellow-400"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={enviarAvaliacao}
              className="rounded-xl bg-green-600 px-5 py-4 font-black uppercase text-white transition hover:bg-green-500"
            >
              💬 Abrir WhatsApp com avaliação
            </button>

            <button
              type="button"
              onClick={limparSelecao}
              className="rounded-xl border border-zinc-600 px-5 py-4 font-black uppercase text-zinc-200 transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Limpar
            </button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            O sistema apenas abre a conversa com a mensagem pronta. O envio
            continua sob sua confirmação no WhatsApp.
          </p>
        </section>
      </div>
    </main>
  );
}
