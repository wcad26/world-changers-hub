import React, { useState, useEffect } from 'react';
import MemberLayout from '@/components/layout/MemberLayout';
import { useBibleVersions, useBibleBooks, useBibleChapter, BibleVersion, BibleBook } from '@/hooks/useBible';
import { useLanguage } from '@/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Book, Minus, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bible_reading_position';

interface ReadingPosition {
  versionId: string;
  bookNumber: number;
  chapter: number;
}

export default function BiblePage() {
  const { language } = useLanguage();
  const { data: versions, isLoading: versionsLoading } = useBibleVersions();
  const { data: books, isLoading: booksLoading } = useBibleBooks(language);
  
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [fontSize, setFontSize] = useState(16);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const position: ReadingPosition = JSON.parse(saved);
        if (versions && books) {
          const version = versions.find(v => v.id === position.versionId);
          const book = books.find(b => b.book_number === position.bookNumber);
          if (version) setSelectedVersion(version);
          if (book) {
            setSelectedBook(book);
            setSelectedChapter(position.chapter);
          }
        }
      } catch (e) {
        console.error('Failed to restore reading position:', e);
      }
    }
  }, [versions, books]);

  // Set defaults when data loads
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion) {
      // Default to KJV for English, Louis Segond for French
      const defaultVersion = language === 'fr' 
        ? versions.find(v => v.code === 'LSG') || versions[0]
        : versions.find(v => v.code === 'KJV') || versions[0];
      setSelectedVersion(defaultVersion);
    }
  }, [versions, language, selectedVersion]);

  useEffect(() => {
    if (books && books.length > 0 && !selectedBook) {
      setSelectedBook(books[0]); // Default to Genesis
    }
  }, [books, selectedBook]);

  // Save position when it changes
  useEffect(() => {
    if (selectedVersion && selectedBook) {
      const position: ReadingPosition = {
        versionId: selectedVersion.id,
        bookNumber: selectedBook.book_number,
        chapter: selectedChapter,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [selectedVersion, selectedBook, selectedChapter]);

  const { data: verses, isLoading: versesLoading, error: versesError } = useBibleChapter(
    selectedVersion?.id || null,
    selectedBook?.book_number || null,
    selectedChapter,
    selectedVersion
  );

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (selectedBook && books) {
      // Go to previous book's last chapter
      const currentIndex = books.findIndex(b => b.book_number === selectedBook.book_number);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapters_count);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter < selectedBook.chapters_count) {
      setSelectedChapter(selectedChapter + 1);
    } else if (selectedBook && books) {
      // Go to next book's first chapter
      const currentIndex = books.findIndex(b => b.book_number === selectedBook.book_number);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
      }
    }
  };

  const copyVerse = async (verseNum: number, text: string) => {
    const bookName = language === 'fr' && selectedBook?.name_fr 
      ? selectedBook.name_fr 
      : selectedBook?.name;
    const reference = `${bookName} ${selectedChapter}:${verseNum}`;
    const fullText = `"${text}" - ${reference} (${selectedVersion?.code})`;
    
    await navigator.clipboard.writeText(fullText);
    setCopiedVerse(verseNum);
    toast.success('Verse copied to clipboard');
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const getBookName = (book: BibleBook) => {
    return language === 'fr' && book.name_fr ? book.name_fr : book.name;
  };

  const oldTestamentBooks = books?.filter(b => b.testament === 'OT') || [];
  const newTestamentBooks = books?.filter(b => b.testament === 'NT') || [];

  if (versionsLoading || booksLoading) {
    return (
      <MemberLayout>
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[60vh] w-full" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Version and Book Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={selectedVersion?.id || ''}
            onValueChange={(value) => {
              const version = versions?.find(v => v.id === value);
              if (version) setSelectedVersion(version);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">English</div>
              {versions?.filter(v => v.language === 'en').map(version => (
                <SelectItem key={version.id} value={version.id}>
                  {version.code} - {version.name}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Français</div>
              {versions?.filter(v => v.language === 'fr').map(version => (
                <SelectItem key={version.id} value={version.id}>
                  {version.code} - {version.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedBook?.book_number.toString() || ''}
            onValueChange={(value) => {
              const book = books?.find(b => b.book_number === parseInt(value));
              if (book) {
                setSelectedBook(book);
                setSelectedChapter(1);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select book" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {language === 'fr' ? 'Ancien Testament' : 'Old Testament'}
              </div>
              {oldTestamentBooks.map(book => (
                <SelectItem key={book.id} value={book.book_number.toString()}>
                  {getBookName(book)}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                {language === 'fr' ? 'Nouveau Testament' : 'New Testament'}
              </div>
              {newTestamentBooks.map(book => (
                <SelectItem key={book.id} value={book.book_number.toString()}>
                  {getBookName(book)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chapter Selection */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedChapter.toString()}
            onValueChange={(value) => setSelectedChapter(parseInt(value))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedBook && Array.from({ length: selectedBook.chapters_count }, (_, i) => i + 1).map(ch => (
                <SelectItem key={ch} value={ch.toString()}>
                  {language === 'fr' ? 'Chapitre' : 'Chapter'} {ch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font size controls */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs w-8 text-center">{fontSize}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevChapter}
            disabled={selectedBook?.book_number === 1 && selectedChapter === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'Précédent' : 'Previous'}
          </Button>
          
          <div className="flex items-center gap-2 text-sm font-medium">
            <Book className="h-4 w-4 text-primary" />
            {selectedBook && getBookName(selectedBook)} {selectedChapter}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextChapter}
            disabled={selectedBook?.book_number === 66 && selectedChapter === selectedBook?.chapters_count}
          >
            {language === 'fr' ? 'Suivant' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Verses Content */}
        <Card>
          <CardContent className="p-4">
            {versesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : versesError ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{language === 'fr' ? 'Erreur lors du chargement' : 'Error loading content'}</p>
                <p className="text-sm mt-1">{(versesError as Error).message}</p>
                {!selectedVersion?.is_stored && (
                  <p className="text-xs mt-2 text-amber-600">
                    {language === 'fr' 
                      ? 'Cette version nécessite une clé API. Veuillez contacter l\'administrateur.'
                      : 'This version requires an API key. Please contact administrator.'}
                  </p>
                )}
              </div>
            ) : verses && verses.length > 0 ? (
              <div className="space-y-3" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                {verses.map((verse) => (
                  <p 
                    key={verse.verse} 
                    className="group cursor-pointer hover:bg-accent/50 rounded px-2 py-1 -mx-2 transition-colors"
                    onClick={() => copyVerse(verse.verse, verse.text)}
                  >
                    <sup className="text-primary font-semibold mr-1 text-xs">
                      {verse.verse}
                    </sup>
                    <span className="text-foreground">{verse.text}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex"
                    >
                      {copiedVerse === verse.verse ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'fr' ? 'Aucun contenu disponible' : 'No content available'}</p>
                <p className="text-sm mt-1">
                  {language === 'fr' 
                    ? 'Sélectionnez un livre et un chapitre pour commencer à lire.'
                    : 'Select a book and chapter to start reading.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Copyright notice for API versions */}
        {selectedVersion && !selectedVersion.is_stored && selectedVersion.copyright_info && (
          <p className="text-xs text-muted-foreground text-center">
            {selectedVersion.copyright_info}
          </p>
        )}
      </div>
    </MemberLayout>
  );
}
