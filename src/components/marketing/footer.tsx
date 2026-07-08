import Image from "next/image";

const LINKS = ["Termos", "Privacidade", "LGPD", "Contato"];

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--ink)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:flex-row sm:justify-between sm:px-6">
        <Image
          src="/nexora-logo.png"
          alt="NEXORA"
          width={120}
          height={38}
          className="object-contain"
        />

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <span key={link} className="font-mono text-xs uppercase tracking-wide text-white/50">
              {link}
            </span>
          ))}
        </nav>

        <div className="text-center font-mono text-xs uppercase tracking-wide text-white/50 sm:text-right">
          <p>CNPJ 00.000.000/0001-00</p>
          <p>Feito no Brasil</p>
        </div>
      </div>
    </footer>
  );
}
