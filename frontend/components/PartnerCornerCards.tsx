"use client";

import { useState, useEffect } from "react";

const PARTNERS = [
  {
    name: "Aziz IMEJJANE",
    initial: "A",
    color: "#10b981",
    corner: "top-4 left-4",
  },
  {
    name: "Mustapha ouakssis",
    initial: "M",
    color: "#3b82f6",
    corner: "top-4 right-4",
  },
  {
    name: "Akram Ait raho",
    initial: "A",
    color: "#f59e0b",
    corner: "bottom-4 left-4",
  },
  {
    name: "Marouane rerhdachi",
    initial: "M",
    color: "#ef4444",
    corner: "bottom-4 right-4",
  },
];

function TypingText({
  text,
  color,
  delay = 0,
}: {
  text: string;
  color: string;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(90);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayed.length < text.length) {
          setDisplayed(text.slice(0, displayed.length + 1));
          setSpeed(90);
        } else {
          setSpeed(2000); // Long pause when name is fully typed
          setIsDeleting(true);
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1));
          setSpeed(40); // Faster deleting
        } else {
          setSpeed(500); // Short pause before restarting
          setIsDeleting(false);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, text, speed, started]);

  return (
    <span
      className="font-bold tracking-[0.22em] font-mono uppercase text-[11px] inline-flex items-center"
      style={{ color, minWidth: "4ch", minHeight: "1em" }}
    >
      {displayed}
      {/* blinking cursor */}
      <span
        className="ml-0.5 inline-block w-[2px] h-[10px] align-middle animate-pulse"
        style={{
          background: color,
        }}
      />
    </span>
  );
}

/* ── Partner card ─────────────────────────────────────────── */
function PartnerCard({ name, initial, color, corner }: (typeof PARTNERS)[0]) {
  return (
    <div
      className={`fixed ${corner} flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all cursor-default group z-20`}
      style={{
        background: "rgba(15,23,42,0.92)",
        borderColor: `${color}35`,
        minWidth: 96,
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Corner accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
        }}
      />

      {/* Initials circle */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center border-2 font-bold font-mono text-2xl transition-all group-hover:scale-110 group-hover:shadow-lg cursor-pointer"
        style={{
          borderColor: `${color}70`,
          color: color,
          background: `${color}18`,
          boxShadow: `0 0 0 0 ${color}00`,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            `0 0 20px ${color}40`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            `0 0 0 0 ${color}00`;
        }}
      >
        {initial}
      </div>

      {/* Typing name */}
      <TypingText text={name} color={color} delay={Math.random() * 400} />

      {/* Online indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: color }}
        />
        <span
          className="text-[7px] font-mono tracking-widest uppercase"
          style={{ color: `${color}80` }}
        >
          ACTIF
        </span>
      </div>
    </div>
  );
}

/* ── Exported component ───────────────────────────────────── */
export default function PartnerCornerCards() {
  return (
    <>
      {PARTNERS.map((op) => (
        <PartnerCard key={op.name} {...op} />
      ))}
    </>
  );
}
