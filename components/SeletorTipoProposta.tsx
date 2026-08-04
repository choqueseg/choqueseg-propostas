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
    descricao:
      "Propostas com módulos, inversores, geração e condições de pagamento.",
  },
  {
    id: "seguranca-eletronica",
    icone: "📹",
    titulo: "Segurança Eletrônica",
    descricao:
      "Orçamentos de câmeras, alarmes, cercas elétricas e controle de acesso.",
  },
  {
    id: "eletrica",
    icone: "⚡",
    titulo: "Instalações Elétricas",
    descricao:
      "Orçamentos de instalações, reformas, quadros, iluminação e proteção.",
  },
  {
    id: "automacao",
    icone: "🏠",
    titulo: "Automação",
    descricao:
      "Fechaduras digitais, iluminação inteligente e controle pelo celular.",
  },
  {
    id: "cadastro-produtos",
    icone: "📦",
    titulo: "Cadastro de Produtos",
    descricao:
      "Cadastre, edite e atualize os produtos usados nos orçamentos.",
  },
];

export default function SeletorTipoProposta({ aoSelecionar }: Props) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <img
            src="/imagens/logo/brasao-choqueseg.png"
            alt="Brasão oficial da CHOQUESEG"
            className="mx-auto h-36 w-36 object-contain"
          />

          <h1 className="mt-4 text-4xl font-black uppercase text-yellow-400 md:text-6xl">
            CHOQUESEG
          </h1>

          <p className="mt-3 text-lg font-bold text-white md:text-2xl">
            Da segurança à economia, tudo em um só lugar.
          </p>

          <p className="mt-4 text-zinc-400">
            Escolha o tipo de orçamento que deseja criar.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          {servicos.map((servico) => (
            <button
              key={servico.id}
              type="button"
              onClick={() => aoSelecionar(servico.id)}
              className="group rounded-3xl border border-zinc-700 bg-black p-6 text-left transition hover:-translate-y-1 hover:border-yellow-400"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-3xl">
                  {servico.icone}
                </div>

                <div>
                  <h2 className="text-xl font-black uppercase text-yellow-400 md:text-2xl">
                    {servico.titulo}
                  </h2>

                  <p className="mt-2 leading-relaxed text-zinc-300">
                    {servico.descricao}
                  </p>

                  <span className="mt-4 inline-block text-sm font-black uppercase text-white group-hover:text-yellow-400">
                    Abrir →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>

        <footer className="mt-10 text-center text-sm text-zinc-500">
          Sistema Inteligente CHOQUESEG
        </footer>
      </div>
    </main>
  );
}