<script lang="ts">
  import {
    Book,
    Eye,
    Heart,
    Star,
    ChevronDown,
    ChevronUp,
    BookOpen,
  } from "lucide-svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent } from "$lib/components/ui/card";
  import type { Novel } from "src/db/novels";

  // Sample book data
  const books: Novel[] = [
    {
      id: 1,
      title: "The Arcane Code",
	  titleWords: [],
	  fictionId: "TAC123",
      url: "https://novelplatform.com/the-arcane-code",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["fantasy", "magic", "adventure"],
      label: "Popular",
      followingUsers: 1200,
      rating: 4.8,
      pages: 350,
      views: 25000,
      chapters: 45,
      lastUpdated: 1709925600, // Unix timestamp
      description:
        "A young scholar discovers an ancient grimoire that rewrites history itself.",
    },
    {
      id: 2,
      title: "Cyber Nexus",
	  titleWords: [],
	  fictionId: "CN456",
      url: "https://novelplatform.com/cyber-nexus",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["sci-fi", "cyberpunk", "thriller"],
      label: "Trending",
      followingUsers: 980,
      rating: 4.5,
      pages: 410,
      views: 20000,
      chapters: 50,
      lastUpdated: 1709849200,
      description:
        "In a dystopian future, a rogue AI threatens to take over the world's networks.",
    },
    {
      id: 3,
      title: "Dungeon Lord's Gamble",
	  titleWords: [],
	  fictionId: "DLG789",
      url: "https://novelplatform.com/dungeon-lords-gamble",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["fantasy", "isekai", "action"],
      label: "New Release",
      followingUsers: 560,
      rating: 4.2,
      pages: 320,
      views: 15000,
      chapters: 30,
      lastUpdated: 1709743200,
      description:
        "A gamer wakes up as a dungeon lord in a world of monsters and magic.",
    },
    {
      id: 4,
      title: "Quantum Paradox",
	  titleWords: [],
	  fictionId: "QP101",
      url: "https://novelplatform.com/quantum-paradox",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["sci-fi", "mystery", "time travel"],
      label: "Editor’s Pick",
      followingUsers: 730,
      rating: 4.7,
      pages: 280,
      views: 18000,
      chapters: 40,
      lastUpdated: 1709656800,
      description:
        "A scientist’s experiment with quantum mechanics leads to unexpected consequences.",
    },
    {
      id: 5,
      title: "Revenant's Vow",
	  titleWords: [],
	  fictionId: "RV555",
      url: "https://novelplatform.com/revenants-vow",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["dark fantasy", "revenge", "mystery"],
      label: "Top Rated",
      followingUsers: 1500,
      rating: 4.9,
      pages: 500,
      views: 40000,
      chapters: 75,
      lastUpdated: 1709570400,
      description:
        "A murdered knight is resurrected to seek vengeance upon his betrayers.",
    },
    {
      id: 6,
      title: "Neon Samurai",
	  titleWords: [],
	  fictionId: "NS777",
      url: "https://novelplatform.com/neon-samurai",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["cyberpunk", "action", "martial arts"],
      label: "Rising Star",
      followingUsers: 620,
      rating: 4.3,
      pages: 390,
      views: 14000,
      chapters: 35,
      lastUpdated: 1709484000,
      description:
        "In a neon-lit Tokyo, a lone swordsman fights against corporate overlords.",
    },
    {
      id: 7,
      title: "The Immortal Bard",
	  titleWords: [],
	  fictionId: "IB333",
      url: "https://novelplatform.com/the-immortal-bard",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["historical fantasy", "adventure", "romance"],
      label: "Featured",
      followingUsers: 810,
      rating: 4.6,
      pages: 370,
      views: 23000,
      chapters: 48,
      lastUpdated: 1709397600,
      description:
        "A poet cursed with immortality witnesses the rise and fall of empires.",
    },
    {
      id: 8,
      title: "Celestial Tyrant",
	  titleWords: [],
	  fictionId: "CT999",
      url: "https://novelplatform.com/celestial-tyrant",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["cultivation", "action", "power fantasy"],
      label: "Bestseller",
      followingUsers: 2000,
      rating: 4.7,
      pages: 600,
      views: 50000,
      chapters: 100,
      lastUpdated: 1709311200,
      description:
        "A fallen prince discovers the secret to godhood and embarks on a path of domination.",
    },
    {
      id: 9,
      title: "The Clockwork Alchemist",
	  titleWords: [],
	  fictionId: "TCA222",
      url: "https://novelplatform.com/the-clockwork-alchemist",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["steampunk", "mystery", "alchemy"],
      label: "Critically Acclaimed",
      followingUsers: 940,
      rating: 4.8,
      pages: 410,
      views: 27000,
      chapters: 55,
      lastUpdated: 1709224800,
      description:
        "A young alchemist unravels a conspiracy hidden within a clockwork metropolis.",
    },
    {
      id: 10,
      title: "Echoes of the Void",
	  titleWords: [],
	  fictionId: "EV444",
      url: "https://novelplatform.com/echoes-of-the-void",
      cover: "https://www.royalroad.com/dist/img/nocover-new-min.png",
      tags: ["horror", "sci-fi", "cosmic horror"],
      label: "Spine-Chilling",
      followingUsers: 780,
      rating: 4.4,
      pages: 360,
      views: 19000,
      chapters: 42,
      lastUpdated: 1709138400,
      description:
        "An astronaut’s mission goes awry when he starts hearing voices from the abyss.",
    },
  ];

  let expandedBooks = $state<number[]>([]);

  function toggleDescription(bookId: number) {
    if (expandedBooks.includes(bookId)) {
      expandedBooks = expandedBooks.filter((id) => id !== bookId);
    } else {
      expandedBooks = [...expandedBooks, bookId];
    }
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold mb-4">Recommended Books</h2>
  <div class="space-y-4">
    {#each books as book (book.id)}
      <Card class="overflow-hidden">
        <CardContent class="p-0">
          <div class="flex flex-col md:flex-row">
            <div class="relative w-full md:w-48 h-64 md:h-auto shrink-0">
              <img
                src={book.cover !== ""
                  ? book.cover
                  : "https://www.royalroad.com/dist/img/nocover-new-min.png"}
                alt={`Cover of ${book.title}`}
                class="object-cover absolute inset-0 w-full h-full"
              />
            </div>
            <div class="p-6 flex-1">
              <div
                class="flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div>
                  <h3 class="text-xl font-bold">{book.title}</h3>
                  <p class="text-muted-foreground mb-2">by Temp.</p>
                  <div class="flex flex-wrap gap-2 mb-4">
                    {#each book.tags as tag}
                      <Badge variant="secondary">
                        {tag}
                      </Badge>
                    {/each}
                  </div>
                </div>
                <div class="flex flex-row md:flex-col gap-4 md:text-right">
                  <div class="flex items-center gap-1">
                    <Star class="h-4 w-4 fill-primary text-primary" />
                    <span class="text-sm font-medium">{book.rating}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Heart class="h-4 w-4" />
                    <span class="text-sm">{book.followingUsers}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Eye class="h-4 w-4" />
                    <span class="text-sm">{book.views}</span>
                  </div>
                </div>
              </div>

              <div class="mt-4">
                <p class="text-sm">
                  {expandedBooks.includes(book.id)
                    ? book.description
                    : book.description.slice(0, 100) + "..."}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  class="mt-2 h-8 px-2"
                  onclick={() => toggleDescription(book.id)}
                >
                  {#if expandedBooks.includes(book.id)}
                    <span class="flex items-center">
                      Show less <ChevronUp class="ml-1 h-4 w-4" />
                    </span>
                  {:else}
                    <span class="flex items-center">
                      Read more <ChevronDown class="ml-1 h-4 w-4" />
                    </span>
                  {/if}
                </Button>
              </div>

              <div
                class="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground"
              >
                <div class="flex items-center gap-1">
                  <Book class="h-4 w-4" />
                  <span>{book.chapters} chapters</span>
                </div>
                <div class="flex items-center gap-1">
                  <BookOpen class="h-4 w-4" />
                  <span>{book.pages} pages</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
