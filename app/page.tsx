import Cabecalho from "@/components/Cabecalho";
import FormularioProposta from "@/components/FormularioProposta";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-7">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-yellow-400/30 bg-black shadow-2xl">
        <Cabecalho />
        <FormularioProposta />
      </div>
    </main>
  );
}