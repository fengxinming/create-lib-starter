import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { removeSync } from 'fs-extra';

import { PkgInfo } from './types';

export function pkgFromUserAgent(userAgent: string | undefined): PkgInfo | undefined {
  if (!userAgent) {
    return;
  }
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  };
}

export function isValidPackageName(projectName: string): boolean {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
}

export function toValidPackageName(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}

export function isEmptyTargetDir(dir: string): boolean {
  const files = readdirSync(dir);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

export function emptyTargetDir(dir: string) {
  if (!existsSync(dir)) {
    return;
  }
  for (const file of readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    removeSync(join(dir, file));
  }
}

export function getFullCustomCommand(customCommand: string, pkgInfo?: PkgInfo) {
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.');

  return customCommand
    .replace(/^npm create (?:-- )?/, () => {
      // `bun create` uses it's own set of templates,
      // the closest alternative is using `bun x` directly on the package
      if (pkgManager === 'bun') {
        return 'bun x create-';
      }
      // pnpm doesn't support the -- syntax
      if (pkgManager === 'pnpm') {
        return 'pnpm create ';
      }
      // For other package managers, preserve the original format
      return customCommand.startsWith('npm create -- ')
        ? `${pkgManager} create -- `
        : `${pkgManager} create `;
    })
    // Only Yarn 1.x doesn't support `@version` in the `create` command
    .replace('@latest', () => (isYarn1 ? '' : '@latest'))
    .replace(/^npm exec/, () => {
      // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
      if (pkgManager === 'pnpm') {
        return 'pnpm dlx';
      }
      if (pkgManager === 'yarn' && !isYarn1) {
        return 'yarn dlx';
      }
      if (pkgManager === 'bun') {
        return 'bun x';
      }
      // Use `npm exec` in all other cases,
      // including Yarn 1.x and other custom npm clients.
      return 'npm exec';
    });
}
