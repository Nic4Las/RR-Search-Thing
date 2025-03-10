import Dexie, { type EntityTable } from 'dexie';


interface Novel {
    id: number;
    title: string;
    fictionId: string;
    url: string;
    cover: string;
    tags: string[];
    label: string;
    followingUsers: Number;
    rating: Number;
    pages: Number;
    views: Number;
    chapters: Number;
    lastUpdated: Number;
    description: string;
    titleWords: string[];
}

interface NovelRaw {
    title: string;
    fictionId: string;
    url: string;
    cover?: string;
    tags: string;
    label: string;
    followingUsers: number;
    rating: number;
    pages: number;
    views: number;
    chapters: number;
    lastUpdated: number;
    description: string;
}

const novelDB = new Dexie('Novels') as Dexie & {
    novels: EntityTable<Novel, "id">;
};

novelDB.version(1).stores({
    novels: '++id,title,fictionId,url,*tags,label,followingUsers,rating,pages,views,chapters,lastUpdated,description,*titleWords'
});

export {novelDB};
export type {Novel, NovelRaw};