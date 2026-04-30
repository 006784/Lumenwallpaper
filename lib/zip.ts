type ZipEntryInput = {
  data: Buffer;
  name: string;
};

const CRC32_TABLE = new Uint32Array(256).map((_, index) => {
  let current = index;

  for (let bit = 0; bit < 8; bit += 1) {
    current =
      current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  }

  return current >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return {
    day,
    time,
  };
}

function writeUInt16(value: number) {
  const buffer = Buffer.allocUnsafe(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function writeUInt32(value: number) {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

export function sanitizeZipPathSegment(value: string) {
  return (
    value
      .normalize("NFKC")
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "file"
  );
}

export function createZipArchive(entries: ZipEntryInput[]) {
  const now = dosDateTime(new Date());
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const checksum = crc32(entry.data);
    const size = entry.data.byteLength;
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0x0800),
      writeUInt16(0),
      writeUInt16(now.time),
      writeUInt16(now.day),
      writeUInt32(checksum),
      writeUInt32(size),
      writeUInt32(size),
      writeUInt16(name.byteLength),
      writeUInt16(0),
      name,
    ]);

    localParts.push(localHeader, entry.data);

    centralParts.push(
      Buffer.concat([
        writeUInt32(0x02014b50),
        writeUInt16(20),
        writeUInt16(20),
        writeUInt16(0x0800),
        writeUInt16(0),
        writeUInt16(now.time),
        writeUInt16(now.day),
        writeUInt32(checksum),
        writeUInt32(size),
        writeUInt32(size),
        writeUInt16(name.byteLength),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt32(0),
        writeUInt32(offset),
        name,
      ]),
    );

    offset += localHeader.byteLength + size;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(centralDirectory.byteLength),
    writeUInt32(offset),
    writeUInt16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, end]);
}
