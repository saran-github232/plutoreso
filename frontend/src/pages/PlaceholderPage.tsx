import { Container } from "../components/ui/Container";

export interface PlaceholderPageProps {
  title: string;
  description: string;
}

/** Honest stand-in for future content pages (about, FAQ, contact, policies). */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center sm:p-12">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
    </Container>
  );
}
