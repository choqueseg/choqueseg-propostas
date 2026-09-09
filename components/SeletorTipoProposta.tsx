"use client";

export type TipoProposta =
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos";

type Props = {
  aoSelecionar: (tipo: TipoProposta) => void;
};

const servicos: {
  id: TipoProposta;
  icone: string;
  titulo: string;
  descricao: string;
}[] = [
  {
    id: "energia-solar",
    icone: "☀️",
    titulo: "Energia Solar",
    descricao: "Módulos, inversores, geração e condições de pagamento.",
  },
  {
    id: "seguranca-eletronica",
    icone: "📹",
    titulo: "Segurança Eletrônica",
    descricao: "Câmeras, alarmes, cercas elétricas e controle de acesso.",
  },
  {
    id: "eletrica",
    icone: "⚡",
    titulo: "Instalações Elétricas",
    descricao: "Instalações, reformas, QDC, iluminação e proteção.",
  },
  {
    id: "automacao",
    icone: "🏠",
    titulo: "Automação / Casa Inteligente",
    descricao: "Fechaduras, iluminação inteligente e controle pelo celular.",
  },
  {
    id: "cadastro-produtos",
    icone: "📦",
    titulo: "Cadastro de Produtos",
    descricao: "Cadastre, edite e atualize os produtos usados nas propostas.",
  },
];

export default function SeletorTipoProposta({ aoSelecionar }: Props) {
  return (
    <main className="px-3 py-4 md:px-5 md:py-5">
      <section className="grid gap-3 md:grid-cols-2">
        {servicos.map((servico) => (
          <button
            key={servico.id}
            type="button"
            onClick={() => aoSelecionar(servico.id)}
            className="tema-card group rounded-2xl border border-zinc-700 bg-black p-4 text-left transition hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-yellow-400/40 bg-yellow-400/10 text-2xl md:h-14 md:w-14">
                {servico.icone}
              </div>

              <div className="min-w-0">
                <h2 className="tema-titulo text-base font-black uppercase text-yellow-400 md:text-lg">
                  {servico.titulo}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400 md:text-sm">
                  {servico.descricao}
                </p>
                <span className="mt-2 inline-block text-xs font-black uppercase text-yellow-400">
                  Abrir →
                </span>
              </div>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}
