export function publishedScript() {
  let zoomedImage: HTMLImageElement | null = null;
  let overlay: HTMLDivElement | null = null;
  let originalSrc: string | null = null;
  let originalTransform: string = "";

  const zIndexResetTimeouts = new WeakMap<HTMLImageElement, number>();
  const zIndexTrackedImages = new Set<HTMLImageElement>();

  function resetZIndex(image: HTMLImageElement): void {
    const timeoutId = window.setTimeout(() => {
      image.style.zIndex = "auto";
      zIndexResetTimeouts.delete(image);
      zIndexTrackedImages.delete(image);
    }, 300);

    zIndexResetTimeouts.set(image, timeoutId);
    zIndexTrackedImages.add(image);
  }

  function closeZoom(): void {
    if (zoomedImage) {
      if (originalSrc) {
        zoomedImage.src = originalSrc;
      }

      zoomedImage.style.transform = originalTransform;
      zoomedImage.classList.remove("zoomed");

      resetZIndex(zoomedImage);

      zoomedImage = null;
      originalSrc = null;
    }

    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function handleZoomClick(event: MouseEvent): void {
    const imgElement = event.currentTarget as HTMLImageElement;

    if (overlay || imgElement === zoomedImage) {
      closeZoom();
      return;
    }

    const zoomSrc = imgElement.dataset?.zoomSrc ?? null;
    originalSrc = imgElement.src;
    originalTransform = imgElement.style.transform;

    createOverlay();
    zoomedImage = imgElement;
    zoomedImage.classList.add("zoomed");

    // Cancel all z-index resets
    zIndexTrackedImages.forEach((image) => {
      const timeoutId = zIndexResetTimeouts.get(image);
      if (timeoutId) {
        clearTimeout(timeoutId);
        image.style.zIndex = "auto";
        zIndexResetTimeouts.delete(image);
      }
    });
    zIndexTrackedImages.clear();

    imgElement.style.zIndex = "900";

    applyZoomTransform(
      imgElement,
      imgElement.naturalWidth,
      imgElement.naturalHeight
    );

    if (zoomSrc) {
      const preloadedImage = new Image();
      preloadedImage.onload = () => {
        imgElement.src = preloadedImage.src;
      };
      preloadedImage.src = zoomSrc;
    }
  }

  function applyZoomTransform(
    img: HTMLImageElement,
    naturalWidth: number,
    naturalHeight: number
  ): void {
    const rect = img.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const margin = 20;

    const viewportWidth = window.innerWidth - margin * 2;
    const viewportHeight = window.innerHeight - margin * 2;

    const scaleX = Math.min(naturalWidth, viewportWidth) / rect.width;
    const scaleY = Math.min(naturalHeight, viewportHeight) / rect.height;
    const scale = Math.min(scaleX, scaleY);

    const imgCenterX = rect.left + rect.width / 2 + scrollLeft;
    const imgCenterY = rect.top + rect.height / 2 + scrollTop;

    const viewportCenterX = scrollLeft + window.innerWidth / 2;
    const viewportCenterY = scrollTop + window.innerHeight / 2;

    const translateX = viewportCenterX - imgCenterX;
    const translateY = viewportCenterY - imgCenterY;

    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  function createOverlay(): void {
    overlay = document.createElement("div");
    overlay.className = "textrix-zoom-overlay";
    overlay.addEventListener("click", closeZoom);
    document.body.appendChild(overlay);
  }

  function handleScroll(): void {
    if (zoomedImage || overlay) {
      closeZoom();
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (event.key === "Escape" || event.key === "Esc" || event.keyCode === 27) {
      closeZoom();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll<HTMLImageElement>("img:not([data-layout='fill-width'])")
      .forEach((img) => {
        img.addEventListener("click", handleZoomClick);
      });

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", closeZoom);
  });
}
