import { IDBPDatabase } from 'idb/build';
import { DBSchema, openDB } from 'idb';
import { PFDatabaseAdapter } from './pf-database-adapter.model';
import { MiniObservable } from '../util/mini-observable';

interface MyDb extends DBSchema {
  [key: string]: any;
}

export class PFIndexedDbAdapter implements PFDatabaseAdapter {
  private _db?: IDBPDatabase<MyDb>;
  private _isReady$: MiniObservable<boolean> = new MiniObservable<boolean>(false);

  private _dbName: string;
  private _dbMainName: string;
  private _dbVersion: number;

  constructor(cfg: { dbName: string; dbMainName: string; version: number }) {
    this._dbName = cfg.dbName;
    this._dbMainName = cfg.dbMainName;
    this._dbVersion = cfg.version;
  }

  public async init(): Promise<IDBPDatabase<MyDb>> {
    try {
      this._db = await openDB<MyDb>(this._dbName, this._dbVersion, {
        // upgrade(db: IDBPDatabase<MyDb>, oldVersion: number, newVersion: number | null, transaction: IDBPTransaction<MyDb>) {
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        upgrade(db: IDBPDatabase<MyDb>, oldVersion: number, newVersion: number | null) {
          console.log('IDB UPGRADE', oldVersion, newVersion);
          db.createObjectStore(this._dbMainName);
        },
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        blocked(): void {
          alert('IDB BLOCKED');
        },
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        blocking(): void {
          alert('IDB BLOCKING');
        },
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        terminated(): void {
          alert('IDB TERMINATED');
        },
      });
    } catch (e) {
      this._isReady$.next(false);
      throw new Error(e as any);
    }

    this._isReady$.next(true);
    return this._db;
  }

  async teardown(): Promise<void> {
    this._db?.close();
  }

  async load(key: string): Promise<unknown> {
    await this._afterReady();
    return await (this._db as IDBPDatabase<MyDb>).get(this._dbMainName, key);
  }

  async save(key: string, data: unknown): Promise<unknown> {
    await this._afterReady();
    return await (this._db as IDBPDatabase<MyDb>).put(this._dbMainName, data, key);
  }

  async remove(key: string): Promise<unknown> {
    await this._afterReady();
    return await (this._db as IDBPDatabase<MyDb>).delete(this._dbMainName, key);
  }

  async clearDatabase(): Promise<unknown> {
    await this._afterReady();
    return await (this._db as IDBPDatabase<MyDb>).clear(this._dbMainName);
  }

  private async _afterReady(): Promise<void> {
    if (this._isReady$.value) {
      return;
    }
    return new Promise<void>((resolve) => {
      const unsubscribe = this._isReady$.subscribe((isReady) => {
        if (isReady) {
          resolve();
          unsubscribe();
        }
      });
    });
  }
}
