import cac from 'cac';
import type { Fonts } from 'figlet';
import { textSync } from 'figlet';

import { name, version } from '../../package.json';
import start from './start';

function banner(msg: string, opts?: Fonts) {
  console.info('');
  try {
    console.info(textSync(msg, opts));
  }
  catch (e) {
    console.info(msg);
  }
  console.info('');
}

// 大标题
banner(name);

// 创建命令终端
const cli = cac();

start(cli);

cli.version(version).help();

cli.parse(process.argv);

