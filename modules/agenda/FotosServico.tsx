"use client";

import { ChangeEvent } from "react";
import { FotoServico } from "./types";

type Props = {
  fotos: FotoServico[];
  aoAlterar: (fotos: FotoServico[]) => void;
  bloqueado?: boolean;
};

const ETAPAS: FotoServico["etapa"][] = ["Antes", "Durante", "Depois"];

function lerArquivo(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result ?? ""));
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });
}

export default function FotosServico({ fotos, aoAlterar, bloqueado }: Props) {
  async function adicionar(
    etapa: FotoServico["etapa"],
    evento: ChangeEvent<HTMLInputElement>,
  ) {
    const arquivos = Array.from(evento.target.files ?? []);
    if (bloqueado || arquivos.length === 0) return;

    try {
      const novasFotos = await Promise.all(
        arquivos.map(async (arquivo) => ({
          id: crypto.randomUUID(),
          etapa,
          nome: arquivo.name,
          dados: await lerArquivo(arquivo),
          criadaEm: new Date().toISOString(),
        })),
      );

      aoAlterar([...fotos, ...novasFotos]);
      evento.target.value = "";
    } catch {
      window.alert("Não foi possível carregar uma das imagens.");
    }
  }

  function remover(id: string) {
    if (bloqueado) return;
    aoAlterar(fotos.filter((foto) => foto.id !== id));
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-lg font-black uppercase text-yellow-400">
        Fotos do serviço
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Evite muitas imagens em alta resolução, pois esta versão salva os dados no navegador.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {ETAPAS.map((etapa) => {
          const fotosDaEtapa = fotos.filter((foto) => foto.etapa === etapa);

          return (
            <div key={etapa} className="rounded-xl border border-zinc-800 bg-black p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-black uppercase text-zinc-200">{etapa}</h4>
                {!bloqueado && (
                  <label className="cursor-pointer rounded-lg bg-yellow-400 px-3 py-2 text-xs font-black uppercase text-black">
                    Adicionar
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={(evento) => adicionar(etapa, evento)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {fotosDaEtapa.length === 0 ? (
                  <p className="col-span-2 py-6 text-center text-sm text-zinc-600">
                    Sem fotos.
                  </p>
                ) : (
                  fotosDaEtapa.map((foto) => (
                    <div key={foto.id} className="relative overflow-hidden rounded-lg border border-zinc-800">
                      <img
                        src={foto.dados}
                        alt={`${etapa}: ${foto.nome}`}
                        className="h-28 w-full object-cover"
                      />
                      {!bloqueado && (
                        <button
                          type="button"
                          onClick={() => remover(foto.id)}
                          className="absolute right-1 top-1 rounded bg-black/80 px-2 py-1 text-xs font-black text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
