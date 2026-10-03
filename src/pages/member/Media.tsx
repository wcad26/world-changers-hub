import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Play, Search, Bookmark, Clock, Download } from 'lucide-react';

export default function MemberMedia() {
  // Mock data - will be replaced with actual data when backend is implemented
  const sermons = [
    { id: 1, title: "Walking in Faith", speaker: "Pastor John", date: "2024-12-15", duration: "45 min", thumbnail: "/placeholder.svg" },
    { id: 2, title: "Love and Forgiveness", speaker: "Pastor Mary", date: "2024-12-08", duration: "38 min", thumbnail: "/placeholder.svg" },
    { id: 3, title: "Hope in Trials", speaker: "Pastor John", date: "2024-12-01", duration: "42 min", thumbnail: "/placeholder.svg" },
  ];

  const videos = [
    { id: 1, title: "Youth Ministry Highlights", category: "Ministry", date: "2024-12-10", duration: "12 min", thumbnail: "/placeholder.svg" },
    { id: 2, title: "Community Outreach Project", category: "Outreach", date: "2024-12-05", duration: "18 min", thumbnail: "/placeholder.svg" },
    { id: 3, title: "Worship Team Practice", category: "Music", date: "2024-11-28", duration: "25 min", thumbnail: "/placeholder.svg" },
  ];

  const audioBooks = [
    { id: 1, title: "Purpose Driven Life", author: "Rick Warren", progress: 65, duration: "8h 30m" },
    { id: 2, title: "Mere Christianity", author: "C.S. Lewis", progress: 0, duration: "6h 45m" },
    { id: 3, title: "The Prayer of Jabez", author: "Bruce Wilkinson", progress: 100, duration: "2h 15m" },
  ];

  const watchHistory = [
    { id: 1, title: "Walking in Faith", type: "Sermon", watched_date: "2024-12-15" },
    { id: 2, title: "Youth Ministry Highlights", type: "Video", watched_date: "2024-12-10" },
  ];

  const bookmarks = [
    { id: 1, title: "Love and Forgiveness", type: "Sermon", bookmarked_date: "2024-12-08" },
    { id: 2, title: "Purpose Driven Life - Chapter 5", type: "Audio", bookmarked_date: "2024-12-05" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Play className="h-6 w-6 text-primary" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search sermons, videos, audio books..." 
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="sermons" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sermons">Sermons</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="audio">Audio Books</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="sermons" className="space-y-4">
          <div className="grid gap-4">
            {sermons.map((sermon) => (
              <Card key={sermon.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{sermon.title}</h3>
                      <p className="text-sm text-muted-foreground">By {sermon.speaker}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">{sermon.date}</span>
                        <span className="text-xs text-muted-foreground">{sermon.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      <Button size="sm" variant="outline">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid gap-4">
            {videos.map((video) => (
              <Card key={video.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{video.title}</h3>
                      <Badge variant="secondary" className="mb-2">{video.category}</Badge>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{video.date}</span>
                        <span className="text-xs text-muted-foreground">{video.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Watch
                      </Button>
                      <Button size="sm" variant="outline">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <div className="grid gap-4">
            {audioBooks.map((book) => (
              <Card key={book.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">By {book.author}</p>
                      <p className="text-xs text-muted-foreground mt-1">{book.duration}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${book.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        {book.progress > 0 ? 'Continue' : 'Start'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {watchHistory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Watched on {new Date(item.watched_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      Watch Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-4">
          <div className="grid gap-4">
            {bookmarks.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Bookmarked on {new Date(item.bookmarked_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      <Button size="sm" variant="outline">
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}