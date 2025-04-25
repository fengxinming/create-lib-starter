import { existsSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

import { cancel, intro, isCancel, log, outro, select, spinner, text } from '@clack/prompts';
import { CAC } from 'cac';
import spawn from 'cross-spawn';

import {
  emptyTargetDir,
  getFullCustomCommand,
  isEmptyTargetDir,
  isValidPackageName,
  pkgFromUserAgent,
  toValidPackageName
} from '../common';

const loading = spinner({
  indicator: 'dots'
});

function doCancel() {
  return cancel('Operation cancelled');
}
export default function start(cli: CAC) {
  cli
    .command('[root]', 'Create a new vite project.')
    .option('-f, --force', 'Overwrite existing directory.')
    .example((name) => {
      return `
      $ ${name}
      $ ${name} my-lib
`;
    })
    .action(async (targetDir: string, opts: Record<string, unknown>) => {
      const startTime = Date.now();
      const cwd = process.cwd();

      targetDir = resolve(targetDir || '.');

      intro(`Create a new vite project in '${targetDir}':`);

      // 清空目标目录
      if (existsSync(targetDir) && !isEmptyTargetDir(targetDir)) {
        const overwrite = opts.force
          ? 'yes'
          : await select({
            message:
            `${targetDir === cwd
              ? 'Current directory'
              : `Target directory "${targetDir}"`
            } is not empty. Please choose how to proceed:`,
            options: [
              {
                label: 'Cancel operation',
                value: 'no'
              },
              {
                label: 'Remove existing files and continue',
                value: 'yes'
              },
              {
                label: 'Ignore files and continue',
                value: 'ignore'
              }
            ]
          });
        if (isCancel(overwrite)) {
          return doCancel();
        }
        switch (overwrite) {
          case 'yes':
            emptyTargetDir(targetDir);
            break;
          case 'no':
            doCancel();
            return;
        }
      }

      // 获取包名
      let packageName = basename(targetDir);
      if (!isValidPackageName(packageName)) {
        const packageNameResult = await text({
          message: 'Package name:',
          defaultValue: toValidPackageName(packageName),
          placeholder: toValidPackageName(packageName),
          validate(dir) {
            if (!isValidPackageName(dir)) {
              return 'Invalid package.json name';
            }
          }
        });
        if (isCancel(packageNameResult)) {
          return doCancel();
        }
        packageName = packageNameResult;
      }

      const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);

      const customCommand = 'npm create vite-lib-starter@latest TARGET_DIR';
      const fullCustomCommand = getFullCustomCommand(customCommand, pkgInfo);
      const [command, ...args] = fullCustomCommand.split(' ');
      const replacedArgs = args.map((arg) =>
        arg.replace('TARGET_DIR', () => targetDir),
      );

      loading.start('Creating project');
      const { status, stdout, stderr } = spawn.sync(command, replacedArgs);

      if (status === 0) {
        loading.stop('Created project');
        log.success(stdout.toString());

        const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

        let doneMessage = '';
        const cdProjectName = relative(cwd, targetDir);
        doneMessage += `Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s. Now run:\n`;
        if (targetDir !== cwd) {
          doneMessage += `\n  cd ${
            cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
          }`;
        }
        switch (pkgManager) {
          case 'yarn':
            doneMessage += '\n  yarn';
            doneMessage += '\n  yarn dev';
            break;
          default:
            doneMessage += `\n  ${pkgManager} install`;
            doneMessage += `\n  ${pkgManager} run dev`;
            break;
        }
        outro(doneMessage);
      }
      else {
        loading.stop('Failed to create project');
        log.error(stderr.toString());
        outro(`Failed in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);
      }

      process.exit(status ?? 0);
    });
}
