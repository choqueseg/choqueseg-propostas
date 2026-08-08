"use client";

import { forwardRef } from "react";

export type InstalacaoPortfolio = {
  foto: string;
  cidade: string;
  descricao: string;
};

export type DadosPreview = {
  nome: string;
  telefone: string;
  cidade: string;
  consumo: string;
  valorConta: string;
  geracao: string;
  potencia: string;
  quantidadeModulos: string;
  marcaModulo: string;
  modeloModulo: string;
  potenciaModulo: string;
  moduloBifacial: boolean;
  quantidadeInversores: string;
  marcaInversor: string;
  modeloInversor: string;
  potenciaInversor: string;
  tipoInversor: "String" | "Microinversor";
  valorProposta: string;
  parcelasCartao: number;
  totalCartao: string;
  parcelaCartao: string;
  parcelasFinanciamento: number;
  totalFinanciamento: string;
  parcelaFinanciamento: string;
  instalacoes: InstalacaoPortfolio[];
};

type PreviewPropostaProps = {
  dados: DadosPreview;
};

const LOGO = "/imagens/logo/brasao-choqueseg.png";
const TELHADO = "/imagens/capa/telhado.solar.png";
const FOTO_EQUIPE = "/imagens/capa/capa.gerador.png";
const WHATSAPP_CHOQUESEG = "5579999390653";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fatoresAracaju = [1.08, 1.06, 1.02, 0.96, 0.88, 0.84, 0.86, 0.91, 0.98, 1.06, 1.17, 1.18];


function numero(valor?: string | number | null) {
  const texto = String(valor ?? "");

  const limpo = texto
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const convertido = Number(limpo);

  return Number.isFinite(convertido) ? convertido : 0;
}


