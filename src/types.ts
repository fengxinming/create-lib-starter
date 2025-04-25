export interface Options {
  packageName: string;
  targetDir: string;
  spinStart?: (message: string) => void;
  spinStop?: (message: string) => void;
}

export interface PkgInfo {
  name: string;
  version: string;
}
