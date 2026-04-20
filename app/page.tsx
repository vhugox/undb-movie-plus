"use client";

import { useState, useEffect, FormEvent } from "react";

const TMDB_API_KEY = "f78fe0ddcfa145e6215263de420949e8";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const OMDB_API_KEY = "demo"; 

export default function Home() {
  // Adicionado <any[]> para o TypeScript não reclamar das listas
  const [movies, setMovies] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genres, setGenres] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<any>("popular");
  
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=pt-BR`)
      .then(res => {
        if (!res.ok) throw new Error("Falha no TMDB (Gêneros)");
        return res.json();
      })
      .then(data => setGenres(data.genres || []))
      .catch(err => setErrorMsg("Erro de Conexão: " + err.message));

    loadPopularMovies();
  }, []);

  // Adicionado : string no parâmetro url
  const fetchMovies = async (url: string) => {
    try {
      setErrorMsg(""); 
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha no TMDB (Status: ${res.status})`);
      const data = await res.json();
      setMovies(data.results || []);
      
      if (data.results && data.results.length === 0) {
        setErrorMsg("A busca não retornou nenhum filme.");
      }
    } catch (error: any) {
      console.error("Erro ao carregar filmes:", error);
      setErrorMsg("Erro ao buscar filmes: " + error.message);
    }
  };

  const loadPopularMovies = () => {
    setActiveFilter("popular");
    setSearchTerm("");
    fetchMovies(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`);
  };

  const loadNowPlayingMovies = () => {
    setActiveFilter("now_playing");
    setSearchTerm("");
    fetchMovies(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`);
  };

  // Adicionado : any no id
  const filterByGenre = (id: any) => {
    setActiveFilter(id);
    setSearchTerm("");
    fetchMovies(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${id}&language=pt-BR`);
  };

  // Adicionado : FormEvent no evento
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveFilter("search");
      fetchMovies(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${searchTerm}&language=pt-BR`);
    }
  };

  // Adicionado : any no movie
  const toggleFavorite = (movie: any) => {
    const isFavorite = favorites.find(f => f.id === movie.id);
    if (isFavorite) {
      setFavorites(favorites.filter(m => m.id !== movie.id));
    } else {
      setFavorites([...favorites, movie]);
    }
  };

  // Adicionado : any no id
  const openMovieDetails = async (id: any) => {
    setIsLoadingDetails(true);
    try {
      const resTMDB = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,similar`);
      const dataTMDB = await resTMDB.json();

      if (dataTMDB.imdb_id) {
        try {
          const resOMDB = await fetch(`https://www.omdbapi.com/?i=${dataTMDB.imdb_id}&apikey=${OMDB_API_KEY}`);
          const dataOMDB = await resOMDB.json();
          if (dataOMDB.Ratings) {
            const rottenRating = dataOMDB.Ratings.find((r: any) => r.Source === "Rotten Tomatoes");
            if (rottenRating) dataTMDB.rotten_tomatoes_score = rottenRating.Value;
          }
        } catch (e) {
           console.log("Erro no OMDb ignorado para não quebrar a tela");
        }
      }

      setSelectedMovie(dataTMDB);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes completos:", error);
      setErrorMsg("Erro ao abrir detalhes: " + error.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Adicionado : any no crew
  const getDirector = (crew: any) => {
    if (!crew) return "Desconhecido";
    const director = crew.find((member: any) => member.job === "Director");
    return director ? director.name : "Desconhecido";
  };

  // Adicionado : any nos props
  const PosterFallback = ({ path, title, className }: any) => {
    if (path) {
      return <img src={IMG_URL + path} alt={title} className={className} />;
    }
    return (
      <div className={`bg-slate-800 flex items-center justify-center p-2 text-center border border-slate-700 ${className}`}>
        <span className="text-slate-500 font-bold text-[10px] uppercase">Sem Pôster</span>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-8">
          UNDB Movie Plus
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Pesquisar filmes..."
            className="flex-1 bg-slate-800 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-bold transition shadow-lg shadow-blue-900/20">
            Buscar
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          <button 
            onClick={loadNowPlayingMovies}
            className={`px-5 py-2 rounded-full whitespace-nowrap transition-all font-bold ${activeFilter === 'now_playing' ? 'bg-green-600 shadow-lg shadow-green-900/40 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            🎬 No Cinema
          </button>
          
          <button 
            onClick={loadPopularMovies}
            className={`px-5 py-2 rounded-full whitespace-nowrap transition-all ${activeFilter === 'popular' ? 'bg-blue-600 shadow-lg shadow-blue-900/40' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            🔥 Populares
          </button>

          {genres.map(g => (
            <button 
              key={g.id} 
              onClick={() => filterByGenre(g.id)}
              className={`px-5 py-2 rounded-full whitespace-nowrap transition-all ${activeFilter === g.id ? 'bg-blue-600 shadow-lg shadow-blue-900/40' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </header>

      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-8 bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl text-center font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <section className="lg:col-span-3">
          {isLoadingDetails && (
            <div className="fixed top-0 left-0 w-full bg-blue-600 text-center py-1 text-xs font-bold z-50 animate-pulse">
              Carregando detalhes do filme...
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map(movie => {
              const isFav = favorites.find(f => f.id === movie.id);
              return (
                <div key={movie.id} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:translate-y-[-5px] transition-all border border-slate-700/50">
                  <div className="relative cursor-pointer" onClick={() => openMovieDetails(movie.id)}>
                    <PosterFallback path={movie.poster_path} title={movie.title} className="w-full h-[320px] object-cover" />
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(movie); }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 ${isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500'}`}
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>
                    {activeFilter === 'now_playing' && (
                       <span className="absolute bottom-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded">EM CARTAZ</span>
                    )}
                  </div>
                  <div className="p-4 cursor-pointer" onClick={() => openMovieDetails(movie.id)}>
                    <h3 className="font-bold truncate text-sm mb-1">{movie.title}</h3>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{movie.release_date?.split("-")[0]}</span>
                      <span className="text-yellow-400 font-bold">★ {movie.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="bg-slate-800/40 p-6 rounded-3xl h-fit sticky top-8 border border-slate-700/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            ⭐ Minha Lista <span className="text-sm bg-blue-600 px-2 py-0.5 rounded-full">{favorites.length}</span>
          </h2>
          {favorites.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm italic">Sua lista está vazia.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {favorites.map(m => (
                <div key={m.id} className="flex gap-3 items-center group animate-in fade-in slide-in-from-right-4">
                  <PosterFallback path={m.poster_path} title={m.title} className="w-12 h-16 rounded-lg object-cover shadow-md cursor-pointer" onClick={() => openMovieDetails(m.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-tight cursor-pointer hover:text-blue-400" onClick={() => openMovieDetails(m.id)}>{m.title}</p>
                    <button onClick={() => toggleFavorite(m)} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider mt-1">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {selectedMovie && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 md:p-4 z-50 transition-all">
          <div className="bg-slate-800 max-w-5xl w-full rounded-[2rem] overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-slate-700 max-h-[95vh] md:max-h-[90vh]">
            <button 
              onClick={() => setSelectedMovie(null)} 
              className="absolute top-5 right-5 w-10 h-10 bg-black/40 hover:bg-red-500 flex items-center justify-center rounded-full transition-colors z-20 text-white"
            >
              ✕
            </button>
            <div className="w-full md:w-2/5 shrink-0 relative">
              <PosterFallback path={selectedMovie.poster_path} title={selectedMovie.title} className="w-full h-[300px] md:h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent md:bg-gradient-to-r"></div>
            </div>
            
            <div className="p-6 md:p-10 flex flex-col w-full overflow-y-auto">
              <h2 className="text-3xl md:text-4xl font-black mb-2 leading-tight pr-8">{selectedMovie.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mb-6 text-xs md:text-sm">
                <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg border border-yellow-500/20">
                  <span className="font-bold">★ {selectedMovie.vote_average?.toFixed(1)}</span>
                </div>
                {selectedMovie.rotten_tomatoes_score && (
                  <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded-lg border border-red-500/20">
                    <span className="font-bold">🍅 {selectedMovie.rotten_tomatoes_score}</span>
                  </div>
                )}
                <span className="bg-slate-700 px-2 py-1 rounded-lg text-slate-300">{selectedMovie.release_date?.split("-")[0]}</span>
                <span className="text-slate-400 font-medium">Dirigido por: <span className="text-white">{getDirector(selectedMovie.credits?.crew)}</span></span>
              </div>

              {selectedMovie.credits?.cast?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3 text-blue-400 uppercase text-[10px] tracking-[0.2em]">Elenco Principal</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {selectedMovie.credits.cast.slice(0, 6).map((actor: any) => (
                      <div key={actor.id} className="flex-shrink-0 w-[70px] text-center">
                        <div className="w-14 h-14 mx-auto mb-2 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                          {actor.profile_path ? (
                            <img src={IMG_URL + actor.profile_path} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-slate-500">S/FOTO</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-200 leading-tight truncate">{actor.name}</p>
                        <p className="text-[8px] text-slate-500 leading-tight truncate mt-0.5">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="font-bold mb-2 text-blue-400 uppercase text-[10px] tracking-[0.2em]">Sinopse</h3>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base mb-8">
                {selectedMovie.overview || "Infelizmente, a sinopse deste filme ainda não está disponível."}
              </p>
              
              {selectedMovie.similar?.results?.length > 0 && (
                <div className="mt-auto pt-6 border-t border-slate-700">
                  <h3 className="font-bold mb-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">Filmes Parecidos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {selectedMovie.similar.results.slice(0, 4).map((similar: any) => (
                      <div key={similar.id} className="cursor-pointer group" onClick={() => openMovieDetails(similar.id)}>
                        <div className="overflow-hidden rounded-lg mb-2 h-28 relative">
                          <PosterFallback path={similar.poster_path} title={similar.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 absolute inset-0" />
                        </div>
                        <p className="text-[10px] font-bold truncate text-slate-300 group-hover:text-blue-400 transition-colors">{similar.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}