import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import { lessLoader } from 'esbuild-plugin-less';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = process.argv[2] === 'production';
const renameCssPlugin = {
  name: 'rename-css',
  setup(build) {
    build.onEnd(() => {
      const { outfile } = build.initialOptions;
      const outcss = outfile.replace(/\.js$/, '.css');
      const fixcss = outfile.replace(/main\.js$/, 'styles.css');
      if (fs.existsSync(outcss)) {
        console.log('Renaming css file');
        fs.renameSync(outcss, fixcss);
        console.log('Css file renamed');
      }
    });
  },
};
const moveAssetsPlugin = {
  name: 'move-assets',
  setup(build) {
    build.onEnd(async () => {
      const targetDir = process.env.OBSIDIAN_PLUGIN_DIR;

      if (prod || !targetDir) {
        return;
      }

      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Define files to move
      const filesToMove = ['main.js', 'styles.css', 'manifest.json'];

      // Function to move a single file
      const moveFile = async (srcFile, targetFile) => {
        const absoluteSrcFile = path.resolve(__dirname, srcFile);
        const absoluteTargetFile = path.resolve(targetFile);
        try {
          await fs.promises.access(absoluteSrcFile);
          await fs.promises.copyFile(absoluteSrcFile, absoluteTargetFile);
        } catch (error) {
          console.log('Moving failed: ', error);
        }
      };

      // Move all files in parallel
      console.log('Moving assets to Obsidian plugin directory');
      await Promise.all(
        filesToMove.map((srcFile) => {
          const srcPath = path.join(__dirname, srcFile);
          const targetPath = path.join(targetDir, srcFile);
          return moveFile(srcPath, targetPath);
        }),
      );
      console.log('Assets moved to Obsidian plugin directory');
    });
  },
};
const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  plugins: [
    renameCssPlugin,
    moveAssetsPlugin,
    lessLoader({
      javascriptEnabled: true,
    }),
  ],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
