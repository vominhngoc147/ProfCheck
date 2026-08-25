import { Header, Footer } from "@/components/header";
import { getDictionary } from "@/i18n";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary();

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer
        disclaimer={dict.footer.disclaimer}
        professorLinkLabel={dict.footer.forProfessors}
      />
    </>
  );
}
