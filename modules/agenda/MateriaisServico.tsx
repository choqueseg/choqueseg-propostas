"use client";

import { useState } from "react";
import { MaterialUtilizado } from "./types";

type Props = {
  materiais: MaterialUtilizado[];
  aoAlterar: (materiais: MaterialUtilizado[]) => void;
  bloqueado?: boolean;
};

export default function MateriaisServico({ materiais, aoAlterar, bloqueado }: Props) {
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");

  function adicionar() {
    if (bloqueado || !descricao.trim() || !quantidade.trim()) return;

    aoAlterar([
      ...materiais,
      {
        id: crypto.randomUUID(),
        descricao: descricao.trim(),
        quantidade: quantidade.trim(),
        observacao: observacao.trim(),
      },
    ]);

    setDescricao("");
    setQuantidade("");
    setObservacao("");
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
        Este registro ficará preparado para a futura baixa automática no estoque.
      </p>

      {!bloqueado && (
        <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_2fr_auto]">
          <input
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            placeholder="Material"
            className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
          <input
            value={quantidade}
            onChange={(evento) => setQuantidade(evento.target.value)}
            placeholder="Quantidade"
            className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
          <input
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
            placeholder="Observação (opcional)"
            className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
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
          materiais.map((material) => (
            <div
              key={material.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-white">
                  {material.descricao} — {material.quantidade}
                </p>
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
          ))
        )}
      </div>
    </section>
  );
}
