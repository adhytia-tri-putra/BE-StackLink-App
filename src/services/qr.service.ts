import QRCode from "qrcode";

export interface QRGenerateOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  format?: "base64" | "svg";
}

export interface QRResult {
  format: string;
  data: string;
  url: string;
}

export async function generateQRCode(
  url: string,
  options: QRGenerateOptions = {}
): Promise<QRResult> {
  const {
    width = 300,
    margin = 2,
    darkColor = "#000000",
    lightColor = "#ffffff",
    format = "base64",
  } = options;

  if (format === "svg") {
    const svg = await QRCode.toString(url, {
      type: "svg",
      margin,
      color: { dark: darkColor, light: lightColor },
    });
    return { format: "svg", data: svg, url };
  }

  const dataUrl = await QRCode.toDataURL(url, {
    width,
    margin,
    color: { dark: darkColor, light: lightColor },
  });

  return { format: "png/base64", data: dataUrl, url };
}

export function buildProfileUrl(baseUrl: string, username: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${username}`;
}
