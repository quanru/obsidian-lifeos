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
  private children = new Set<Component>();
  private disposers: (() => void)[] = [];
  private loaded = false;
  onload() {}
  onunload() {}
  load() {
    this.loaded = true;
    this.onload();
    for (const child of this.children) child.load();
  }
  unload() {
    this.loaded = false;
    this.onunload();
    for (const child of this.children) child.unload();
    for (const dispose of this.disposers.splice(0)) dispose();
  }
  addChild<T extends Component>(child: T): T {
    this.children.add(child);
    if (this.loaded) child.load();
    return child;
  }
  removeChild(child: Component) {
    this.children.delete(child);
    child.unload();
  }
  registerEvent(ref: { off?: () => void }) {
    this.disposers.push(() => ref.off?.());
  }
}
export class MarkdownRenderChild extends Component {
  constructor(public containerEl: HTMLElement) {
    super();
  }
}
export class MarkdownRenderer {
  static async render() {}
}
