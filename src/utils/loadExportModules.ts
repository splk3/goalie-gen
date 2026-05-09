type DocxModule = typeof import("docx");
type JsPdfModule = typeof import("jspdf");

let docxModulePromise: Promise<DocxModule> | null = null;
let jsPdfModulePromise: Promise<JsPdfModule> | null = null;

export const loadDocxModule = async (): Promise<DocxModule> => {
  if (!docxModulePromise) {
    docxModulePromise = import("docx");
  }

  return docxModulePromise;
};

export const loadJsPdfModule = async (): Promise<JsPdfModule> => {
  if (!jsPdfModulePromise) {
    jsPdfModulePromise = import("jspdf");
  }

  return jsPdfModulePromise;
};