function dinheiro(valor?: number | null) {
  const numeroSeguro = Number(valor ?? 0);
  return (Number.isFinite(numeroSeguro) ? numeroSeguro : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function plural(quantidade: number, singular: string, pluralTexto: string) {
  return quantidade === 1 ? singular : pluralTexto;
}

function textoSeguro(...partes: Array<string | undefined | null>) {
  return partes
    .filter((parte) => Boolean(parte && parte.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const PreviewProposta = forwardRef<HTMLDivElement, PreviewPropostaProps>(
  function PreviewProposta({ dados }, ref) {
    const consumo = Math.max(numero(dados.consumo), 0);
    const geracaoMedia = Math.max(numero(dados.geracao), 0);
    const contaAtual = Math.max(numero(dados.valorConta), 0);
    const investimento = Math.max(numero(dados.valorProposta), 0);

    const quantidadeModulos = Math.max(Math.round(numero(dados.quantidadeModulos)), 0);
    const quantidadeInversores = Math.max(Math.round(numero(dados.quantidadeInversores)), 1);

    const dadosGrafico = meses.map((mes, indice) => ({
      mes,
      consumo,
      geracao: geracaoMedia * fatoresAracaju[indice],
    }));

    const maiorValor = Math.max(
      ...dadosGrafico.flatMap((item) => [item.consumo, item.geracao]),
      1,
    );

    const economiaMensal = contaAtual > 0 ? contaAtual * 0.9 : 0;
    const economiaAnual = economiaMensal * 12;
    const payback =
      economiaAnual > 0 && investimento > 0 ? investimento / economiaAnual : 0;

    const descricaoModulo =
      quantidadeModulos > 0
        ? textoSeguro(
            String(quantidadeModulos).padStart(2, "0"),
            plural(quantidadeModulos, "módulo", "módulos"),
            dados.moduloBifacial
              ? plural(quantidadeModulos, "bifacial", "bifaciais")
              : "",
            dados.marcaModulo,
            dados.modeloModulo,
            dados.potenciaModulo,
          )
        : "—";

    const nomeInversor =
      dados.tipoInversor === "Microinversor"
        ? plural(quantidadeInversores, "microinversor", "microinversores")
        : plural(quantidadeInversores, "inversor", "inversores");

    const descricaoInversor = textoSeguro(
      String(quantidadeInversores).padStart(2, "0"),
      nomeInversor,
      dados.marcaInversor,
      dados.modeloInversor,
      dados.potenciaInversor,
    );

    const mensagemWhatsApp = [
      "Olá, CHOQUESEG! Analisei minha proposta de energia solar e quero fechar o serviço.",
      "",
      `Cliente: ${dados.nome || "Não informado"}`,
      `Cidade: ${dados.cidade || "Não informada"}`,
      `Telefone: ${dados.telefone || "Não informado"}`,
      `Consumo médio: ${dados.consumo ? `${dados.consumo} kWh` : "Não informado"}`,
      `Sistema: ${dados.potencia || "Não informado"}`,
      `Geração estimada: ${dados.geracao ? `${dados.geracao} kWh/mês` : "Não informada"}`,
      `Valor da proposta: ${dados.valorProposta || "Não informado"}`,
      "",
      "Quero dar continuidade ao fechamento.",
    ].join("\n");

    const linkWhatsApp = `https://wa.me/${WHATSAPP_CHOQUESEG}?text=${encodeURIComponent(
      mensagemWhatsApp,
    )}`;

    return (
      <div ref={ref} className="grid items-start gap-5 2xl:grid-cols-2">
        {/* PÁGINA 1 */}
        <Pagina numeroPagina={1} totalPaginas={3}>
          <section className="relative min-h-[315px] overflow-hidden rounded-[24px] border border-yellow-400 bg-black">
            <img
              src={TELHADO}
              alt="Telhado com sistema de energia solar"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <img
              src={FOTO_EQUIPE}
              alt="Profissional da ChoqueSeg apontando para o telhado solar"
              className="absolute bottom-0 right-0 h-full w-[52%] object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/20" />
            <div className="absolute inset-y-0 right-0 w-[52%] bg-gradient-to-l from-black/5 via-transparent to-black/80" />

            <div className="relative z-10 min-h-[315px] p-6 sm:p-8">
              <div className="flex items-start gap-5">
                <img
                  src={LOGO}
                  alt="Brasão oficial da ChoqueSeg"
                  className="h-auto w-[175px] shrink-0 object-contain sm:w-[210px]"
                />

                <div className="pt-3">
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-white">
                    Proposta comercial
                  </p>
                  <h1 className="mt-2 text-5xl font-black uppercase leading-[0.88] text-white sm:text-7xl">
                    Energia
                    <br />
                    Solar
                  </h1>
                </div>
              </div>

              <div className="mt-4 max-w-[86%]">
                <p className="text-2xl font-black leading-tight text-yellow-400 sm:text-3xl">
                  Deixe o Sol pagar pelo seu conforto.
                </p>
                <p className="mt-4 text-2xl font-black text-white sm:text-3xl">
                  {dados.nome || "Nome do cliente"}
                </p>
                <p className="mt-1 text-base font-bold text-zinc-200 sm:text-lg">
                  {[dados.cidade, dados.telefone].filter(Boolean).join(" • ") ||
                    "Cidade • Telefone"}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador titulo="Potência" valor={dados.potencia || "—"} />
            <Indicador titulo="Geração/mês" valor={dados.geracao ? `${dados.geracao} kWh` : "—"} />
            <Indicador
              titulo="Módulos"
              valor={quantidadeModulos ? `${quantidadeModulos} × ${dados.potenciaModulo}` : "—"}
            />
            <Indicador
              titulo={dados.tipoInversor === "Microinversor" ? "Microinversor" : "Inversor"}
              valor={dados.potenciaInversor || "—"}
            />
          </section>

          <section className="mt-4 rounded-[22px] border border-yellow-400 bg-zinc-950 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  Geração x consumo
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white sm:text-3xl">
                  Perfil anual estimado
                </h2>
              </div>
              <div className="flex gap-4 text-xs font-bold text-white">
                <Legenda classe="bg-white" texto="Consumo" />
                <Legenda classe="bg-yellow-400" texto="Geração" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-12 items-end gap-1.5 sm:gap-2">
              {dadosGrafico.map((item) => (
                <div key={item.mes} className="flex min-w-0 flex-col items-center">
                  <div className="mb-1 h-4 text-[9px] font-black text-yellow-400">
                    {Math.round(item.geracao).toLocaleString("pt-BR")}
                  </div>
                  <div className="flex h-[145px] w-full items-end justify-center gap-0.5 sm:gap-1">
                    <Barra altura={(item.consumo / maiorValor) * 100} classe="bg-white" />
                    <Barra altura={(item.geracao / maiorValor) * 100} classe="bg-yellow-400" />
                  </div>
                  <span className="mt-2 text-[10px] font-black uppercase text-white">
                    {item.mes}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.72fr]">
            <div className="rounded-[22px] bg-yellow-400 p-4 text-black">
              <p className="text-xs font-black uppercase tracking-[0.22em]">
                Investimento à vista
              </p>
              <strong className="mt-1 block text-4xl font-black">
                {dados.valorProposta || "—"}
              </strong>
            </div>
            <div className="flex items-center justify-center rounded-[22px] border border-yellow-400 bg-black p-4 text-center">
              <strong className="text-2xl font-black uppercase leading-tight text-yellow-400">
                Economia de até 90%
              </strong>
            </div>
          </section>
        </Pagina>

        {/* PÁGINA 2 */}
        <Pagina numeroPagina={2} totalPaginas={3}>
          <header className="flex items-center justify-between rounded-[22px] bg-black p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                CHOQUESEG
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase text-white">
                Seu investimento, seu retorno
              </h2>
            </div>
            <img
              src={LOGO}
              alt="Brasão oficial da CHOQUESEG"
              className="h-auto w-[88px] object-contain"
            />
          </header>

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metrica titulo="Conta atual" valor={contaAtual > 0 ? dinheiro(contaAtual) : "—"} />
            <Metrica
              titulo="Economia mensal"
              valor={economiaMensal > 0 ? dinheiro(economiaMensal) : "Até 90%"}
            />
            <Metrica
              titulo="Economia anual"
              valor={economiaAnual > 0 ? dinheiro(economiaAnual) : "—"}
            />
            <Metrica titulo="Payback" valor={payback > 0 ? `${payback.toFixed(1)} anos` : "—"} />
          </section>

          <section className="mt-4 rounded-[22px] border border-zinc-300 bg-white p-5 text-zinc-950">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
              O que está incluso na sua instalação
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ItemIncluso texto={descricaoModulo} />
              <ItemIncluso texto={descricaoInversor || "Inversor solar"} />
              <ItemIncluso texto="Estrutura metálica de fixação em alumínio" />
              <ItemIncluso texto="Cabos solares CC e conectores MC4" />
              <ItemIncluso texto="Proteção elétrica no lado CA" />
              <ItemIncluso texto="Instalação completa do sistema fotovoltaico" />
              <ItemIncluso texto="Projeto elétrico e documentação técnica" />
              <ItemIncluso texto="Homologação junto à Energisa" />
              <ItemIncluso texto="Configuração do aplicativo de monitoramento" />
            </div>
          </section>

          <section className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-yellow-400 bg-yellow-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-950">
                Observações importantes
              </p>
              <p className="mt-3 text-sm font-bold leading-relaxed text-zinc-700">
                Padrão de entrada, adequações na instalação elétrica interna da residência
                e eventuais correções estruturais no telhado não estão inclusos nesta proposta
                e são de responsabilidade do cliente.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
                Etapas do seu projeto
              </p>
              <div className="mt-4 space-y-3">
                <EtapaProjeto numero="1" texto="Análise técnica e definição do sistema" />
                <EtapaProjeto numero="2" texto="Projeto elétrico e documentação" />
                <EtapaProjeto numero="3" texto="Homologação junto à Energisa" />
                <EtapaProjeto numero="4" texto="Instalação e configuração do monitoramento" />
                <EtapaProjeto numero="5" texto="Entrega técnica e suporte pós-instalação" />
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[22px] border border-yellow-400 bg-black p-5 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
              Projeto completo, instalação profissional e acompanhamento técnico
            </p>
            <p className="mt-2 text-2xl font-black uppercase text-yellow-400">
              Do orçamento à homologação
            </p>
          </section>
        </Pagina>

        {/* PÁGINA 3 */}
        <Pagina numeroPagina={3} totalPaginas={3}>
          <header className="flex items-center justify-between rounded-[22px] bg-black p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                CHOQUESEG
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase text-white">
                Qualidade que você pode comprovar
              </h2>
            </div>
            <img
              src={LOGO}
              alt="Brasão oficial da CHOQUESEG"
              className="h-auto w-[88px] object-contain"
            />
          </header>

          <section className="mt-4 rounded-[22px] border border-yellow-400 bg-black p-4">
            <p className="mb-4 text-center text-sm font-black uppercase tracking-[0.12em] text-white">
              Algumas instalações
              <span className="block text-yellow-400">realizadas pela CHOQUESEG</span>
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {dados.instalacoes.slice(0, 4).map((instalacao, indice) => (
                <figure
                  key={`${indice}-${instalacao.foto}-${instalacao.cidade || "Local da instalação"}`}
                  className="overflow-hidden rounded-xl border border-yellow-400 bg-zinc-950"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-900">
                    {instalacao.foto ? (
                      <>
                        <img
                          src={instalacao.foto}
                          alt=""
                          className="h-full w-full object-cover object-center"
                          onError={(evento) => {
                            evento.currentTarget.style.display = "none";
                            const substituto =
                              evento.currentTarget.nextElementSibling as HTMLElement | null;
                            if (substituto) substituto.style.display = "flex";
                          }}
                        />
                        <div className="hidden h-full items-center justify-center px-4 text-center text-xs font-black uppercase text-zinc-500">
                          Foto não encontrada. Escolha outra imagem no gerador.
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs font-black uppercase text-zinc-500">
                        Adicione uma foto desta instalação no gerador
                      </div>
                    )}
                  </div>

                  <figcaption className="flex items-start gap-2 border-t border-yellow-400 bg-black px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                      ●
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black leading-tight text-white">
                        {instalacao.cidade || "Local da instalação"}
                      </p>
                      <p className="mt-0.5 text-xs font-bold leading-tight text-yellow-400">
                        {instalacao.descricao ||
                          "Sistema fotovoltaico instalado pela CHOQUESEG"}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="mt-4">
            <h3 className="text-2xl font-black uppercase text-zinc-950">
              Condições de pagamento
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Pagamento
                titulo="Cartão"
                destaque={`${dados.parcelasCartao}x de ${dados.parcelaCartao}`}
                total={`Valor total: ${dados.totalCartao}`}
              />
              <Pagamento
                titulo="Financiamento"
                destaque={`${dados.parcelasFinanciamento}x de ${dados.parcelaFinanciamento}`}
                total={`Valor total: ${dados.totalFinanciamento}`}
              />
            </div>
          </section>

          <section className="mt-4 rounded-[22px] border border-yellow-400 bg-zinc-950 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xl font-black uppercase text-yellow-400">
                  Por que escolher a CHOQUESEG
                </h3>
                <div className="mt-3 space-y-3">
                  <Diferencial texto="Projeto, instalação e homologação completa" />
                  <Diferencial texto="Equipe especializada e atendimento próximo" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black uppercase text-yellow-400">
                  Garantias
                </h3>
                <div className="mt-3 space-y-3">
                  <Diferencial texto="Garantia dos equipamentos conforme o fabricante" />
                  <Diferencial texto="Garantia e suporte técnico da instalação" />
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-4 flex items-center justify-between gap-4 rounded-[22px] bg-black p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black uppercase leading-tight text-yellow-400 sm:text-2xl">
                Vamos deixar o Sol pagar pelo seu conforto?
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:max-w-[340px]">
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black transition hover:scale-[1.02] hover:bg-yellow-300"
                >
                  ✅ Quero fechar com a CHOQUESEG
                </a>

                <a
                  href="https://g.page/r/CTbFpWqrl-nMEBO/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                >
                  ⭐ Avaliar a CHOQUESEG no Google
                </a>
              </div>
              <p className="mt-3 text-base font-bold text-white">
                (79) 9.9939-0653 • @choqueseg
              </p>
            </div>
            <img
              src={LOGO}
              alt="Brasão oficial da CHOQUESEG"
              className="h-auto w-[92px] shrink-0 object-contain"
            />
          </footer>
        </Pagina>
      </div>
    );
  },
);

export default PreviewProposta;

function Pagina({
  children,
  numeroPagina,
  totalPaginas,
}: {
  children: React.ReactNode;
  numeroPagina?: number;
  totalPaginas?: number;
}) {
  return (
    <article
      data-pagina-proposta
      className="relative min-h-[1120px] w-full overflow-hidden rounded-[28px] border border-yellow-400 bg-zinc-100 p-6 shadow-2xl"
    >
      <div className="min-h-[1030px]">
        {children}
      </div>

      {numeroPagina && totalPaginas && (
        <footer className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-zinc-500">
          Página {numeroPagina} de {totalPaginas}
        </footer>
      )}
    </article>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-yellow-400 bg-black p-3 text-center">
      <span className="block text-[10px] font-black uppercase tracking-wide text-zinc-300 sm:text-xs">{titulo}</span>
      <strong className="mt-2 block text-lg font-black text-yellow-400 sm:text-xl">{valor}</strong>
    </div>
  );
}

function Legenda({ classe, texto }: { classe: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${classe}`} />
      {texto}
    </span>
  );
}

function Barra({ altura, classe }: { altura: number; classe: string }) {
  return <div className={`w-[42%] min-w-[4px] rounded-t-sm ${classe}`} style={{ height: `${Math.max(altura, 3)}%` }} />;
}

function Pagamento({ titulo, destaque, total }: { titulo: string; destaque: string; total: string }) {
  return (
    <div className="rounded-[22px] border border-yellow-400 bg-zinc-950 p-5">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">{titulo}</p>
      <strong className="mt-2 block text-2xl font-black text-white">{destaque}</strong>
      <p className="mt-2 text-sm font-bold text-zinc-300">{total}</p>
    </div>
  );
}

function Metrica({ titulo, valor }: { titulo: string; valor: string }) {
  const valorLongo = valor.length >= 11;

  return (
    <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-2xl bg-yellow-400 p-3 text-center text-black">
      <span className="block text-[10px] font-black uppercase leading-tight sm:text-xs">
        {titulo}
      </span>
      <strong
        className={`mt-2 block max-w-full break-words font-black leading-none ${
          valorLongo ? "text-sm sm:text-base" : "text-base sm:text-lg"
        }`}
      >
        {valor}
      </strong>
    </div>
  );
}

function Diferencial({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">✓</span>
      <p className="text-sm font-bold leading-snug text-white sm:text-base">{texto}</p>
    </div>
  );
}

function ItemIncluso({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-zinc-100 px-3 py-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-black">
        ✓
      </span>
      <p className="text-sm font-bold leading-snug text-zinc-900">{texto}</p>
    </div>
  );
}

function EtapaProjeto({ numero, texto }: { numero: string; texto: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-black">
        {numero}
      </span>
      <p className="text-sm font-bold leading-snug text-white">{texto}</p>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="border-b border-zinc-200 pb-3 last:border-b-0">
      <span className="block text-xs font-black uppercase text-zinc-500">{rotulo}</span>
      <strong className="mt-1 block text-base text-zinc-950 sm:text-lg">{valor}</strong>
    </div>
  );
}