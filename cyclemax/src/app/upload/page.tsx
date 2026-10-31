"use client";

import { useState } from "react";
import { Button, Screen } from "@/components/ui";
import { Wordmark } from "@/components/Logo";
import { uploadApi, type UploadResult } from "@/lib/api";

const MAX_IMAGES = 6;
const AGE_GROUPS = ["unter 20", "20-29", "30-39", "40-49", "50+"] as const;
const CONTRACEPTION = [
  ["hormonell", "hormonell (z. B. Pille, Hormonspirale)"],
  ["nicht hormonell", "nicht hormonell (z. B. Kupferspirale, Kondom)"],
  ["keine", "keine"],
] as const;

/** Shrinks a screenshot on the device and re-encodes it as JPEG – this also drops metadata like location and time. */
async function shrink(file: File, maxBytes: number): Promise<string> {
  // orientation from EXIF is the default; the option itself is missing on iOS 15
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`„${file.name}“ lässt sich nicht lesen. Bitte nimm einen Screenshot (PNG oder JPEG).`);
  });
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.58, 0.45]) {
    const data = canvas.toDataURL("image/jpeg", quality).split(",")[1];
    if ((data.length * 3) / 4 <= maxBytes) return data;
  }
  throw new Error(`„${file.name}“ ist zu groß. Bitte schneide den Screenshot zu.`);
}

