"use client";

import { useState, type FormEvent } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function scrollToForm() {
  document.getElementById("form")?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base text-fg">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <VideoSection />
        <FormSection />
      </main>
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-base/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo className="h-7 w-auto text-fg" />
        <Button
          size="sm"
          onClick={scrollToForm}
          className="uppercase font-bold"
        >
          SOLICITAR ACCESO
        </Button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12 md:gap-16">
      {/* Copy */}
      <div className="flex-1 flex flex-col items-start gap-6">
        <span className="text-label font-medium uppercase tracking-widest text-action">
          Acceso anticipado
        </span>
        <h1 className="text-h1 font-bold text-fg leading-tight max-w-lg">
          Encuentra el deal
          <br />
          <span className="text-action">antes que nadie.</span>
        </h1>
        <p className="text-body text-fg-muted max-w-md leading-relaxed">
          Cesiones verificadas con 23% de descuento promedio sobre valor de
          mercado. Datos reales, sin ruido, sin intermediarios.
        </p>
        <Button size="lg" onClick={scrollToForm} className="uppercase font-bold mt-2">
          SOLICITAR ACCESO
        </Button>
      </div>

      {/* Image placeholder */}
      <div className="flex-1 w-full max-w-lg">
        <div className="relative aspect-[4/3] rounded-[var(--radius-lg)] bg-bg-card border border-border overflow-hidden">
          {/* Simulated UI chrome */}
          <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="size-2.5 rounded-full bg-bg-elevated" />
              <div className="size-2.5 rounded-full bg-bg-elevated" />
              <div className="size-2.5 rounded-full bg-bg-elevated" />
              <div className="ml-2 h-4 w-32 rounded bg-bg-elevated" />
            </div>
            <div className="flex-1 p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                {["Medellín", "Apto", "Cesión"].map((label) => (
                  <span
                    key={label}
                    className="px-2.5 py-1 rounded-full bg-bg-elevated text-fg-subtle text-label"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1">
                {[
                  { price: "$280M", tag: "−18%", location: "El Poblado" },
                  { price: "$195M", tag: "−23%", location: "Laureles" },
                  { price: "$340M", tag: "−15%", location: "Envigado" },
                  { price: "$220M", tag: "−21%", location: "Sabaneta" },
                ].map((deal) => (
                  <div
                    key={deal.location}
                    className="rounded-[var(--radius-sm)] bg-bg-elevated p-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-label font-semibold text-fg">
                        {deal.price}
                      </span>
                      <span className="text-label font-bold text-action">
                        {deal.tag}
                      </span>
                    </div>
                    <span className="text-label text-fg-muted">
                      {deal.location}
                    </span>
                    <div className="h-1 rounded-full bg-action/20 mt-1">
                      <div
                        className="h-full rounded-full bg-action"
                        style={{ width: "62%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section className="bg-bg-card border-y border-border">
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col items-center gap-10">
        <div className="text-center flex flex-col gap-3 max-w-lg">
          <h2 className="text-h2 font-semibold text-fg">Cómo funciona</h2>
          <p className="text-body text-fg-muted">
            Verificamos cada cesión, calculamos el descuento real sobre precio
            de mercado y te entregamos el análisis completo.
          </p>
        </div>

        {/* Video placeholder */}
        <div className="w-full max-w-3xl aspect-video rounded-[var(--radius-lg)] bg-bg-elevated border border-border flex flex-col items-center justify-center gap-4">
          <div className="size-16 rounded-full border-2 border-border flex items-center justify-center">
            <svg
              className="size-6 text-fg-subtle ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-label text-fg-subtle uppercase tracking-widest">
            Demo próximamente
          </p>
        </div>
      </div>
    </section>
  );
}

type FormState = "idle" | "loading" | "success" | "error";

function FormSection() {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get("name") as string).trim();
    const email = (data.get("email") as string).trim();
    const phone = (data.get("phone") as string).trim();

    const newErrors: typeof errors = {};
    if (!name) newErrors.name = "Requerido";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Correo inválido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setState("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || null }),
      });

      if (res.status === 409) {
        setErrors({ email: "Este correo ya está registrado" });
        setState("idle");
        return;
      }

      if (!res.ok) throw new Error("request failed");

      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="form" className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-h2 font-semibold text-fg">
            Solicitar acceso anticipado
          </h2>
          <p className="text-body text-fg-muted">
            Cupos limitados para la primera cohorte de inversionistas. Sin
            compromiso.
          </p>
        </div>

        {state === "success" ? (
          <div className="rounded-[var(--radius-lg)] bg-bg-card border border-border p-8 flex flex-col gap-3 text-center">
            <p className="text-h3 font-semibold text-fg">Solicitud recibida.</p>
            <p className="text-body text-fg-muted">
              Te contactaremos cuando tu cupo esté listo.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-[var(--radius-lg)] bg-bg-card border border-border p-6 sm:p-8 flex flex-col gap-5"
          >
            <div>
              <Label htmlFor="name">
                Nombre <span className="text-fg-subtle normal-case">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Juan Pérez"
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-label text-urgent">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">
                Correo electrónico{" "}
                <span className="text-fg-subtle normal-case">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="juan@empresa.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-label text-urgent">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+57 300 000 0000"
                autoComplete="tel"
              />
            </div>

            {state === "error" && (
              <p className="text-label text-urgent">
                Ocurrió un error. Intenta de nuevo.
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={state === "loading"}
              className="uppercase font-bold w-full mt-1"
            >
              {state === "loading" ? "ENVIANDO..." : "ENVIAR SOLICITUD"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
