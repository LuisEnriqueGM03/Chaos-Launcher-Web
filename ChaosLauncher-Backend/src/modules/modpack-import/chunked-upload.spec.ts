import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { ChunkedUploadService } from './chunked-upload.service';

const ana = { id: 'ana', role: 'USER' };
const beto = { id: 'beto', role: 'USER' };

describe('ChunkedUploadService', () => {
  let svc: ChunkedUploadService;
  const created: string[] = [];

  beforeEach(() => {
    svc = new ChunkedUploadService();
  });

  afterEach(() => {
    for (const p of created.splice(0)) fs.rmSync(p, { force: true });
  });

  it('ensambla las partes en orden y devuelve el archivo completo', async () => {
    const { uploadId } = svc.init(ana, 'modpack.zip', 10);
    await svc.appendChunk(uploadId, ana, 0, Buffer.from('hola '));
    await svc.appendChunk(uploadId, ana, 1, Buffer.from('mundo'));
    const filePath = svc.complete(uploadId, ana);
    created.push(filePath);
    expect(fs.readFileSync(filePath, 'utf8')).toBe('hola mundo');
  });

  it('reenviar una parte ya recibida no la duplica (reintentos de red)', async () => {
    const { uploadId } = svc.init(ana, 'm.zip', 6);
    await svc.appendChunk(uploadId, ana, 0, Buffer.from('abc'));
    const again = await svc.appendChunk(uploadId, ana, 0, Buffer.from('abc'));
    expect(again.received).toBe(3);
    await svc.appendChunk(uploadId, ana, 1, Buffer.from('def'));
    const filePath = svc.complete(uploadId, ana);
    created.push(filePath);
    expect(fs.readFileSync(filePath, 'utf8')).toBe('abcdef');
  });

  it('rechaza partes fuera de orden', async () => {
    const { uploadId } = svc.init(ana, 'm.zip', 6);
    await expect(svc.appendChunk(uploadId, ana, 1, Buffer.from('xyz'))).rejects.toBeInstanceOf(BadRequestException);
    svc.discard(uploadId);
  });

  it('rechaza recibir más bytes de los anunciados', async () => {
    const { uploadId } = svc.init(ana, 'm.zip', 3);
    await expect(svc.appendChunk(uploadId, ana, 0, Buffer.from('demasiado'))).rejects.toBeInstanceOf(BadRequestException);
    svc.discard(uploadId);
  });

  it('no permite completar un ZIP incompleto', async () => {
    const { uploadId } = svc.init(ana, 'm.zip', 10);
    await svc.appendChunk(uploadId, ana, 0, Buffer.from('abc'));
    expect(() => svc.complete(uploadId, ana)).toThrow(BadRequestException);
    svc.discard(uploadId);
  });

  it('otro usuario no puede usar ni completar la subida', async () => {
    const { uploadId } = svc.init(ana, 'm.zip', 3);
    await expect(svc.appendChunk(uploadId, beto, 0, Buffer.from('abc'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(() => svc.complete(uploadId, beto)).toThrow(ForbiddenException);
    svc.discard(uploadId);
  });

  it('valida el nombre y el tamaño al iniciar', () => {
    expect(() => svc.init(ana, 'virus.exe', 10)).toThrow(BadRequestException);
    expect(() => svc.init(ana, 'm.zip', 0)).toThrow(BadRequestException);
    expect(() => svc.init(ana, 'm.zip', 2 * 1024 * 1024 * 1024)).toThrow(BadRequestException);
  });

  it('descartar elimina el archivo temporal y la sesión', async () => {
    const { uploadId } = svc.init(ana, 'm.zip', 3);
    await svc.appendChunk(uploadId, ana, 0, Buffer.from('abc'));
    svc.discard(uploadId);
    await expect(svc.appendChunk(uploadId, ana, 1, Buffer.from('d'))).rejects.toBeInstanceOf(NotFoundException);
  });
});
