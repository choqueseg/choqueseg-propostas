"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  MovimentacaoEstoque,
  ProdutoEstoque,
  TipoMovimentacaoEstoque,
} from "./types";

const supabase = createClient();

const tiposMovimentacao: TipoMovimentacaoEstoque[] = [
  "Entrada",
  "Saída",
  "Ajuste positivo",
  "Ajuste negativo",
];

function movimentacaoBancoParaApp(item: any): MovimentacaoEstoque {
  return {
    id: String(item.id),
    produtoId: String(item.produto_id),
    produtoNome: item.produto_nome ?? "",
    tipo: item.tipo as TipoMovimentacaoEstoque,
    quantidade: Number(item.quantidade ?? 0),
    custoUnitario:
      item.custo_unitario == null ? undefined : Number(item.custo_unitario),
    motivo: item.motivo ?? "",
    servicoId: item.servico_id ? String(item.servico_id) : undefined,
    clienteNome: item.cliente_nome ?? undefined,
    fornecedor: item.fornecedor ?? undefined,
    data: item.data ?? "",
    criadoEm: item.criado_em ?? "",
    criadoPor: item.criado_por ?? "CHOQUESEG PRO",
  };
}

export default function MovimentacoesEstoque({
  produtos,
  aoAtualizarProdutos,
  usuarioNome = "Administrador CHOQUESEG",
}: {
  produtos: ProdutoEstoque[];
  aoAtualizarProdutos: (produtos: ProdutoEstoque[]) => void;
  usuarioNome?: string;
}) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState<TipoMovimentacaoEstoque>("Entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [filtroProduto, setFiltroProduto] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoMovimentacaoEstoque>("Todos");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const { data, error } = await supabase
        .from("estoque_movimentacoes")
        .select("*")
        .order("criado_em", { ascending: false });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar movimentações:", error);
        setMensagem(`Erro ao carregar movimentações: ${error.message}`);
        return;
      }

      setMovimentacoes((data ?? []).map(movimentacaoBancoParaApp));
    }

    void carregar();

    const canal = supabase
      .channel("estoque-movimentacoes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estoque_movimentacoes" },
        () => void carregar(),
      )
      .subscribe();

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
    };
  }, []);

  const produtosAtivos = useMemo(
    () => produtos.filter((produto) => produto.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [produtos],
  );

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoId),
    [produtos, produtoId],
  );

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes
      .filter((movimentacao) => {
        const produtoOk = filtroProduto === "Todos" || movimentacao.produtoId === filtroProduto;
        const tipoOk = filtroTipo === "Todos" || movimentacao.tipo === filtroTipo;
        return produtoOk && tipoOk;
      });
  }, [movimentacoes, filtroProduto, filtroTipo]);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    let ajustesPositivos = 0;
    let ajustesNegativos = 0;

    for (const movimentacao of movimentacoes) {
      if (movimentacao.tipo === "Entrada") entradas += movimentacao.quantidade;
      else if (movimentacao.tipo === "Saída") saidas += movimentacao.quantidade;
      else if (movimentacao.tipo === "Ajuste positivo") ajustesPositivos += movimentacao.quantidade;
      else ajustesNegativos += movimentacao.quantidade;
    }

    return { entradas, saidas, ajustesPositivos, ajustesNegativos };
  }, [movimentacoes]);

  async function salvarMovimentacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const produto = produtos.find((item) => item.id === produtoId);
    const quantidadeNumerica = converterNumero(quantidade);

    if (!produto) return setMensagem("Selecione um produto.");
    if (quantidadeNumerica <= 0) return setMensagem("Informe uma quantidade válida.");
    if (!motivo.trim()) return setMensagem("Informe o motivo da movimentação.");
    if (!data) return setMensagem("Informe a data da movimentação.");

    setSalvando(true);

    const { error } = await supabase.rpc("registrar_movimentacao_estoque", {
      p_produto_id: produto.id,
      p_tipo: tipo,
      p_quantidade: quantidadeNumerica,
      p_motivo: motivo.trim(),
      p_fornecedor: fornecedor.trim() || null,
      p_cliente_nome: clienteNome.trim() || null,
      p_servico_id: null,
      p_criado_por: usuarioNome,
      p_data: data,
    });

    setSalvando(false);

    if (error) {
      console.error("Erro ao registrar movimentação:", error);
      setMensagem(error.message);
      return;
    }

    const aumenta = tipo === "Entrada" || tipo === "Ajuste positivo";
    const produtosAtualizados = produtos.map((item) =>
      item.id === produto.id
        ? {
            ...item,
            quantidadeAtual:
              item.quantidadeAtual + (aumenta ? quantidadeNumerica : -quantidadeNumerica),
          }
        : item,
    );

    aoAtualizarProdutos(produtosAtualizados);
    setProdutoId("");
    setQuantidade("");
    setMotivo("");
    setFornecedor("");
    setClienteNome("");
    setMensagem("Movimentação registrada na nuvem com sucesso.");
  }

  async function excluirMovimentacao(id: string) {
    if (!window.confirm("Excluir somente este registro do histórico? O saldo do estoque não será alterado.")) return;

    const { error } = await supabase
      .from("estoque_movimentacoes")
      .delete()
      .eq("id", id);

    if (error) {
      setMensagem(`Erro ao excluir histórico: ${error.message}`);
      return;
    }

    setMovimentacoes((atuais) => atuais.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-5">
      {mensagem && (
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo titulo="Entradas" valor={resumo.entradas} />
        <CardResumo titulo="Saídas" valor={resumo.saidas} />
        <CardResumo titulo="Ajustes +" valor={resumo.ajustesPositivos} />
        <CardResumo titulo="Ajustes -" valor={resumo.ajustesNegativos} />
      </div>

      <form onSubmit={salvarMovimentacao} className="rounded-2xl border border-zinc-800 bg-black p-4">
        <h3 className="text-lg font-black uppercase text-yellow-400">Nova movimentação</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CampoSelect
            label="Produto"
            valor={produtoId}
            onChange={setProdutoId}
            opcoes={[
              { valor: "", nome: "Selecione um produto" },
              ...produtosAtivos.map((produto) => ({
                valor: produto.id,
                nome: `${produto.nome} — ${produto.quantidadeAtual} ${produto.unidade}`,
              })),
            ]}
          />

          <CampoSelect
            label="Tipo"
            valor={tipo}
            onChange={(valor) => setTipo(valor as TipoMovimentacaoEstoque)}
            opcoes={tiposMovimentacao.map((item) => ({ valor: item, nome: item }))}
          />

          <CampoTexto label="Quantidade" valor={quantidade} onChange={setQuantidade} tipo="number" />
          <CampoTexto label="Data" valor={data} onChange={setData} tipo="date" />
          <CampoTexto label="Motivo" valor={motivo} onChange={setMotivo} placeholder="Ex.: Compra / uso em serviço" />
          <CampoTexto label="Fornecedor" valor={fornecedor} onChange={setFornecedor} placeholder="Opcional" />
          <CampoTexto label="Cliente" valor={clienteNome} onChange={setClienteNome} placeholder="Opcional" />
        </div>

        {produtoSelecionado && (
          <div className="mt-4 rounded-xl border border-yellow-400/20 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
            Estoque atual: <strong className="text-yellow-400">{produtoSelecionado.quantidadeAtual} {produtoSelecionado.unidade}</strong>
            {" · "}Custo: <strong>{formatarMoeda(produtoSelecionado.custoUnitario)}</strong>
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-4 rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black disabled:opacity-50"
        >
          {salvando ? "Registrando..." : "Registrar movimentação"}
        </button>
      </form>

      <section className="rounded-2xl border border-zinc-800 bg-black p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <CampoSelect
            label="Filtrar por produto"
            valor={filtroProduto}
            onChange={setFiltroProduto}
            opcoes={[
              { valor: "Todos", nome: "Todos os produtos" },
              ...produtos.map((produto) => ({ valor: produto.id, nome: produto.nome })),
            ]}
          />
          <CampoSelect
            label="Filtrar por tipo"
            valor={filtroTipo}
            onChange={(valor) => setFiltroTipo(valor as "Todos" | TipoMovimentacaoEstoque)}
            opcoes={[
              { valor: "Todos", nome: "Todos os tipos" },
              ...tiposMovimentacao.map((item) => ({ valor: item, nome: item })),
            ]}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {movimentacoesFiltradas.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
              Nenhuma movimentação encontrada.
            </div>
          ) : (
            movimentacoesFiltradas.map((movimentacao) => (
              <article key={movimentacao.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase ${
                    movimentacao.tipo === "Entrada" || movimentacao.tipo === "Ajuste positivo"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {movimentacao.tipo}
                  </span>
                  <span className="text-xs text-zinc-500">{formatarData(movimentacao.data)}</span>
                </div>

                <h4 className="mt-3 text-sm font-black text-white">{movimentacao.produtoNome}</h4>
                <p className="mt-1 text-xs text-zinc-300">Quantidade: <strong>{movimentacao.quantidade}</strong></p>
                <p className="mt-1 text-xs text-zinc-500">{movimentacao.motivo}</p>
                {movimentacao.clienteNome && <p className="mt-1 text-xs text-zinc-500">Cliente: {movimentacao.clienteNome}</p>}
                <p className="mt-2 text-[11px] text-zinc-600">Por: {movimentacao.criadoPor}</p>

                <button
                  type="button"
                  onClick={() => void excluirMovimentacao(movimentacao.id)}
                  className="mt-3 rounded-lg border border-red-500/40 px-3 py-1.5 text-[11px] font-black uppercase text-red-400"
                >
                  Excluir histórico
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-[11px] font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-2 text-2xl font-black text-yellow-400">{valor}</p>
    </div>
  );
}

function CampoTexto({
  label, valor, onChange, placeholder, tipo = "text",
}: {
  label: string; valor: string; onChange: (valor: string) => void; placeholder?: string; tipo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">{label}</label>
      <input
        type={tipo}
        min={tipo === "number" ? 0 : undefined}
        step={tipo === "number" ? "0.01" : undefined}
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label, valor, onChange, opcoes,
}: {
  label: string; valor: string; onChange: (valor: string) => void; opcoes: Array<{ valor: string; nome: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">{label}</label>
      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.nome}</option>)}
      </select>
    </div>
  );
}

function converterNumero(valor: string) {
  const numero = Number(valor.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${data}T00:00:00`));
}
