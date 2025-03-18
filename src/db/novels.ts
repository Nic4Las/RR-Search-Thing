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
    cluster_PaCMAP: number;
    x_PaCMAP: number;
    y_PaCMAP: number;
    cluster_UMAP: number;
    x_UMAP: number;
    y_UMAP: number;
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
    cluster_PaCMAP: number;
    x_PaCMAP: number;
    y_PaCMAP: number;
    cluster_UMAP: number;
    x_UMAP: number;
    y_UMAP: number;
}

const novelDB = new Dexie('Novels') as Dexie & {
    novels: EntityTable<Novel, "embeddingsIndex">;
};

novelDB.version(1).stores({
    novels: 'embeddingsIndex,title,fictionId,url,*tags,label,followingUsers,rating,pages,views,chapters,lastUpdated,description,*titleWords,cluster,x,y'
});

export {novelDB};
export type {Novel, NovelRaw};

export const Tags = ['Progression', 'War and Military', 'Comedy', 'Male Lead', 'Strong Lead', 'Action', 'Adventure', 'Romance', 'Magic', 'Grimdark', 'High Fantasy', 'Artificial Intelligence', 'Female Lead', 'Fantasy', 'Mystery', 'Supernatural', 'Multiple Lead Characters', 'Post Apocalyptic', 'Non-Human Lead', 'Genetically Engineered ', 'Tragedy', 'Horror', 'Psychological', 'Sci-fi', 'Cyberpunk', 'LitRPG', 'Portal Fantasy / Isekai', 'Anti-Hero Lead', 'Drama', 'Secret Identity', 'Strategy', 'Harem', 'GameLit', 'Soft Sci-fi', 'Reincarnation', 'Time Loop', 'Villainous Lead', 'Low Fantasy', 'Dungeon', 'Historical', 'Mythos', 'Urban Fantasy', 'Slice of Life', 'Ruling Class', 'Attractive Lead', 'Technologically Engineered', 'First Contact', 'Space Opera', 'Time Travel', 'Contemporary', 'Xianxia', 'Martial Arts', 'School Life', 'Short Story', 'Super Heroes', 'Reader Interactive', 'Dystopia', 'Satire', 'Wuxia', 'Hard Sci-fi', 'Virtual Reality', 'Gender Bender', 'Steampunk', 'Sports'];