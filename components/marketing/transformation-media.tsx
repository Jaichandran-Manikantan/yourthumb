import Image from "next/image";
import type { CSSProperties } from "react";
import type { MarketingShowcaseCase } from "@/lib/marketing/showcase";

export type TransformationMediaRole = "source" | "result";
export type TransformationMediaSize = "hero" | "large" | "compact";
export type SourceKind = "portrait" | "square" | "landscape";

export type SourceImageData = Pick<
  MarketingShowcaseCase,
  "input" | "inputWidth" | "inputHeight" | "inputAlt"
>;
type ResultImageData = Pick<
  MarketingShowcaseCase,
  "result" | "resultWidth" | "resultHeight" | "resultAlt"
>;

export function getSourceKind(width: number, height: number): SourceKind {
  const ratio = width / Math.max(height, 1);
  if (ratio < 0.82) return "portrait";
  if (ratio > 1.3) return "landscape";
  return "square";
}

type SourceSizing = {
  kind: SourceKind;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  sizes: string;
};

function getSourceSizing(
  kind: SourceKind,
  size: TransformationMediaSize,
): SourceSizing {
  if (size === "hero") {
    if (kind === "portrait") {
      return {
        kind,
        height: "clamp(230px, 25vw, 330px)",
        maxHeight: "330px",
        sizes: "(max-width: 768px) 34vw, 260px",
      };
    }
    if (kind === "landscape") {
      return {
        kind,
        width: "clamp(180px, 23vw, 320px)",
        maxWidth: "320px",
        sizes: "(max-width: 768px) 46vw, 320px",
      };
    }
    return {
      kind,
      width: "clamp(150px, 18vw, 250px)",
      maxWidth: "250px",
      sizes: "(max-width: 768px) 40vw, 250px",
    };
  }

  if (size === "compact") {
    if (kind === "portrait") {
      return {
        kind,
        height: "clamp(150px, 19vw, 190px)",
        maxHeight: "190px",
        sizes: "(max-width: 640px) 32vw, 190px",
      };
    }
    if (kind === "landscape") {
      return {
        kind,
        width: "clamp(180px, 27vw, 300px)",
        maxWidth: "300px",
        sizes: "(max-width: 640px) 54vw, 300px",
      };
    }
    return {
      kind,
      width: "clamp(150px, 22vw, 220px)",
      maxWidth: "220px",
      sizes: "(max-width: 640px) 42vw, 220px",
    };
  }

  if (kind === "portrait") {
    return {
      kind,
      height: "clamp(200px, 24vw, 320px)",
      maxHeight: "320px",
      sizes: "(max-width: 1024px) 34vw, 280px",
    };
  }
  if (kind === "landscape") {
    return {
      kind,
      width: "clamp(200px, 30vw, 390px)",
      maxWidth: "390px",
      sizes: "(max-width: 1024px) 58vw, 390px",
    };
  }
  return {
    kind,
    width: "clamp(175px, 23vw, 290px)",
    maxWidth: "290px",
    sizes: "(max-width: 1024px) 44vw, 290px",
  };
}

export function SourceMedia({
  source,
  size = "large",
  priority = false,
  className = "",
  fitToContainer = false,
}: {
  source: SourceImageData;
  size?: TransformationMediaSize;
  priority?: boolean;
  className?: string;
  fitToContainer?: boolean;
}) {
  const sizing = getSourceSizing(
    getSourceKind(source.inputWidth, source.inputHeight),
    size,
  );

  const style: CSSProperties = {
    width: sizing.width,
    height: sizing.height,
    maxWidth: fitToContainer ? "100%" : sizing.maxWidth || "100%",
    maxHeight: fitToContainer ? "100%" : sizing.maxHeight || "100%",
  };

  return (
    <Image
      src={source.input}
      alt={source.inputAlt}
      width={source.inputWidth}
      height={source.inputHeight}
      priority={priority}
      sizes={sizing.sizes}
      style={style}
      className={`block object-contain ${className}`}
    />
  );
}

export function ResultMedia({
  result,
  size = "large",
  priority = false,
  className = "",
}: {
  result: ResultImageData;
  size?: TransformationMediaSize;
  priority?: boolean;
  className?: string;
}) {
  const sizes =
    size === "hero"
      ? "(max-width: 768px) 100vw, 68vw"
      : size === "large"
        ? "(max-width: 1024px) 100vw, 76vw"
        : "(max-width: 640px) 100vw, 70vw";

  return (
    <Image
      src={result.result}
      alt={result.resultAlt}
      width={result.resultWidth}
      height={result.resultHeight}
      priority={priority}
      sizes={sizes}
      className={`block h-auto w-full ${className}`}
    />
  );
}

export function TransformationMedia({
  item,
  role,
  size = "large",
  priority = false,
  className = "",
}: {
  item: MarketingShowcaseCase;
  role: TransformationMediaRole;
  size?: TransformationMediaSize;
  priority?: boolean;
  className?: string;
}) {
  return role === "source" ? (
    <SourceMedia
      source={item}
      size={size}
      priority={priority}
      className={className}
    />
  ) : (
    <ResultMedia
      result={item}
      size={size}
      priority={priority}
      className={className}
    />
  );
}
