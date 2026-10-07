import moment from 'moment';
export { moment };
export class TFile {
  extension = 'md';
  name: string;
  basename: string;
  stat = { mtime: Date.now(), ctime: Date.now(), size: 0 };
  constructor(public path: string) {
    this.name = path.split('/').pop()!;
    this.basename = this.name.replace(/\.md$/, '');
  }
}
export class TFolder {
  children: (TFile | TFolder)[] = [];
  constructor(public path: string) {}
}
export function normalizePath(path: string) {
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
}
export class Notice {
  constructor(public message: string) {}
}
export class Component {
  load() {}
  unload() {}
}
export class MarkdownRenderer {
  static async render() {}
}
