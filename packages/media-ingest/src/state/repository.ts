import { randomUUID } from 'node:crypto';
import type { Repository } from 'supersave';
import { MediaJobSchema, newMediaJob, type JobStatus, type MediaJob } from './media-job.js';

const checked = (job: MediaJob) => MediaJobSchema.parse(job);
export class MediaJobRepository {
  constructor(private readonly repository: Repository<MediaJob>) {}
  async get(id: string) {
    const job = await this.repository.getById(id);
    return job ? checked(job) : null;
  }
  async byPath(sourcePath: string) {
    const job = await this.repository.getOneByQuery(this.repository.createQuery().eq('sourcePath', sourcePath));
    return job ? checked(job) : null;
  }
  async observe(sourcePath: string, sourceRelativePath: string, size: number, mtimeMs: number, now = Date.now()) {
    const prior = await this.byPath(sourcePath);
    if (prior && prior.status !== 'uploaded' && (prior.observedSizeBytes !== size || prior.observedMtimeMs !== mtimeMs))
      return this.update({
        ...prior,
        observedSizeBytes: size,
        observedMtimeMs: mtimeMs,
        stableSinceMs: now,
        status: 'observing',
        updatedAtMs: now,
      });
    return (
      prior ??
      checked(
        await this.repository.create(
          newMediaJob(
            { id: randomUUID(), sourcePath, sourceRelativePath, observedSizeBytes: size, observedMtimeMs: mtimeMs },
            now
          )
        )
      )
    );
  }
  async update(job: MediaJob) {
    return checked(await this.repository.update(checked({ ...job, updatedAtMs: Date.now() })));
  }
  async transition(id: string, expected: JobStatus | JobStatus[], change: Partial<MediaJob>) {
    const job = await this.get(id);
    if (!job) throw new Error(`unknown job ${id}`);
    if (!(Array.isArray(expected) ? expected : [expected]).includes(job.status))
      throw new Error(`invalid transition from ${job.status}`);
    return this.update({ ...job, ...change });
  }
  async due(now = Date.now()) {
    return (
      await this.repository.getByQuery(
        this.repository.createQuery().in('status', ['queued', 'proxy_ready']).sort('updatedAtMs').limit(100)
      )
    )
      .map(checked)
      .filter((job) => !job.nextAttemptAtMs || job.nextAttemptAtMs <= now);
  }
  async byMediaId(mediaId: string) {
    return (await this.repository.getByQuery(this.repository.createQuery().eq('mediaId', mediaId))).map(checked);
  }
  async all() {
    return (await this.repository.getAll()).map(checked);
  }
  async summary() {
    const items = await this.all();
    return Object.groupBy(items, (item) => item.status);
  }
  async reconcile() {
    for (const job of await this.all())
      if (job.status === 'probing' || job.status === 'transcoding')
        await this.update({ ...job, status: 'queued', resumeStatus: null });
      else if (job.status === 'uploading') await this.update({ ...job, status: 'proxy_ready', resumeStatus: null });
  }
}
