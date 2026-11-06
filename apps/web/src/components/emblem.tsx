import { PixelArt } from "./pixel-art";

const ROWS = [
  "................",
  ".gggggggggggggg.",
  ".gnnnnnnnnnnnng.",
  ".gnngnnggnngnng.",
  ".gnnggggggggnng.",
  ".gnngggbbgggnng.",
  ".gnnddddddddnng.",
  ".gnnnnnnnnnnnng.",
  ".gnnnnnbbnnnnng.",
  ".gnnnnnbbnnnnng.",
  "..gnnnnbbnnnng..",
  "...gnnnbbnnng...",
  "....gnnbbnng....",
  ".....gnnnng.....",
  "......gnng......",
  ".......gg.......",
];

const PALETTE = {
  g: "var(--color-gold-500)",
  d: "var(--color-gold-600)",
  n: "var(--color-navy-800)",
  b: "var(--color-burgundy-500)",
};

export function Emblem({ className }: { className?: string }) {
  return (
    <PixelArt
      rows={ROWS}
      palette={PALETTE}
      title="Dragonhold emblem"
      className={className}
    />
  );
}