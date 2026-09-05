"use client";

import { useState } from "react";
import { ItemChecklist } from "./types";

type Props = {
  itens: ItemChecklist[];
  aoAlterar: (itens: ItemChecklist[]) => void;
  bloqueado?: boolean;
  tipoServico?: string;
  aoSairDaEmpresa?: () => void;
  podeSair?: boolean;
  saidaRegistrada?: boolean;
};

function normalizar(valor?: string) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function descricaoDoItem(titulo: string, tipoServico?: string) {
  const tituloNormalizado = normalizar(titulo);
  const tipo = normalizar(tipoServico);

  if (tituloNormalizado.includes("ferrament")) {
    return "Verificar se todas as ferramentas necessárias estão na caixa.";
  }

  if (tituloNormalizado.includes("escada")) {
    return "Conferir a escada e se está em boas condições para uso.";
  }

  if (tituloNormalizado.includes("capacete")) {
    return "Conferir capacete e os EPIs necessários para o serviço.";
  }

  if (tituloNormalizado.includes("fio") || tituloNormalizado.includes("cabo")) {
    return "Verificar fios e cabos de acordo com o serviço programado.";
  }

  if (tituloNormalizado.includes("material de acordo")) {
    if (tipo.includes("seguranca") || tipo.includes("cftv") || tipo.includes("camera")) {
      return "Segurança Eletrônica: verificar todos os equipamentos e acessórios que serão instalados.";
    }

    if (tipo.includes("casa inteligente") || tipo.includes("automacao")) {
      return "Casa Inteligente: verificar todos os dispositivos, módulos, sensores e acessórios que serão instalados.";
    }

    if (tipo.includes("eletrica")) {
      return "Elétrica: verificar todos os materiais, cabos, proteções e acessórios previstos para o serviço.";
    }

    if (tipo.includes("solar")) {
      return "Energia Solar: verificar todos os equipamentos e materiais previstos para a instalação antes da saída.";
    }

    return "Verificar todos os equipamentos e materiais previstos para o serviço.";
  }

  if (tituloNormalizado.includes("agua") || tituloNormalizado.includes("almoco")) {
    return "Não sair sem água, almoço e o material de acabamento necessário (cimento e gesso).";
  }

  return "";
}

export default function ChecklistServico({
  itens,
  aoAlterar,
  bloqueado = false,
  tipoServico,
  aoSairDaEmpresa,
  podeSair = false,
  saidaRegistrada = false,
}: Props) {
  const [novoItem, setNovoItem] = useState("");

  function alternar(id: string) {
    if (bloqueado) return;

    aoAlterar(
      itens.map((item) =>
        item.id === id ? { ...item, concluido: !item.concluido } : item,
      ),
    );
  }

  function adicionarItem() {
    const titulo = novoItem.trim();
    if (bloqueado || !titulo) return;

    const jaExiste = itens.some(
      (item) => item.titulo.trim().toLowerCase() === titulo.toLowerCase(),
    );

    if (jaExiste) {
      window.alert("Esse item já existe no checklist.");
      return;
    }

    aoAlterar([
      ...itens,
      {
        id: `extra-${crypto.randomUUID()}`,
        titulo,
        concluido: false,
      },
    ]);

    setNovoItem("");
  }

  function removerItem(id: string) {
    if (bloqueado || !id.startsWith("extra-")) return;
    aoAlterar(itens.filter((item) => item.id !== id));
  }

  const concluidos = itens.filter((item) => item.concluido).length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-black p-5">
      <h3 className="text-lg font-black uppercase text-yellow-400">
        Checklist de saída
      </h3>
      <p className="mt-1 text-sm text-zinc-400">
        Confira os itens abaixo antes de sair da empresa.
      </p>

      <div className="mt-5 space-y-3">
        {itens.map((item) => {
          const descricao = descricaoDoItem(item.titulo, tipoServico);

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4"
            >
              <input
                type="checkbox"
                checked={item.concluido}
                disabled={bloqueado}
                onChange={() => alternar(item.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-yellow-400"
              />

              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-200">{item.titulo}</p>
                {descricao && (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    {descricao}
                  </p>
                )}
              </div>

              {item.id.startsWith("extra-") && !bloqueado && (
                <button
                  type="button"
                  onClick={() => removerItem(item.id)}
                  className="shrink-0 text-xs font-black uppercase text-red-400"
                >
                  Remover
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!bloqueado && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={novoItem}
            onChange={(evento) => setNovoItem(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                adicionarItem();
              }
            }}
            placeholder="Adicionar outro item..."
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
          />
          <button
            type="button"
            onClick={adicionarItem}
            disabled={!novoItem.trim()}
            className="rounded-xl border border-yellow-400 px-5 py-3 font-black uppercase text-yellow-400 disabled:opacity-40"
          >
            + Adicionar item
          </button>
        </div>
      )}

      {aoSairDaEmpresa && (
        <div className="mt-5 border-t border-zinc-800 pt-5">
          <button
            type="button"
            onClick={aoSairDaEmpresa}
            disabled={!podeSair || saidaRegistrada}
            className="w-full rounded-xl bg-yellow-400 px-5 py-4 text-base font-black uppercase text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saidaRegistrada ? "Saída registrada" : "Sair da empresa"}
          </button>

          {!saidaRegistrada && !podeSair && (
            <p className="mt-2 text-center text-xs font-bold text-zinc-500">
              Todos os itens devem ser conferidos para liberar a saída.
            </p>
          )}

          <p className="mt-2 text-center text-xs text-zinc-600">
            {concluidos}/{itens.length} itens conferidos
          </p>
        </div>
      )}
    </section>
  );
}
