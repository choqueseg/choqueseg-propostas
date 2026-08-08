"use client";

import { ItemChecklist } from "./types";

type Props = {
  itens: ItemChecklist[];
  aoAlterar: (itens: ItemChecklist[]) => void;
  bloqueado?: boolean;
};

export default function ChecklistServico({ itens, aoAlterar, bloqueado }: Props) {
  function alternar(id: string) {
    aoAlterar(
      itens.map((item) =>
        item.id === id ? { ...item, concluido: !item.concluido } : item,
      ),
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-lg font-black uppercase text-yellow-400">
        Checklist técnico
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {itens.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3"
          >
            <input
              type="checkbox"
              checked={item.concluido}
              disabled={bloqueado}
              onChange={() => alternar(item.id)}
              className="h-5 w-5 accent-yellow-400"
            />
            <span className={item.concluido ? "text-zinc-200" : "text-zinc-400"}>
              {item.titulo}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
