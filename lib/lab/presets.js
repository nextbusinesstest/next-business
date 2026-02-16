// lib/lab/presets.js

export const PRESETS = [
  {
    id: "clinic",
    label: "A) Clínica — Reservas / citas",
    brief: {
      business_name: "Clínica Dental Sonrisa Norte",
      sector: "Clínica dental (odontología general y estética)",
      location: "San Sebastián",
      target_audience: "familias y adultos 25–55",
      services: [
        "Limpieza dental y revisiones",
        "Ortodoncia invisible",
        "Implantes dentales",
        "Blanqueamiento dental",
        "Urgencias dentales",
      ],
      goal: {
        primary_goal: "book_appointments",
        conversion_mode: "booking",
        goal_text: "Reservas / citas",
        goal_detail: "",
      },
      tone: "friendly",
      seed: 202,
    },
  },
  {
    id: "saas",
    label: "B) SaaS — Landing / acción única",
    brief: {
      business_name: "FluxDesk",
      sector: "Software de gestión de incidencias (SaaS)",
      location: "Madrid",
      target_audience: "responsables de operaciones en pymes (10–200 empleados)",
      services: [
        "Ticketing y SLA",
        "Automatización de asignación",
        "Integración con email y Teams",
        "Panel de métricas",
        "Base de conocimiento",
      ],
      goal: {
        primary_goal: "single_action",
        conversion_mode: "landing",
        goal_text: "Conversión / Landing (una sola acción)",
        goal_detail: "Solicitar demo",
      },
      tone: "professional",
      seed: 404,
    },
  },
  {
    id: "ecom",
    label: "C) Ecommerce — Vender online",
    brief: {
      business_name: "Kōra Footwear",
      sector: "Zapatillas urbanas (drops y ediciones limitadas)",
      location: "Barcelona",
      target_audience: "jóvenes 18–35, moda urbana, diseño y exclusividad",
      services: [
        "Drops mensuales limitados",
        "Preventa para suscriptores",
        "Envío 24/48h",
        "Cambios y devoluciones",
        "Atención por WhatsApp",
      ],
      goal: {
        primary_goal: "sell_online",
        conversion_mode: "checkout_or_message",
        goal_text: "Vender online",
        goal_detail: "",
      },
      tone: "bold",
      seed: 505,
    },
  },
];
