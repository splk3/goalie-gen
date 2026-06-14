declare module "*.css";

declare module "*.md" {
  const content: string;
  export default content;
}

declare module "*.yml" {
  const content: string;
  export default content;
}

declare module "qrcode";
