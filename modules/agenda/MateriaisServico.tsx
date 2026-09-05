"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { MaterialUtilizado } from "./types";

const supabase = createClient();

type ProdutoEstoqueMini = {
  id: string;
  nome: string;
  unidade: string;
  quantidadeAtual: number;
};

type MaterialComEstoque = MaterialUtilizado & {
  produtoId?: string;
  unidade?: string;
};

type Props = {
  materiais: MaterialUtilizado[];
  aoAlterar: (materiais: MaterialUtilizado[]) => void;
  bloqueado?: boolean;
};

export default function MateriaisServico({
  materiais,
  aoAlterar,
  bloqueado,
}: Props) {
  const [produtos, setProdutos] = useState<ProdutoEstoqueMini[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("id,nome,unidade,quantidade_atual,ativo")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar produtos do estoque:", error);
        setProdutos([]);
        return;
      }

      setProdutos(
        (data ?? []).map((item) => ({
          id: String(item.id),
          nome: item.nome ?? "",
          unidade: item.unidade ?? "Unidade",
          quantidadeAtual: Number(item.quantidade_atual ?? 0),
        })),
      );
    }

    void carregarProdutos();

    const canal = supabase
      .channel("materiais-servico-estoque")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estoque_produtos" },
        () => void carregarProdutos(),
      )
      .subscribe();

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
    };
  }, []);

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoId),
    [produtos, produtoId],
  );

  function selecionarProduto(id: string) {
    setProdutoId(id);
    const produto = produtos.find((item) => item.id === id);
    if (produto) setDescricao(produto.nome);
  }

  function adicionar() {
    if (bloqueado || !descricao.trim() || !quantidade.trim()) return;

    const quantidadeNumerica = Number(quantidade.replace(",", "."));

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      setMensagem("Informe uma quantidade válida.");
      return;
    }

    if (produtoSelecionado && quantidadeNumerica > produtoSelecionado.quantidadeAtual) {
      setMensagem(
        `Estoque insuficiente. Disponível: ${produtoSelecionado.quantidadeAtual} ${produtoSelecionado.unidade}.`,
      );
      return;
    }

    const novoMaterial: MaterialComEstoque = {
      id: crypto.randomUUID(),
      descricao: descricao.trim(),
      quantidade: quantidade.trim(),
      observacao: observacao.trim(),
      produtoId: produtoSelecionado?.id,
      unidade: produtoSelecionado?.unidade,
    };

    aoAlterar([...materiais, novoMaterial]);

    setProdutoId("");
    setDescricao("");
    setQuantidade("");
    setObservacao("");
    setMensagem("");
  }

  function remover(id: string) {
    if (bloqueado) return;
    aoAlterar(materiais.filter((material) => material.id !== id));
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-lg font-black uppercase text-yellow-400">
        Materiais utilizados
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Selecione um produto do estoque para que a baixa seja feita automaticamente ao concluir a Ordem de Serviço.
      </p>

      {mensagem && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
          {mensagem}
        </div>
      )}

      {!bloqueado && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
              Produto do estoque
            </label>
            <select
              value={produtoId}
              onChange={(evento) => selecionarProduto(evento.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="">Outro material / não controlar estoque</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} — disponível: {produto.quantidadeAtual} {produto.unidade}
                </option>
              ))}
            </select>
          </div>

          <input
            value={quantidade}
            onChange={(evento) => setQuantidade(evento.target.value)}
            placeholder="Quantidade"
            inputMode="decimal"
            className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />

          <input
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
            placeholder="Observação (opcional)"
            className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />

          {!produtoId && (
            <input
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder="Descrição do material"
              className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400 md:col-span-2"
            />
          )}

          <button
            type="button"
            onClick={adicionar}
            className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
          >
            Adicionar
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {materiais.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
            Nenhum material informado.
          </p>
        ) : (
          materiais.map((material) => {
            const item = material as MaterialComEstoque;

            return (
              <div
                key={material.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-white">
                    {material.descricao} — {material.quantidade}
                    {item.unidade ? ` ${item.unidade}` : ""}
                  </p>

                  {item.produtoId && (
                    <p className="mt-1 text-xs font-bold text-emerald-400">
                      ✓ Vinculado ao estoque — baixa automática na conclusão
                    </p>
                  )}

                  {material.observacao && (
                    <p className="text-sm text-zinc-500">{material.observacao}</p>
                  )}
                </div>

                {!bloqueado && (
                  <button
                    type="button"
                    onClick={() => remover(material.id)}
                    className="text-sm font-black uppercase text-red-400"
                  >
                    Remover
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
