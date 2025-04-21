interface Emitter {
  startScope(name: string): void;
  endScope(): void;
  addText(text: string): void;
  toHTML(): string;
  finalize(): void;
  __addSublanguage(emitter: Emitter, subLanguageName: string): void;
}

export class HastEmitter implements Emitter {
  private root: any = { type: 'root', children: [] };
  private stack: any = [this.root];
  private options: { classPrefix: string } = { classPrefix: 'hljs-' };

  constructor(options: Partial<{ classPrefix: string }>) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  addText(value: string) {
    if (value === '') return;

    const current = this.stack[this.stack.length - 1];
    const tail = current.children[current.children!.length - 1];

    if (tail && tail.type === 'text') {
      tail.value += value;
    } else {
      current.children.push({ type: 'text', value });
    }
  }

  startScope(rawName: unknown) {
    this.openNode(String(rawName));
  }

  endScope() {
    this.closeNode();
  }

  __addSublanguage(other: HastEmitter, name: string) {
    const current = this.stack[this.stack.length - 1];
    // Assume only element content.
    const results = /** @type {Array<ElementContent>} */ other.root.children;

    if (name) {
      current.children.push({
        type: 'element',
        tagName: 'span',
        properties: { className: [name] },
        children: results,
      });
    } else {
      current.children.push(...results);
    }
  }

  openNode(name: string) {
    const { options } = this;

    // First “class” gets the prefix. Rest gets a repeated underscore suffix.
    const className = name.split('.').map((d, i) => (i ? d + '_'.repeat(i) : options.classPrefix + d));
    const current = this.stack[this.stack.length - 1];
    const child = {
      type: 'element',
      tagName: 'span',
      properties: { className },
      children: [],
    };

    current.children.push(child);
    this.stack.push(child);
  }

  closeNode() {
    this.stack.pop();
  }

  finalize() {}

  toHTML() {
    return '';
  }
}
