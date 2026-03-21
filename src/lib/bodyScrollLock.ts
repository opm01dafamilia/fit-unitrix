const LOCK_COUNT_ATTR = "data-scroll-lock-count";
const PREV_BODY_OVERFLOW_ATTR = "data-prev-body-overflow";
const PREV_HTML_OVERFLOW_ATTR = "data-prev-html-overflow";
const PREV_BODY_OVERSCROLL_ATTR = "data-prev-body-overscroll";

function getLockCount(body: HTMLElement): number {
  return Number(body.getAttribute(LOCK_COUNT_ATTR) || "0");
}

export function lockBodyScroll() {
  if (typeof document === "undefined") return;

  const body = document.body;
  const html = document.documentElement;
  const currentCount = getLockCount(body);

  if (currentCount === 0) {
    body.setAttribute(PREV_BODY_OVERFLOW_ATTR, body.style.overflow || "");
    html.setAttribute(PREV_HTML_OVERFLOW_ATTR, html.style.overflow || "");
    body.setAttribute(PREV_BODY_OVERSCROLL_ATTR, body.style.overscrollBehaviorY || "");

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    body.style.overscrollBehaviorY = "none";
  }

  body.setAttribute(LOCK_COUNT_ATTR, String(currentCount + 1));
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;

  const body = document.body;
  const html = document.documentElement;
  const currentCount = getLockCount(body);

  if (currentCount <= 1) {
    body.style.overflow = body.getAttribute(PREV_BODY_OVERFLOW_ATTR) ?? "";
    html.style.overflow = html.getAttribute(PREV_HTML_OVERFLOW_ATTR) ?? "";
    body.style.overscrollBehaviorY = body.getAttribute(PREV_BODY_OVERSCROLL_ATTR) ?? "";

    body.removeAttribute(PREV_BODY_OVERFLOW_ATTR);
    html.removeAttribute(PREV_HTML_OVERFLOW_ATTR);
    body.removeAttribute(PREV_BODY_OVERSCROLL_ATTR);
    body.removeAttribute(LOCK_COUNT_ATTR);
    return;
  }

  body.setAttribute(LOCK_COUNT_ATTR, String(currentCount - 1));
}

export function resetBodyScrollLock() {
  if (typeof document === "undefined") return;

  const body = document.body;
  const html = document.documentElement;

  body.style.overflow = body.getAttribute(PREV_BODY_OVERFLOW_ATTR) ?? "";
  html.style.overflow = html.getAttribute(PREV_HTML_OVERFLOW_ATTR) ?? "";
  body.style.overscrollBehaviorY = body.getAttribute(PREV_BODY_OVERSCROLL_ATTR) ?? "";

  body.removeAttribute(PREV_BODY_OVERFLOW_ATTR);
  html.removeAttribute(PREV_HTML_OVERFLOW_ATTR);
  body.removeAttribute(PREV_BODY_OVERSCROLL_ATTR);
  body.removeAttribute(LOCK_COUNT_ATTR);
}