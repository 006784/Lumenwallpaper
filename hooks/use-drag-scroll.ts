"use client";

import { useEffect, useRef } from "react";

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      isPointerDown = true;
      startX = event.clientX;
      startScrollLeft = element.scrollLeft;
      element.classList.add("is-dragging");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerDown) {
        return;
      }

      event.preventDefault();
      const distance = event.clientX - startX;
      element.scrollLeft = startScrollLeft - distance * 1.15;
    };

    const stopDragging = () => {
      isPointerDown = false;
      element.classList.remove("is-dragging");
    };

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, []);

  return ref;
}
