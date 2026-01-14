import { useMemo } from "react";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";

import Hero from "./modules/Hero";
import Cards from "./modules/Cards";
import Bullets from "./modules/Bullets";
import ServicesGrid from "./modules/ServicesGrid";
import TextSection from "./modules/TextSection";
import ContactSection from "./modules/ContactSection";

function byId(modules, ref) {
  if (!ref) return null;
  if (typeof ref === "string") return modules?.[ref] || null;
  return ref;
}

function SectionRenderer({ section, modules }) {
  const { module, variant, props_ref } = section || {};
  const props = byId(modules, props_ref);

  if (!module) return null;

  // HERO
  if (module === "hero") {
    return <Hero variant={variant} {...props} />;
  }

  // CARDS (categories, etc.)
  if (module === "cards") {
    return <Cards variant={variant} {...props} />;
  }

  // BULLETS (benefits, etc.)
  if (module === "bullets") {
    return <Bullets variant={variant} {...props} />;
  }

  // SERVICES GRID
  if (module === "services_grid") {
    return <ServicesGrid variant={variant} {...props} />;
  }

  // TEXT
  if (module === "text") {
    return <TextSection variant={variant} {...props} />;
  }

  // CONTACT
  if (module === "contact") {
    return <ContactSection variant={variant} {...props} />;
  }

  return null;
}

export default function PacksRouter({ spec }) {
  const layout = spec?.layout || {};
  const modules = spec?.modules || {};
  const page = layout?.pages?.home || {};
  const sections = page?.sections || [];

  const headerVariant = layout?.header_variant || "header_minimal_v1";
  const footerVariant = layout?.footer_variant || "footer_simple_v1";

  // Para que header/footer tengan acceso a datos de negocio/contacto
  const headerProps = useMemo(() => {
    return {
      variant: headerVariant,
      business: spec?.business || {},
      brand: spec?.brand || {},
      navigation: spec?.navigation || { items: [], ctas: {} },
      contact: spec?.contact || {},
    };
  }, [headerVariant, spec]);

  const footerProps = useMemo(() => {
    return {
      variant: footerVariant,
      business: spec?.business || {},
      brand: spec?.brand || {},
      contact: spec?.contact || {},
      navigation: spec?.navigation || { items: [], ctas: {} },
      strategy: spec?.strategy || {},
    };
  }, [footerVariant, spec]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header {...headerProps} />

      <main className="flex-1">
        {sections.map((section, idx) => (
          <SectionRenderer key={`${section?.module || "section"}-${idx}`} section={section} modules={modules} />
        ))}
      </main>

      <Footer {...footerProps} />
    </div>
  );
}
