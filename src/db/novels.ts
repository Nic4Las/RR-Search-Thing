import Dexie, { type EntityTable } from 'dexie';


interface Novel {
    title: string;
    fictionId: string;
    url: string;
    cover: string;
    tags: string[];
    label: string;
    followingUsers: number;
    rating: number;
    pages: number;
    views: number;
    chapters: number;
    lastUpdated: number;
    description: string;
    titleWords: string[];
    embeddingsIndex: number;
}

interface NovelRaw {
    title: string;
    fictionId: string;
    url: string;
    cover?: string;
    tags: string[];
    label: string;
    followingUsers: number;
    rating: number;
    pages: number;
    views: number;
    chapters: number;
    lastUpdated: number;
    description: string;
    embeddingsIndex: number;
}

const novelDB = new Dexie('Novels') as Dexie & {
    novels: EntityTable<Novel, "embeddingsIndex">;
};

novelDB.version(1).stores({
    novels: 'embeddingsIndex,title,fictionId,url,*tags,label,followingUsers,rating,pages,views,chapters,lastUpdated,description,*titleWords'
});

export {novelDB};
export type {Novel, NovelRaw};