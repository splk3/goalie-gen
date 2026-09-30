import {
  isMobileBrowser,
  isStandalonePwa,
  loadImagesForPrint,
  shouldUseNativePagePrint,
} from "../printSupport";

const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const IPADOS_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function setNavigatorProperty(name: string, value: unknown) {
  Object.defineProperty(window.navigator, name, { value, configurable: true });
}

function setDisplayModeMatches(matchingModes: string[]) {
  window.matchMedia = jest.fn((query: string) => ({
    matches: matchingModes.some((mode) => query === `(display-mode: ${mode})`),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("printSupport", () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    setNavigatorProperty("userAgent", DESKTOP_CHROME_UA);
    setNavigatorProperty("maxTouchPoints", 0);
    setNavigatorProperty("userAgentData", undefined);
    setNavigatorProperty("standalone", undefined);
    setDisplayModeMatches(["browser"]);
  });

  afterEach(() => {
    setNavigatorProperty("userAgent", originalUserAgent);
    window.matchMedia = originalMatchMedia;
  });

  it("uses the PDF auto-print flow on desktop browsers", () => {
    expect(isMobileBrowser()).toBe(false);
    expect(isStandalonePwa()).toBe(false);
    expect(shouldUseNativePagePrint()).toBe(false);
  });

  it("uses native page printing on Android Chrome", () => {
    setNavigatorProperty("userAgent", ANDROID_CHROME_UA);
    expect(isMobileBrowser()).toBe(true);
    expect(shouldUseNativePagePrint()).toBe(true);
  });

  it("uses native page printing when user agent client hints report mobile", () => {
    setNavigatorProperty("userAgentData", { mobile: true });
    expect(shouldUseNativePagePrint()).toBe(true);
  });

  it("detects iPadOS devices that report a desktop user agent", () => {
    setNavigatorProperty("userAgent", IPADOS_UA);
    setNavigatorProperty("maxTouchPoints", 5);
    expect(isMobileBrowser()).toBe(true);
  });

  it("uses native page printing in installed PWAs", () => {
    setDisplayModeMatches(["standalone"]);
    expect(isStandalonePwa()).toBe(true);
    expect(shouldUseNativePagePrint()).toBe(true);
  });

  it("detects iOS home screen web apps", () => {
    setNavigatorProperty("standalone", true);
    expect(isStandalonePwa()).toBe(true);
  });

  describe("loadImagesForPrint", () => {
    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("switches lazy images to eager and waits for them to load", async () => {
      document.body.innerHTML = '<img loading="lazy" src="/a.png" alt="a" />';
      const img = document.querySelector("img") as HTMLImageElement;
      Object.defineProperty(img, "complete", { value: false, configurable: true });

      let resolved = false;
      const promise = loadImagesForPrint(document, 1000).then(() => {
        resolved = true;
      });
      expect(img.getAttribute("loading")).toBe("eager");

      await Promise.resolve();
      expect(resolved).toBe(false);

      img.dispatchEvent(new Event("load"));
      await promise;
      expect(resolved).toBe(true);
    });

    it("stops waiting after the timeout", async () => {
      jest.useFakeTimers();
      try {
        document.body.innerHTML = '<img loading="lazy" src="/a.png" alt="a" />';
        const img = document.querySelector("img") as HTMLImageElement;
        Object.defineProperty(img, "complete", { value: false, configurable: true });

        const promise = loadImagesForPrint(document, 500);
        jest.advanceTimersByTime(500);
        await expect(promise).resolves.toBeUndefined();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
