"use client";

import { useMemo, useState } from "react";
import { produtosIniciais } from "@/components/produtos";

type ItemOrcamento = {
  id: string;
  produtoId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
};

const produtosSeguranca = produtosIniciais.filter(
  (produto) =>
    produto.categoria === "Segurança Eletrônica" ||
    produto.categoria === "Automação" ||
    produto.categoria === "Mão de Obra",
);

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FormularioSeguranca() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [desconto, setDesconto] = useState(0);

  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  function adicionarProduto() {
    const produto = produtosSeguranca.find(
      (item) => item.id === produtoSelecionado,
    );

    if (!produto) {
      alert("Selecione um produto.");
      return;
    }

    const novoItem: ItemOrcamento = {
      id: `${produto.id}-${Date.now()}`,
      produtoId: produto.id,
      descricao: produto.nome,
      quantidade: 1,
      valorUnitario: produto.valorVenda,
    };

    setItens((anteriores) => [...anteriores, novoItem]);
    setProdutoSelecionado("");
  }

  function atualizarItem(
    id: string,
    campo: "descricao" | "quantidade" | "valorUnitario",
    valor: string,
  ) {
    setItens((anteriores) =>
      anteriores.map((item) => {
        if (item.id !== id) return item;

        if (campo === "descricao") {
          return { ...item, descricao: valor };
        }

        const numero = Number(valor.replace(",", "."));

        return {
          ...item,
          [campo]: Number.isFinite(numero) ? numero : 0,
        };
      }),
    );
  }

  function removerItem(id: string) {
    setItens((anteriores) => anteriores.filter((item) => item.id !== id));
  }

  const totais = useMemo(() => {
    const subtotal = itens.reduce(
      (total, item) => total + item.quantidade * item.valorUnitario,
      0,
    );

    const descontoAplicado = Math.min(Math.max(desconto, 0), subtotal);
    const totalFinal = subtotal - descontoAplicado;

    return {
      subtotal,
      descontoAplicado,
      totalFinal,
    };
  }, [itens, desconto]);

  function limparFormulario() {
    setNome("");
    setTelefone("");
    setCidade("");
    setEndereco("");
    setObservacoes("");
    setProdutoSelecionado("");
    setDesconto(0);
    setItens([]);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-yellow-400/40 bg-black p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-400">
                CHOQUESEG
              </p>

              <h1 className="mt-1 text-2xl font-black uppercase md:text-4xl">
                Orçamento de Segurança Eletrônica
              </h1>
            </div>

            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-black uppercase"
            >
              Limpar
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6 rounded-3xl border border-yellow-400/40 bg-black p-5">
            <section>
              <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
                Dados do cliente
              </h2>

              <div className="space-y-3">
                <Campo
                  titulo="Nome"
                  valor={nome}
                  aoAlterar={setNome}
                />

                <Campo
                  titulo="Telefone"
                  valor={telefone}
                  aoAlterar={setTelefone}
                />

                <Campo
                  titulo="Cidade"
                  valor={cidade}
                  aoAlterar={setCidade}
                />

                <Campo
                  titulo="Endereço"
                  valor={endereco}
                  aoAlterar={setEndereco}
                />
              </div>
            </section>

            <section className="border-t border-zinc-800 pt-5">
              <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
                Adicionar equipamento
              </h2>

              <select
                value={produtoSelecionado}
                onChange={(evento) =>
                  setProdutoSelecionado(evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">Selecione um produto</option>

                {produtosSeguranca.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={adicionarProduto}
                className="mt-3 w-full rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black"
              >
                Adicionar ao orçamento
              </button>
            </section>

            <section className="border-t border-zinc-800 pt-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">
                  Observações
                </span>

                <textarea
                  value={observacoes}
                  onChange={(evento) => setObservacoes(evento.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
                />
              </label>
            </section>
          </aside>

          <section className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="mb-5">
              <h2 className="text-xl font-black uppercase text-yellow-400">
                Itens do orçamento
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Informe quantidade e valor de venda de cada item.
              </p>
            </div>

            {itens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                Nenhum equipamento adicionado.
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item) => {
                  const totalItem =
                    item.quantidade * item.valorUnitario;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px_150px_130px_auto] md:items-end">
                        <Campo
                          titulo="Descrição"
                          valor={item.descricao}
                          aoAlterar={(valor) =>
                            atualizarItem(item.id, "descricao", valor)
                          }
                        />

                        <Campo
                          titulo="Quantidade"
                          valor={String(item.quantidade)}
                          aoAlterar={(valor) =>
                            atualizarItem(item.id, "quantidade", valor)
                          }
                        />

                        <Campo
                          titulo="Valor unitário"
                          valor={String(item.valorUnitario)}
                          aoAlterar={(valor) =>
                            atualizarItem(item.id, "valorUnitario", valor)
                          }
                        />

                        <div>
                          <span className="mb-1.5 block text-sm font-bold">
                            Total
                          </span>

                          <div className="rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-yellow-400">
                            {moeda(totalItem)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerItem(item.id)}
                          className="rounded-xl bg-red-700 px-4 py-3 text-sm font-black uppercase text-white"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 grid gap-4 rounded-3xl border border-yellow-400/40 bg-zinc-900 p-5 md:grid-cols-3">
              <Resumo titulo="Subtotal" valor={moeda(totais.subtotal)} />

              <label>
                <span className="mb-1.5 block text-sm font-bold text-zinc-300">
                  Desconto em reais
                </span>

                <input
                  type="number"
                  min="0"
                  value={desconto}
                  onChange={(evento) =>
                    setDesconto(Number(evento.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-white outline-none focus:border-yellow-400"
                />
              </label>

              <Resumo
                titulo="Valor final"
                valor={moeda(totais.totalFinal)}
                destaque
              />
            </div>

            <div className="mt-6 rounded-3xl border border-yellow-400 bg-yellow-400/10 p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-yellow-400">
                CHOQUESEG
              </p>

              <p className="mt-2 text-lg font-black">
                Da segurança à economia, tudo em um só lugar.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Também trabalhamos com energia solar, instalações elétricas e
                automação residencial.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Campo({
  titulo,
  valor,
  aoAlterar,
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-zinc-200">
        {titulo}
      </span>

      <input
        type="text"
        value={valor}
        autoComplete="off"
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function Resumo({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-zinc-400">{titulo}</p>

      <p
        className={`mt-2 text-xl font-black ${
          destaque ? "text-yellow-400" : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}