export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          created_at: string;
        };
      };
      songs: {
        Row: {
          id: number;
          title: string;
          artist: string;
          cover_url: string | null;
          lyrics: string | null;
          lyrics_lrc: string | null;
          storage_path: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      song_downloads: {
        Row: {
          id: number;
          user_id: string;
          song_id: number;
          downloaded_at: string;
        };
      };
      listening_events: {
        Row: {
          id: number;
          user_id: string;
          song_id: number;
          session_id: string;
          started_at: string;
          ended_at: string | null;
          seconds_listened: number;
          is_offline: boolean;
          created_at: string;
        };
      };
      support_declarations: {
        Row: {
          id: number;
          user_id: string;
          amount_fcfa: number;
          channel: string;
          app_version: string | null;
          created_at: string;
        };
      };
      song_likes: {
        Row: {
          song_id: number;
          user_id: string;
          created_at: string;
        };
      };
      song_comments: {
        Row: {
          id: number;
          song_id: number;
          user_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
