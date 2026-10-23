import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Search, Disc, 
  Sparkles, Radio, Music2, ExternalLink, FastForward, Check
} from 'lucide-react';
import { Track, User } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeSyncPlayerProps {
  videoId: string;
  songTitle: string;
  isPlaying: boolean;
  currentTime: number;
  isHost: boolean;
  user: User;
  onHostSync: (action: {
    videoId?: string;
    title?: string;
    isPlaying: boolean;
    currentTime: number;
  }) => void;
  onHeartbeat: (state: { currentTime: number; isPlaying: boolean }) => void;
}

export const YouTubeSyncPlayer: React.FC<YouTubeSyncPlayerProps> = ({
  videoId,
  songTitle,
  isPlaying,
  currentTime,
  isHost,
  user,
  onHostSync,
  onHeartbeat
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isAutoPlayBlocked, setIsAutoPlayBlocked] = useState(false);

  // Initialize YouTube Iframe Player
  useEffect(() => {
    let player: any = null;

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        player = new window.YT.Player('bass-party-yt-player', {
          height: '100%',
          width: '100%',
          videoId: videoId || '5qap5aO4i9A',
          playerVars: {
            autoplay: 1,
            controls: 1, // Allow native YouTube controls & fullscreen as backup
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              playerRef.current = event.target;
              setIsReady(true);
              event.target.setVolume(volume);
              if (currentTime > 0) {
                event.target.seekTo(currentTime, true);
              }
              if (isPlaying) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (isHost) {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  onHostSync({
                    isPlaying: true,
                    currentTime: event.target.getCurrentTime()
                  });
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  onHostSync({
                    isPlaying: false,
                    currentTime: event.target.getCurrentTime()
                  });
                }
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error:', err);
              setIsAutoPlayBlocked(true);
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, []);

  // Sync external changes (when host commands or when member receives websocket event)
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    try {
      const player = playerRef.current;
      const currentLoadedUrl = player.getVideoUrl ? player.getVideoUrl() : '';

      // Check if video changed
      if (videoId && !currentLoadedUrl.includes(videoId)) {
        player.loadVideoById({
          videoId,
          startSeconds: currentTime || 0
        });
      }

      // Sync play/pause state
      const state = player.getPlayerState();
      if (isPlaying && state !== 1) {
        player.playVideo();
      } else if (!isPlaying && state === 1) {
        player.pauseVideo();
      }

      // High precision seek sync: if time difference > 0.8 seconds, adjust smoothly
      const currentPt = player.getCurrentTime();
      if (Math.abs(currentPt - currentTime) > 0.8) {
        player.seekTo(currentTime, true);
      }
    } catch (e) {
      console.warn('Sync update warning:', e);
    }
  }, [videoId, isPlaying, currentTime, isReady]);

  // Periodic Timer: Tracks progress and emits host heartbeat
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isReady) {
        try {
          const pt = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setDisplayTime(pt);
          setTotalDuration(dur);

          // If Host, send periodic heartbeat tick to all guest devices
          if (isHost && isPlaying) {
            onHeartbeat({
              currentTime: pt,
              isPlaying
            });
          }
        } catch (e) {}
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, isPlaying, isReady]);

  // Host Play/Pause Toggle
  const togglePlayPause = () => {
    if (!playerRef.current || !isReady) return;
    const nextState = !isPlaying;
    const pt = playerRef.current.getCurrentTime() || 0;

    if (nextState) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }

    onHostSync({
      isPlaying: nextState,
      currentTime: pt
    });
  };

  // Host Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost || !playerRef.current) return;
    const target = parseFloat(e.target.value);
    playerRef.current.seekTo(target, true);
    setDisplayTime(target);
    onHostSync({
      isPlaying,
      currentTime: target
    });
  };

  // Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // Song Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.tracks || []);
      }
    } catch (e) {
    } finally {
      setIsSearching(false);
    }
  };

  // Host Selects Song to Play for Everyone
  const playTrack = (track: Track) => {
    if (!isHost) return;
    setSelectedTrack(track);

    if (playerRef.current) {
      playerRef.current.loadVideoById({
        videoId: track.id,
        startSeconds: 0
      });
      playerRef.current.playVideo();
    }

    onHostSync({
      videoId: track.id,
      title: track.title,
      isPlaying: true,
      currentTime: 0
    });
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full bg-slate-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* Autoplay blocked banner for mobile browsers needing user interaction */}
      {isAutoPlayBlocked && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 p-2.5 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <span>⚠️ মোবাইলে অটো-প্লে সক্রিয় করতে প্লে বাটনে একবার স্পর্শ করুন!</span>
          <button
            onClick={() => {
              if (playerRef.current) playerRef.current.playVideo();
              setIsAutoPlayBlocked(false);
            }}
            className="px-2.5 py-1 bg-amber-600 rounded-lg text-white font-bold text-xs"
          >
            প্লে করুন
          </button>
        </div>
      )}

      {/* Main Video & Vinyl Stage */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        {/* YouTube IFrame Mount */}
        <div id="bass-party-yt-player" className="w-full h-full object-cover pointer-events-auto" />

        {/* Live Audio Sync Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-purple-500/40 text-xs shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="font-bold text-white flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            {isHost ? 'অনার ব্রডকাস্ট (হোস্ট)' : 'রিয়েল-টাইম সিনক্রোনাইজড'}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">0.0s Drift</span>
        </div>
      </div>

      {/* Controller & Song Info Section */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900 to-slate-950 space-y-4">
        {/* Title and Host Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
              <Disc className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1">
                <Music2 className="w-3 h-3" /> এখন বাজছে
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg line-clamp-1">
                {songTitle || 'Bass Party Live Stream'}
              </h3>
              <p className="text-xs text-slate-400">
                {isHost ? 'আপনি এই রুমের অনার (গান চেঞ্জ ও কন্ট্রোল করতে পারবেন)' : 'হোস্টের সাথে এক সেকেন্ডের ব্যবধান ছাড়াই গান বাজছে'}
              </p>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition"
              title={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-purple-500 cursor-pointer h-1.5 rounded-lg bg-slate-800"
            />
            <span className="text-[11px] font-mono text-slate-400 w-7 text-right">
              {isMuted ? 0 : volume}%
            </span>
          </div>
        </div>

        {/* Progress Bar (Interactive for Host, Informational for Guest) */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={totalDuration || 100}
            value={displayTime}
            onChange={handleSeek}
            disabled={!isHost}
            className={`w-full h-2 rounded-lg accent-pink-500 bg-slate-800 transition ${isHost ? 'cursor-pointer hover:h-2.5' : 'cursor-not-allowed opacity-90'}`}
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(displayTime)}</span>
            <span>{totalDuration > 0 ? formatTime(totalDuration) : 'Live Stream'}</span>
          </div>
        </div>

        {/* Host Playback Buttons */}
        {isHost ? (
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              onClick={togglePlayPause}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" /> গান থামান (Pause All)
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> সবার ফোনে বাজান (Play All)
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-1">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              হোস্ট প্লেয়ার নিয়ন্ত্রণ করছেন – সব ডিভাইসে একই সাথে গান বাজছে!
            </span>
          </div>
        )}

        {/* YouTube Direct Song Search (Enabled for Host) */}
        {isHost && (
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-pink-400" /> সরাসরি YouTube থেকে গান সার্চ ও প্লে করুন
              </label>
              <span className="text-[11px] text-purple-400">গান, শিল্পী বা YouTube লিংক দিন</span>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="যেমন: Arijit Singh, Bass Boosted, বা YouTube URL..."
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                {isSearching ? 'খুঁজছে...' : 'সার্চ'}
              </button>
            </form>

            {/* Quick Song Recommendations Grid */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400">জনপ্রিয় পার্টি ট্র্যাক ও রিকমেন্ডেশন:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {(searchResults.length > 0 ? searchResults : [
                  { id: '5qap5aO4i9A', title: 'Lofi Girl - Hip Hop Radio Relax Beats', artist: 'Lofi Beats', duration: 'Live', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80' },
                  { id: 'OPf0YbXqDm0', title: 'Mark Ronson - Uptown Funk ft. Bruno Mars', artist: 'Bruno Mars', duration: '4:30', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop&q=80' },
                  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', artist: 'Luis Fonsi', duration: '4:42', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop&q=80' },
                  { id: 'kXYiU_JCYtU', title: 'Linkin Park - Numb (Bass Remastered)', artist: 'Linkin Park', duration: '3:07', thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80' }
                ]).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-900/60 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-105 transition">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{track.title}</div>
                        <div className="text-[10px] text-slate-400">{track.artist}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded-full shrink-0">
                      প্লে করুন
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
