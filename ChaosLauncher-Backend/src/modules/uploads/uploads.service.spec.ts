import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  let dir: string;
  let service: UploadsService;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-test-'));
    const config = { get: (k: string) => ({ 'storage.uploadDir': dir, 'storage.staticServePath': '/static' }[k]) } as any;
    service = new UploadsService(config);
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const file = (name: string, buffer: Buffer) => ({ originalname: name, buffer, size: buffer.length, mimetype: 'image/png' }) as any;
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

  it('guarda un PNG real', async () => {
    const res = await service.saveFile(file('icon.png', png), 'icons');
    expect(res.relativeUrl).toMatch(/^\/static\/icons\/icons_/);
    expect(fs.existsSync(path.join(dir, 'icons', res.fileName))).toBe(true);
  });

  it('rechaza SVG', async () => {
    await expect(service.saveFile(file('x.svg', Buffer.from('<svg onload=alert(1)></svg>....')), 'general')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza contenido que no coincide con la extensión', async () => {
    await expect(service.saveFile(file('evil.png', Buffer.from('<html><script>alert(1)</script></html>')), 'general')).rejects.toBeInstanceOf(BadRequestException);
  });
});
