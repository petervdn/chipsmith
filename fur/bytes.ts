/**
 * Little-endian bytes, written and read: the numbers, strings and blocks a .fur file is made of.
 * Knows nothing of Furnace.
 */

/** Bytes written one value after another, kept until `getBytes`. */
export class ByteWriter {
  private parts: Uint8Array[] = [];
  private length = 0;

  /** One byte. */
  u8(value: number): this {
    return this.add(Uint8Array.of(value));
  }

  /** An unsigned 16-bit number. */
  u16(value: number): this {
    return this.withView(2, (view) => view.setUint16(0, value, true));
  }

  /** An unsigned 32-bit number. */
  u32(value: number): this {
    return this.withView(4, (view) => view.setUint32(0, value, true));
  }

  /** A signed 32-bit number. */
  i32(value: number): this {
    return this.withView(4, (view) => view.setInt32(0, value, true));
  }

  /** A 32-bit float. */
  f32(value: number): this {
    return this.withView(4, (view) => view.setFloat32(0, value, true));
  }

  /** A string as UTF-8 with a zero byte after it. */
  cString(text: string): this {
    this.add(new TextEncoder().encode(text));
    return this.u8(0);
  }

  /** ASCII text with no ending, such as a block's four-letter id. */
  ascii(text: string): this {
    return this.add(Uint8Array.from(text, (char) => char.charCodeAt(0)));
  }

  /** Bytes as they are. */
  add(bytes: Uint8Array | readonly number[]): this {
    const part = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
    this.parts.push(part);
    this.length += part.length;
    return this;
  }

  /** `count` copies of one byte. */
  fill(value: number, count: number): this {
    return this.add(new Uint8Array(count).fill(value));
  }

  /** Everything written, as one array. */
  getBytes(): Uint8Array {
    const bytes = new Uint8Array(this.length);
    let offset = 0;
    for (const part of this.parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    return bytes;
  }

  private withView(size: number, write: (view: DataView) => void): this {
    const bytes = new Uint8Array(size);
    write(new DataView(bytes.buffer));
    return this.add(bytes);
  }
}

/** Bytes read one value after another from a position that moves on. */
export class ByteReader {
  readonly bytes: Uint8Array;
  position: number;
  private readonly view: DataView;

  constructor(bytes: Uint8Array, position = 0) {
    this.bytes = bytes;
    this.position = position;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  /** One byte. */
  u8(): number {
    this.need(1);
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  /** An unsigned 16-bit number. */
  u16(): number {
    this.need(2);
    const value = this.view.getUint16(this.position, true);
    this.position += 2;
    return value;
  }

  /** An unsigned 32-bit number. */
  u32(): number {
    this.need(4);
    const value = this.view.getUint32(this.position, true);
    this.position += 4;
    return value;
  }

  /** A signed 32-bit number. */
  i32(): number {
    this.need(4);
    const value = this.view.getInt32(this.position, true);
    this.position += 4;
    return value;
  }

  /** A signed 16-bit number. */
  i16(): number {
    this.need(2);
    const value = this.view.getInt16(this.position, true);
    this.position += 2;
    return value;
  }

  /** A signed byte. */
  i8(): number {
    this.need(1);
    const value = this.view.getInt8(this.position);
    this.position += 1;
    return value;
  }

  /** A 32-bit float. */
  f32(): number {
    this.need(4);
    const value = this.view.getFloat32(this.position, true);
    this.position += 4;
    return value;
  }

  /** `count` bytes as they are. */
  take(count: number): Uint8Array {
    this.need(count);
    const bytes = this.bytes.subarray(this.position, this.position + count);
    this.position += count;
    return bytes;
  }

  /** A UTF-8 string up to its zero byte, the zero byte read too. */
  cString(): string {
    const end = this.bytes.indexOf(0, this.position);
    if (end < 0) throw new Error(`no end to the string at ${this.position}`);
    const text = new TextDecoder().decode(this.bytes.subarray(this.position, end));
    this.position = end + 1;
    return text;
  }

  /** `count` bytes as ASCII text. */
  ascii(count: number): string {
    return String.fromCharCode(...this.take(count));
  }

  private need(count: number): void {
    if (this.position + count > this.bytes.length) {
      throw new Error(`read past the end at ${this.position} (+${count} of ${this.bytes.length})`);
    }
  }
}
