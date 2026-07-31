"use client";

// Detecta si estem en amplada de mòbil. Comença a false (coincideix amb el
// servidor) i s'actualitza en muntar i en canviar la mida.

import { useEffect, useState } from "react";

export function useIsMobile(maxWidth = 967): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);

  return isMobile;
}
