/**
 * Mutable FILO stack object.
 */
export default class Stack<T> {

  private items: T[];

  constructor() {
    this.items = [];
  }

  push(t: T): void {
    this.items.push(t);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(n: number = 0): T | undefined {
    const idx = this.items.length + -1 + -n;
    return this.items[idx];
  }

  size(): number {
    return this.items.length;
  }

  *drain(): IterableIterator<T> {
    for (let i=this.items.length; i>0; i--) {
      yield this.items[i-1];
    }
    this.items.length = 0;
  }
}
