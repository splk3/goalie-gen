type DocxModule = typeof import("docx");
type JsPdfModule = typeof import("jspdf");

let docxModulePromise: Promise<DocxModule> | null = null;
let jsPdfModulePromise: Promise<JsPdfModule> | null = null;

export const loadDocxModule = async (): Promise<DocxModule> => {
  if (!docxModulePromise) {
    docxModulePromise = import("docx").catch((error) => {
      docxModulePromise = null;
      throw error;
    });
  }

  return docxModulePromise;
};

export const loadJsPdfModule = async (): Promise<JsPdfModule> => {
  if (!jsPdfModulePromise) {
    jsPdfModulePromise = import("jspdf").catch((error) => {
      jsPdfModulePromise = null;
      throw error;
    });
  }

  return jsPdfModulePromise;
};