function Chips<T extends string>({ options, value, onChange, label }: { options: readonly (readonly [T, string])[]; value: T | null; onChange: (v: T | null) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(value === v ? null : v)}
          className={`min-h-10 rounded-full px-4 text-[14px] ${value === v ? "bg-ink text-white" : "bg-surface"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [contraception, setContraception] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);

  const pick = (list: FileList | null) => {
    const picked = Array.from(list ?? []).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    setError(picked.length > MAX_IMAGES ? `Höchstens ${MAX_IMAGES} Screenshots auf einmal – die ersten ${MAX_IMAGES} sind ausgewählt.` : null);
    setFiles(picked.slice(0, MAX_IMAGES));
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const perImage = Math.min(1_200_000, Math.floor(2_900_000 / files.length));
      const images = await Promise.all(files.map(async (f) => ({ mediaType: "image/jpeg" as const, data: await shrink(f, perImage) })));
      setResult(await uploadApi.send({ consent: true, ageGroup, contraception, images }));
      setFiles([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Das hat nicht geklappt. Bitte versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setDeleted(false);
    setCopied(false);
    setConsent(false);
    setError(null);
  };

  if (result) {
    const s = result.saved;
    const rows: [string, string][] = [
      ["Zykluslängen", s.cycleLengths.length ? `${s.cycleLengths.join(", ")} Tage` : "–"],
      ["Periodendauer", s.periodLengths.length ? `${s.periodLengths.join(", ")} Tage` : "–"],
      ["Ø Zyklus", s.avgCycle ? `${s.avgCycle} Tage` : "–"],
      ["Ø Periode", s.avgPeriod ? `${s.avgPeriod} Tage` : "–"],
      ["Symptome", s.symptoms.length ? s.symptoms.join(", ") : "–"],
      ["Befinden", s.observations.length ? s.observations.map((o) => `${o.category} (${o.n})`).join(", ") : "–"],
      ["Kennzahlen der App", s.metrics.length ? s.metrics.join(", ") : "–"],
      ["Quelle", s.sourceApp],
    ];
    return (
      <Screen className="gap-6 py-10">
        <Wordmark />
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{deleted ? "Gelöscht." : "Danke dir."}</h1>
        {deleted ? (
          <p className="text-[17px] leading-relaxed">Dein Datensatz ist entfernt. Es ist nichts mehr von deinem Upload gespeichert.</p>
        ) : (
          <>
            <p className="text-[17px] leading-relaxed">Von deinen Screenshots ist bei uns nichts gespeichert. Gespeichert wurde nur das – ohne Datum, ohne Namen, ohne Geräte-ID:</p>
            <dl className="flex flex-col divide-y divide-line rounded-2xl bg-surface px-4" data-testid="upload-saved">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3 text-[15px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2">
              <p className="text-[14px] text-muted">Dein Löschcode – heb ihn auf, wenn du den Datensatz später löschen willst. Ohne ihn können wir ihn niemandem zuordnen.</p>
              <code className="rounded-xl bg-surface p-3 text-[13px] break-all" data-testid="upload-code">
                {result.code}
              </code>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(result.code).then(() => setCopied(true))}>
                  {copied ? "Kopiert" : "Code kopieren"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await uploadApi.remove(result.code);
                      setDeleted(true);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Löschen hat nicht geklappt.");
                    }
                  }}
                >
                  Jetzt löschen
                </Button>
              </div>
            </div>
          </>
        )}
        {error && <p className="text-[14px] text-accent">{error}</p>}
        <Button onClick={reset}>Weitere Screenshots teilen</Button>
      </Screen>
    );
  }

  return (
    <Screen className="gap-7 py-10">
      <Wordmark />
      <section className="flex flex-col gap-3">
        <h1 className="text-[30px] leading-tight font-semibold tracking-tight">Teile deinen Zyklus – anonym.</h1>
        <p className="text-[17px] leading-relaxed">
          Lade Screenshots aus deiner Zyklus-App hoch – zum Beispiel Apple Health, Flo, Clue oder Natural Cycles. Kalender, Verlauf, Statistik
          oder deine Einträge zu Stimmung, Energie, Schlaf und Lust. Damit lernt Cyclemax, wie Zyklen wirklich verlaufen – und wie es sich in
          jeder Phase anfühlt.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-[15px] leading-relaxed">
        <p className="font-medium">So bleibst du anonym</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            Wir speichern deine Screenshots nicht. Sie werden einmal automatisch von Claude (Anthropic) ausgelesen. Anthropic nutzt sie nicht zum
            Training und löscht sie nach kurzer Zeit (höchstens 30 Tage).
          </li>
          <li>
            Gespeichert werden Zykluslängen, Periodendauer, Symptome und Einträge wie Stimmung, Energie, Schlaf oder Lust – immer nach Zyklustag,
            ohne Datum, ohne Namen, ohne Notizen, ohne Geräte-ID, ohne IP-Adresse.
          </li>
          <li>Vor dem Senden werden die Bilder auf deinem Gerät verkleinert. Dabei fallen Metadaten wie Ort und Aufnahmezeit weg.</li>
          <li>Tipp: Namen oder Benachrichtigungen vorher wegschneiden – das ganze Bild geht zur Auswertung an Anthropic.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <label
          htmlFor="files"
          className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line px-4 text-center active:bg-surface"
        >
          <span className="text-[17px] font-medium">{files.length ? `${files.length} Screenshot${files.length > 1 ? "s" : ""} ausgewählt` : "Screenshots auswählen"}</span>
          <span className="text-[14px] text-muted">bis zu {MAX_IMAGES} Bilder</span>
        </label>
        <input id="files" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pick(e.target.files)} data-testid="upload-input" />
        {files.length > 0 && (
          <ul className="flex flex-col gap-1 text-[14px] text-muted">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`} className="truncate">
                {f.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[15px] font-medium">
          Dein Alter <span className="font-normal text-muted">(freiwillig)</span>
        </p>
        <Chips label="Alter" options={AGE_GROUPS.map((a) => [a, a] as const)} value={ageGroup} onChange={setAgeGroup} />
        <p className="mt-2 text-[15px] font-medium">
          Verhütung <span className="font-normal text-muted">(freiwillig)</span>
        </p>
        <Chips label="Verhütung" options={CONTRACEPTION} value={contraception} onChange={setContraception} />
      </section>

      <label className="flex items-start gap-3 text-[14px] leading-relaxed">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#111]" data-testid="upload-consent" />
        <span>
          Ich bin mindestens 16 Jahre alt, lade nur meine eigenen Daten hoch und willige ein, dass meine Screenshots einmalig automatisch
          ausgewertet (durch Claude von Anthropic, USA) und Zyklus- und Befindensdaten daraus als anonymer Datensatz gespeichert werden.
          Details in der{" "}
          <a href="/datenschutz/#upload" className="underline underline-offset-2">
            Datenschutzerklärung
          </a>
          .
        </span>
      </label>

      {error && (
        <p className="text-[14px] text-accent" role="alert">
          {error}
        </p>
      )}
      <Button disabled={!files.length || !consent || busy} onClick={send} data-testid="upload-send">
        {busy ? "Wird ausgewertet …" : "Anonym hochladen"}
      </Button>
    </Screen>
  );
}
