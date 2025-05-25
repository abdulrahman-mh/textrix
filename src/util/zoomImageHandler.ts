export const ZoomImageHandler = (() => {
  let zoomedImage: HTMLImageElement | null = null;
  let overlay: HTMLDivElement | null = null;
  let originalSrc: string | null = null;
  let originalTransform: string = "";
  let isCustomArticleContainer = false;

  const zIndexResetTimeouts = new WeakMap<HTMLImageElement, number>();
  const zIndexTrackedImages = new Set<HTMLImageElement>();

  const handleZoomClick = (
    event: MouseEvent,
    parentElement: HTMLElement
  ): void => {
    const imgElement = event.currentTarget as HTMLImageElement;

    if (overlay || imgElement === zoomedImage) {
      closeZoom();
      return;
    }

    const zoomSrc = imgElement.dataset?.zoomSrc ?? null;
    originalSrc = imgElement.src;
    originalTransform = imgElement.style.transform;

    createOverlay(parentElement);
    zoomedImage = imgElement;
    zoomedImage.classList.add("zoomed");

    zIndexTrackedImages.forEach((image) => {
      const timeoutId = zIndexResetTimeouts.get(image);
      if (timeoutId) {
        clearTimeout(timeoutId);
        image.style.zIndex = "auto";
        zIndexResetTimeouts.delete(image);
      }
    });
    zIndexTrackedImages.clear();

    imgElement.style.zIndex = "9999";

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
  };

  const resetZIndex = (image: HTMLImageElement): void => {
    const timeoutId = window.setTimeout(() => {
      image.style.zIndex = "auto";
      zIndexResetTimeouts.delete(image);
      zIndexTrackedImages.delete(image);
    }, 300);

    zIndexResetTimeouts.set(image, timeoutId);
    zIndexTrackedImages.add(image);
  };

  const closeZoom = (): void => {
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
  };

  const applyZoomTransform = (
    img: HTMLImageElement,
    naturalWidth: number,
    naturalHeight: number
  ): void => {
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
  };

  const createOverlay = (parentElement: HTMLElement = document.body): void => {
    overlay = document.createElement("div");
    overlay.className = "textrix-zoom-overlay";

    if (isCustomArticleContainer) {
      overlay.style.height = `${parentElement.scrollHeight}px`;
    }

    overlay.addEventListener("click", closeZoom);
    parentElement.appendChild(overlay);
  };

  const handleScroll = (): void => {
    if (zoomedImage || overlay) {
      closeZoom();
    }
  };

  const handleKeyUp = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || event.key === "Esc" || event.keyCode === 27) {
      closeZoom();
    }
  };

  let initialized = false;

  function run({ container }: { container?: HTMLElement } = {}) {
    if (initialized) return;
    initialized = true;

    console.log("RUN");
    if (container) {
      isCustomArticleContainer = true;
    }

    const parent = container || document;

    document
      .querySelectorAll<HTMLImageElement>(
        ".textrix:not(.editing) img:not([data-layout='fill-width'])"
      )
      .forEach((img) => {
        img.addEventListener("click", (e) =>
          handleZoomClick(e, container ?? document.body)
        );
      });

    document.addEventListener("keyup", handleKeyUp);

    if ("addEventListener" in parent) {
      parent.addEventListener("scroll", handleScroll);
    }

    window.addEventListener("resize", closeZoom);
  }

  function cleanup() {
    if (!initialized) return;
    initialized = false;
    console.log("Cleanup");

    document
      .querySelectorAll<HTMLImageElement>("img:not([data-layout='fill-width'])")
      .forEach((img) => {
        img.removeEventListener("click", handleZoomClick as EventListener);
      });

    document.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", closeZoom);

    closeZoom();
  }

  // Main callable function
  const self = () => run();

  // Attach methods
  self.run = run;
  self.cleanup = cleanup;

  return self;
})();
