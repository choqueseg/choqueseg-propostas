"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  MovimentacaoEstoque,
  ProdutoEstoque,
  TipoMovimentacaoEstoque,
} from "./types";

const CHAVE_MOVIMENTACOES =
  "choqueseg-estoque-movimentacoes";

const tiposMovimentacao: TipoMovimentacaoEstoque[] = [
  "Entrada",
  "Saída",
  "Ajuste positivo",
  "Ajuste negativo",
];

export default function MovimentacoesEstoque({
  produtos,
  aoAtualizarProdutos,
  usuarioNome = "Administrador CHOQUESEG",
}: {
  produtos: ProdutoEstoque[];
  aoAtualizarProdutos: (produtos: ProdutoEstoque[]) => void;
  usuarioNome?: string;
}) {
  const [movimentacoes, setMovimentacoes] = useState<
    MovimentacaoEstoque[]
  >([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] =
    useState<TipoMovimentacaoEstoque>("Entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [data, setData] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [mensagem, setMensagem] = useState("");

  const [filtroProduto, setFiltroProduto] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState<
    "Todos" | TipoMovimentacaoEstoque
  >("Todos");

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(
      CHAVE_MOVIMENTACOES,
    );

    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);

        setMovimentacoes(
          Array.isArray(dados) ? dados : [],
        );
      } catch {
        localStorage.removeItem(CHAVE_MOVIMENTACOES);
        setMovimentacoes([]);
        setMensagem(
          "O histórico de movimentações estava inválido e foi reiniciado.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_MOVIMENTACOES,
      JSON.stringify(movimentacoes),
    );
  }, [movimentacoes, dadosCarregados]);

  const produtosAtivos = useMemo(() => {
    return produtos
      .filter((produto) => produto.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos]);

  const produtoSelecionado = useMemo(() => {
    return produtos.find(
      (produto) => produto.id === produtoId,
    );
  }, [produtos, produtoId]);

  const movimentacoesFiltradas = useMemo(() => {
    return [...movimentacoes]
      .filter((movimentacao) => {
        const atendeProduto =
          filtroProduto === "Todos" ||
          movimentacao.produtoId === filtroProduto;

        const atendeTipo =
          filtroTipo === "Todos" ||
          movimentacao.tipo === filtroTipo;

        return atendeProduto && atendeTipo;
      })
      .sort((a, b) =>
        `${b.data}-${b.criadoEm}`.localeCompare(
          `${a.data}-${a.criadoEm}`,
        ),
      );
  }, [movimentacoes, filtroProduto, filtroTipo]);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    let ajustesPositivos = 0;
    let ajustesNegativos = 0;

    for (const movimentacao of movimentacoes) {
      if (movimentacao.tipo === "Entrada") {
        entradas += movimentacao.quantidade;
      } else if (movimentacao.tipo === "Saída") {
        saidas += movimentacao.quantidade;
      } else if (
        movimentacao.tipo === "Ajuste positivo"
      ) {
        ajustesPositivos += movimentacao.quantidade;
      } else {
        ajustesNegativos += movimentacao.quantidade;
      }
    }

    return {
      entradas,
      saidas,
      ajustesPositivos,
      ajustesNegativos,
    };
  }, [movimentacoes]);

  function salvarMovimentacao(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    setMensagem("");

    const produto = produtos.find(
      (item) => item.id === produtoId,
    );

    const quantidadeNumerica = converterNumero(quantidade);

    if (!produto) {
      setMensagem("Selecione um produto.");
      return;
    }

    if (!quantidadeNumerica || quantidadeNumerica <= 0) {
      setMensagem("Informe uma quantidade válida.");
      return;
    }

    if (!motivo.trim()) {
      setMensagem("Informe o motivo da movimentação.");
      return;
    }

    if (!data) {
      setMensagem("Informe a data da movimentação.");
      return;
    }

    const reduzEstoque =
      tipo === "Saída" || tipo === "Ajuste negativo";

    const aumentaEstoque =
      tipo === "Entrada" || tipo === "Ajuste positivo";

    const novaQuantidade = aumentaEstoque
      ? produto.quantidadeAtual + quantidadeNumerica
      : produto.quantidadeAtual - quantidadeNumerica;

    if (reduzEstoque && novaQuantidade < 0) {
      setMensagem(
        `Estoque insuficiente. Disponível: ${produto.quantidadeAtual} ${produto.unidade}.`,
      );
      return;
    }

    const produtosAtualizados = produtos.map((item) =>
      item.id === produto.id
        ? {
            ...item,
            quantidadeAtual: novaQuantidade,
          }
        : item,
    );

    const novaMovimentacao: MovimentacaoEstoque = {
      id: crypto.randomUUID(),
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo,
      quantidade: quantidadeNumerica,
      custoUnitario: produto.custoUnitario,
      motivo: motivo.trim(),
      clienteNome: clienteNome.trim() || undefined,
      fornecedor:
        fornecedor.trim() ||
        produto.fornecedor ||
        undefined,
      data,
      criadoEm: new Date().toISOString(),
      criadoPor: usuarioNome,
    };

    aoAtualizarProdutos(produtosAtualizados);

    setMovimentacoes((atuais) => [
      novaMovimentacao,
      ...atuais,
    ]);

    setProdutoId("");
    setQuantidade("");
    setMotivo("");
    setFornecedor("");
    setClienteNome("");
    setMensagem("Movimentação registrada com sucesso.");
  }

  function excluirMovimentacao(id: string) {
    const confirmar = window.confirm(
      "Excluir apenas o registro do histórico? Essa ação não altera novamente a quantidade do estoque.",
    );

    if (!confirmar) return;

    setMovimentacoes((atuais) =>
      atuais.filter((item) => item.id !== id),
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div>
        <p className="text-xs font-black uppercase text-yellow-400">
          Entradas e saídas
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Movimentações de estoque
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          Registre compras, materiais utilizados, devoluções e
          ajustes de inventário.
        </p>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Entradas"
          valor={resumo.entradas}
        />

        <CardResumo
          titulo="Saídas"
          valor={resumo.saidas}
        />

        <CardResumo
          titulo="Ajustes positivos"
          valor={resumo.ajustesPositivos}
        />

        <CardResumo
          titulo="Ajustes negativos"
          valor={resumo.ajustesNegativos}
        />
      </div>

      <form
        onSubmit={salvarMovimentacao}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CampoSelect
            label="Produto"
            valor={produtoId}
            onChange={setProdutoId}
            opcoes={[
              {
                valor: "",
                nome: "Selecione um produto",
              },
              ...produtosAtivos.map((produto) => ({
                valor: produto.id,
                nome: `${produto.nome} — estoque: ${produto.quantidadeAtual}`,
              })),
            ]}
          />

          <CampoSelect
            label="Tipo de movimentação"
            valor={tipo}
            onChange={(valor) =>
              setTipo(valor as TipoMovimentacaoEstoque)
            }
            opcoes={tiposMovimentacao.map((item) => ({
              valor: item,
              nome: item,
            }))}
          />

          <CampoTexto
            label="Quantidade"
            valor={quantidade}
            onChange={setQuantidade}
            placeholder="Ex.: 10"
            tipo="number"
          />

          <CampoTexto
            label="Data"
            valor={data}
            onChange={setData}
            tipo="date"
          />

          <CampoTexto
            label="Motivo"
            valor={motivo}
            onChange={setMotivo}
            placeholder="Ex.: Compra de fornecedor"
          />

          <CampoTexto
            label="Fornecedor"
            valor={fornecedor}
            onChange={setFornecedor}
            placeholder="Opcional"
          />

          <CampoTexto
            label="Cliente"
            valor={clienteNome}
            onChange={setClienteNome}
            placeholder="Usado em qual cliente?"
          />
        </div>

        {produtoSelecionado && (
          <div className="mt-4 rounded-xl border border-yellow-400/20 bg-black px-4 py-3 text-sm text-zinc-300">
            Estoque atual:{" "}
            <strong className="text-yellow-400">
              {produtoSelecionado.quantidadeAtual}{" "}
              {produtoSelecionado.unidade}
            </strong>
            {" · "}
            Custo unitário:{" "}
            <strong>
              {formatarMoeda(
                produtoSelecionado.custoUnitario,
              )}
            </strong>
          </div>
        )}

        <button
          type="submit"
          className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
        >
          Registrar movimentação
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoSelect
            label="Filtrar por produto"
            valor={filtroProduto}
            onChange={setFiltroProduto}
            opcoes={[
              {
                valor: "Todos",
                nome: "Todos os produtos",
              },
              ...produtos.map((produto) => ({
                valor: produto.id,
                nome: produto.nome,
              })),
            ]}
          />

          <CampoSelect
            label="Filtrar por tipo"
            valor={filtroTipo}
            onChange={(valor) =>
              setFiltroTipo(
                valor as
                  | "Todos"
                  | TipoMovimentacaoEstoque,
              )
            }
            opcoes={[
              {
                valor: "Todos",
                nome: "Todos os tipos",
              },
              ...tiposMovimentacao.map((item) => ({
                valor: item,
                nome: item,
              })),
            ]}
          />
        </div>

        <div className="mt-6 space-y-3">
          {movimentacoesFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
              Nenhuma movimentação encontrada.
            </div>
          ) : (
            movimentacoesFiltradas.map((movimentacao) => (
              <article
                key={movimentacao.id}
                className="rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                          movimentacao.tipo === "Entrada" ||
                          movimentacao.tipo ===
                            "Ajuste positivo"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {movimentacao.tipo}
                      </span>

                      <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                        {formatarData(movimentacao.data)}
                      </span>
                    </div>

                    <h4 className="mt-3 text-lg font-black text-white">
                      {movimentacao.produtoNome}
                    </h4>

                    <p className="mt-1 text-sm text-zinc-300">
                      Quantidade:{" "}
                      <strong>
                        {movimentacao.quantidade}
                      </strong>
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {movimentacao.motivo}
                    </p>

                    {movimentacao.clienteNome && (
                      <p className="mt-1 text-sm text-zinc-500">
                        Cliente: {movimentacao.clienteNome}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-zinc-600">
                      Registrado por:{" "}
                      {movimentacao.criadoPor}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      excluirMovimentacao(movimentacao.id)
                    }
                    className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                  >
                    Excluir histórico
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-black text-yellow-400">
        {valor}
      </p>
    </div>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  tipo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <input
        type={tipo}
        min={tipo === "number" ? 0 : undefined}
        step={tipo === "number" ? "0.01" : undefined}
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: Array<{
    valor: string;
    nome: string;
  }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.nome}
          </option>
        ))}
      </select>
    </div>
  );
}

function converterNumero(valor: string) {
  const numero = Number(
    valor.replace(/\./g, "").replace(",", "."),
  );

  return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00`));
}