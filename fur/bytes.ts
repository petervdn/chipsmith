/**
 * Little-endian bytes, written and read: the numbers, strings and blocks a .fur file is made of.
 * Knows nothing of Furnace.
 */

/** Bytes written one value after another, kept until `getBytes`. */
export class ByteWriter {
  private parts: Uint8Array[] = [];
  private length = 0;

  /**
   * Writes one byte.
   *
   * @param value - The byte, 0 to 255.
   * @returns This writer, to write the next value.
   */
  u8(value: number): this {
    return this.add(Uint8Array.of(value));
  }

  /**
   * Writes an unsigned 16-bit number, little-endian.
   *
   * @param value - The number.
   * @returns This writer, to write the next value.
   */
  u16(value: number): this {
    return this.withView(2, (view) => view.setUint16(0, value, true));
  }

  /**
   * Writes an unsigned 32-bit number, little-endian.
   *
   * @param value - The number.
   * @returns This writer, to write the next value.
   */
  u32(value: number): this {
    return this.withView(4, (view) => view.setUint32(0, value, true));
  }

  /**
   * Writes a signed 32-bit number, little-endian.
   *
   * @param value - The number.
   * @returns This writer, to write the next value.
   */
  i32(value: number): this {
    return this.withView(4, (view) => view.setInt32(0, value, true));
  }

  /**
   * Writes a 32-bit float, little-endian.
   *
   * @param value - The number.
   * @returns This writer, to write the next value.
   */
  f32(value: number): this {
    return this.withView(4, (view) => view.setFloat32(0, value, true));
  }

  /**
   * Writes a string as UTF-8 with a zero byte after it.
   *
   * @param text - The string.
   * @returns This writer, to write the next value.
   */
  cString(text: string): this {
    this.add(new TextEncoder().encode(text));
    return this.u8(0);
  }

  /**
   * Writes ASCII text with no ending, such as a block's four-letter id.
   *
   * @param text - The text, one byte to a character.
   * @returns This writer, to write the next value.
   */
  ascii(text: string): this {
    return this.add(Uint8Array.from(text, (char) => char.charCodeAt(0)));
  }

  /**
   * Writes bytes as they are.
   *
   * @param bytes - The bytes.
   * @returns This writer, to write the next value.
   */
  add(bytes: Uint8Array | readonly number[]): this {
    const part = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
    this.parts.push(part);
    this.length += part.length;
    return this;
  }

  /**
   * Writes `count` copies of one byte.
   *
   * @param value - The byte.
   * @param count - How many times it is written.
   * @returns This writer, to write the next value.
   */
  fill(value: number, count: number): this {
    return this.add(new Uint8Array(count).fill(value));
  }

  /**
   * Returns everything written, as one array.
   *
   * @returns The bytes written, in order.
   */
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

  /**
   * Reads one byte.
   *
   * @returns The byte, 0 to 255.
   */
  u8(): number {
    this.need(1);
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  /**
   * Reads an unsigned 16-bit number, little-endian.
   *
   * @returns The number.
   */
  u16(): number {
    this.need(2);
    const value = this.view.getUint16(this.position, true);
    this.position += 2;
    return value;
  }

  /**
   * Reads an unsigned 32-bit number, little-endian.
   *
   * @returns The number.
   */
  u32(): number {
    this.need(4);
    const value = this.view.getUint32(this.position, true);
    this.position += 4;
    return value;
  }

  /**
   * Reads a signed 32-bit number, little-endian.
   *
   * @returns The number.
   */
  i32(): number {
    this.need(4);
    const value = this.view.getInt32(this.position, true);
    this.position += 4;
    return value;
  }

  /**
   * Reads a signed 16-bit number, little-endian.
   *
   * @returns The number.
   */
  i16(): number {
    this.need(2);
    const value = this.view.getInt16(this.position, true);
    this.position += 2;
    return value;
  }

  /**
   * Reads a signed byte.
   *
   * @returns The number, -128 to 127.
   */
  i8(): number {
    this.need(1);
    const value = this.view.getInt8(this.position);
    this.position += 1;
    return value;
  }

  /**
   * Reads a 32-bit float, little-endian.
   *
   * @returns The number.
   */
  f32(): number {
    this.need(4);
    const value = this.view.getFloat32(this.position, true);
    this.position += 4;
    return value;
  }

  /**
   * Reads `count` bytes as they are.
   *
   * @param count - How many bytes to read.
   * @returns The bytes, a view into the bytes being read (not a copy).
   */
  take(count: number): Uint8Array {
    this.need(count);
    const bytes = this.bytes.subarray(this.position, this.position + count);
    this.position += count;
    return bytes;
  }

  /**
   * Reads a UTF-8 string up to its zero byte, and the zero byte too. Throws if no zero byte
   * follows.
   *
   * @returns The string, without the zero byte.
   */
  cString(): string {
    const end = this.bytes.indexOf(0, this.position);
    if (end < 0) throw new Error(`no end to the string at ${this.position}`);
    const text = new TextDecoder().decode(this.bytes.subarray(this.position, end));
    this.position = end + 1;
    return text;
  }

  /**
   * Reads `count` bytes as ASCII text.
   *
   * @param count - How many bytes to read.
   * @returns The text, one character to a byte.
   */
  ascii(count: number): string {
    return String.fromCharCode(...this.take(count));
  }

  private need(count: number): void {
    if (this.position + count > this.bytes.length) {
      throw new Error(`read past the end at ${this.position} (+${count} of ${this.bytes.length})`);
    }
  }
}
