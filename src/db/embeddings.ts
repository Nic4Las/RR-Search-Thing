import Dexie, { type EntityTable } from 'dexie';

interface Embedding {
    vectors: Int8Array;
    id: number;
}

const vectorDB = new Dexie('Embeddings') as Dexie & {
    embeddings: EntityTable<Embedding, "id">;
};

vectorDB.version(1).stores({
    embeddings: '++id,vectors'
});

export type { Embedding };
export default vectorDB;