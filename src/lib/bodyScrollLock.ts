const LOCK_COUNT_ATTR = "data-scroll-lock-count";
const PREV_OVERFLOW_ATTR = "data-prev-overflow";
const PREV_TOUCH_ATTR = "data-prev-touch-action";

function getLockCount(body: HTMLElement): number {
  return Number(body.getAttribute(LOCK_COUNT_ATTR) || "0");
}

export function lockBodyScroll() {
  if (typeof document === "undefined") return;

  const body = document.body;
  const currentCount = getLockCount(body);

  if (currentCount === 0) {
    body.setAttribute(PREV_OVERFLOW_ATTR, body.style.overflow || "");
    body.setAttribute(PREV_TOUCH_ATTR, body.style.touchAction || "");
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
  }

  body.setAttribute(LOCK_COUNT_ATTR, String(currentCount + 1));
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;

  const body = document.body;
  const currentCount = getLockCount(body);

  if (currentCount <= 1) {
    body.style.overflow = body.getAttribute(PREV_OVERFLOW_ATTR) ?? "";
    body.style.touchAction = body.getAttribute(PREV_TOUCH_ATTR) ?? "";
    body.removeAttribute(PREV_OVERFLOW_ATTR);
    body.removeAttribute(PREV_TOUCH_ATTR);
    body.removeAttribute(LOCK_COUNT_ATTR);
    return;
  }

  body.setAttribute(LOCK_COUNT_ATTR, String(currentCount - 1));
}