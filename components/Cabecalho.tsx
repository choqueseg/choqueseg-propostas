import Image from "next/image";

const LOGO_SRC = "/imagens/logo/brasao-choqueseg.png";
const CAPA_SRC = "/imagens/capa/capa-gerador.png";

export default function Cabecalho() {
  return (
    <header className="overflow-hidden border-y-2 border-yellow-400 bg-black">
      <div className="grid min-h-[350px] grid-cols-1 lg:grid-cols-[350px_1fr_390px]">
        <div className="flex items-center justify-center px-4 py-5">
          <Image
            src={LOGO_SRC}
            alt="Brasão oficial da ChoqueSeg"
            width={350}
            height={350}
            priority
            unoptimized
            className="h-auto w-[300px] object-contain lg:w-[340px]"
          />
        </div>

        <div className="flex flex-col justify-center px-8 py-10 text-center lg:text-left">
          <h1 className="text-4xl font-black uppercase leading-none tracking-wide text-yellow-400 md:text-5xl">
            Gerador de
            <br />
            Propostas
          </h1>

          <p className="mt-7 text-2xl font-black uppercase tracking-[0.16em] text-white">
            ChoqueSeg
          </p>

          <p className="mt-2 text-base font-medium tracking-[0.16em] text-slate-300">
            Sistemas &amp; Energia Solar
          </p>

          <p className="mt-7 border-l-2 border-yellow-400 pl-4 text-base font-bold text-yellow-400">
            Deixe o Sol pagar pelo seu conforto.
          </p>
        </div>

        <div className="relative hidden min-h-[350px] lg:block">
          <Image
            src={CAPA_SRC}
            alt="Sistema de energia solar ChoqueSeg"
            fill
            sizes="(min-width: 1024px) 390px, 100vw"
            priority
            unoptimized
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
        </div>
      </div>
    </header>
  );
}