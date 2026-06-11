import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HelpCircle } from 'lucide-react'; // Импорт иконки для плавающей кнопки

// Импорт компонентов
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuestCard from './components/QuestCard';
import AuthModal from './components/AuthModal';
import QuestMatcher from './components/QuestMatcher';
import QuestDetails from './components/QuestDetails';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import BookingForm from './components/BookingForm';
import ContactModal from './components/ContactModal'; // Импорт модального окна контактов


function App() {
  // --- СОСТОЯНИЯ ФИЛЬТРАЦИИ И ПОИСКА ---
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeFilters, setActiveFilters] = useState({
    genres: [],
    players: [],
    difficulty: [],
    fear: [],
    age: []
  });

  // --- ОБЩИЕ СОСТОЯНИЯ ---
  const [quests, setQuests] = useState([]);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]); // Состояние избранных квестов (хранит ID)
  const [view, setView] = useState('main'); // main, profile, admin
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContact, setShowContact] = useState(false); // Состояние для окна контактов

  // Состояние квиза
  const [showQuiz, setShowQuiz] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });

  // --- СОСТОЯНИЯ ДАННЫХ ---
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [selectedQuestDetails, setSelectedQuestDetails] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState(null); // Состояние количества игроков и динамической цены
  const [activeQuestSlots, setActiveQuestSlots] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [myFavorites, setMyFavorites] = useState([]); // Состояние для хранения полных объектов квестов
  const [myWaitlist, setMyWaitlist] = useState([]); // Состояние листа ожидания
  const [allBookings, setAllBookings] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Состояние для списка всех пользователей (Админ)
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(null); // Храним данные слота

  // --- ЗАГРУЗКА ПРИ СТАРТЕ ---
  useEffect(() => {
    fetchInitialData();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      if (parsed.role === 'admin') setView('admin');
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get('/api/quests');
      setQuests(res.data);
    } catch (e) { 
      console.error("Ошибка загрузки:", e); 
    }
  };

  // --- ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ / АДМИНА ---
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') loadAdminData();
      else loadUserData();
    }
  }, [user?.role]); // Реагируем на изменение роли, чтобы не зацикливать при обновлении профиля

  // ФУНКЦИЯ ЗАГРУЗКИ ИЗБРАННОГО
  const loadFavorites = async () => {
    const token = localStorage.getItem('token');
    
    // Если токена нет, просто очищаем избранное (актуально при выходе из аккаунта)
    if (!token) {
      setFavorites([]);
      return;
    }

    try {
      // Отправляем запрос с токеном
      const res = await axios.get('/api/user/favorites', { 
        headers: { token: token } 
      });

      // Проверяем, что пришел массив, и сохраняем только ID квестов
      if (Array.isArray(res.data)) {
        setFavorites(res.data.map(f => f.id));
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.error("Ошибка загрузки избранного:", e);
      // Если токен протух (401/403), лучше очистить его, чтобы не было вечных ошибок
      if (e.response?.status === 401 || e.response?.status === 403) {
        setFavorites([]);
      }
    }
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ: получает свежий профиль, брони, отзывы, избранное и лист ожидания
  const loadUserData = async () => {
    const h = { headers: { token: localStorage.getItem('token') } };
    try {
      // Скачиваем данные пользователя (бонусы и т.д.)
      const userRes = await axios.get('/api/user/me', h);
      setUser(userRes.data);
      localStorage.setItem('user', JSON.stringify(userRes.data)); // Синхронизируем localStorage

      // Скачиваем брони, отзывы, ИЗБРАННОЕ и ЛИСТ ОЖИДАНИЯ в одном параллельном запросе
      const [bRes, rRes, fRes, wRes] = await Promise.all([
        axios.get('/api/user/bookings', h),
        axios.get('/api/user/reviews', h),
        axios.get('/api/user/favorites', h),
        axios.get('/api/user/waitlist', h)
      ]);

      setMyBookings(bRes.data);
      setMyReviews(rRes.data);
      setMyFavorites(fRes.data); // Сохраняем массив объектов квестов
      setMyWaitlist(wRes.data);  // Сохраняем очередь (лист ожидания)
      
      // Дополнительно синхронизируем массив ID для работы иконки-сердечка на главной
      setFavorites(fRes.data.map(f => f.id));
    } catch (e) { 
      console.error("Ошибка загрузки данных пользователя:", e); 
    }
  };

  const loadAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const h = { headers: { token } };
    try {
      const bRes = await axios.get('/api/admin/bookings', h);
      const rRes = await axios.get('/api/admin/reviews', h);
      const uRes = await axios.get('/api/admin/users', h);

      setAllBookings(bRes.data.bookings || []);
      setTotalRevenue(bRes.data.totalRevenue || 0);
      setAllReviews(rRes.data || []);
      setAllUsers(uRes.data || []);
    } catch (e) { 
      console.error("Ошибка загрузки админ-данных:", e); 
    }
  };

  // --- ФУНКЦИЯ КЛИКА ПО СЕРДЦУ (ТОГГЛ ИЗБРАННОГО) ---
  const handleFavorite = async (id) => {
    if (!user) return setShowAuthModal(true);
    try {
      const res = await axios.post('/api/favorites/toggle', { quest_id: id }, { headers: { token: localStorage.getItem('token') } });
      if (res.data.status === 'added') {
        setFavorites([...favorites, id]);
      } else {
        setFavorites(favorites.filter(favId => favId !== id));
      }
      // Перезагружаем пользовательские данные, чтобы обновить список объектов на вкладке профиля
      loadUserData();
    } catch (e) {
      console.error("Ошибка переключения избранного:", e);
    }
  };

  // --- ФУНКЦИЯ ЗАГРУЗКИ ДЕТАЛЕЙ КВЕСТА ---
  const openQuestDetails = async (id) => {
    try {
      const res = await axios.get(`/api/quests/${id}/details`);
      setSelectedQuestDetails(res.data);
    } catch (e) {
      console.error("Ошибка загрузки деталей квеста:", e);
    }
  };

  // --- ФУНКЦИЯ П ПЕРЕКЛЮЧЕНИЯ ФИЛЬТРА ---
  const toggleFilter = (category, value) => {
    setActiveFilters(prev => {
      if (value === 'CLEAR_ALL') return { ...prev, [category]: [] };
      
      const current = prev[category];
      const isSelected = current.includes(value);
      return {
        ...prev,
        [category]: isSelected 
          ? current.filter(v => v !== value) 
          : [...current, value]
      };
    });
  };

  // --- ЛОГИКА БРОНИРОВАНИЯ ---
  const handleSelectQuest = async (id) => {
    setSelectedQuestId(id);
    setSelectedPlayers(null); // Сбрасываем выбранных игроков при смене квеста
    try {
      const sRes = await axios.get(`/api/slots/${id}`);
      const grouped = sRes.data.reduce((acc, slot) => {
        const date = new Date(slot.slot_date).toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'long' 
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
      }, {});
      setActiveQuestSlots(grouped);
      setTimeout(() => document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) { console.error(e); }
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ: теперь принимает объект слота и открывает форму
  const handleBookSlot = (slot) => {
    if (!user) return setShowAuthModal(true);
    if (!selectedPlayers) return alert("Пожалуйста, выберите количество человек!");
    
    // Передаем в форму данные слота, а также выбранное количество человек и цену для корректного расчета на стороне BookingForm
    setShowBookingForm({
      ...slot,
      players_count: selectedPlayers.players,
      initial_price: selectedPlayers.price
    });
  };

  // --- МЕТОД АУТЕНТИФИКАЦИИ С ОБЯЗАТЕЛЬНЫМ СОХРАНЕНИЕМ ТОКЕНА ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await axios.post(endpoint, formData);
      
      // Надежно сохраняем токен в память браузера для любых сценариев (вход и регистрация)
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setShowAuthModal(false);
        
        // Перенаправляем потоки интерфейса и подгружаем данные
        if (res.data.user.role === 'admin') {
          setView('admin');
        } else {
          loadUserData();
          setView('main');
        }
        
        alert(isLogin ? "С возвращением!" : "Регистрация успешна!");
      }
    } catch (err) { 
      alert(err.response?.data || "Ошибка доступа"); 
    }
  };

  // ВОЗВРАЩЕНА К СТАНДАРТНОМУ JSON: принимает имя и URL-строку аватара
  const handleUpdateName = async (name, avatarUrl) => {
    try {
      const res = await axios.patch('/api/user/update', 
        { full_name: name, avatar_url: avatarUrl }, 
        { headers: { token: localStorage.getItem('token') } }
      );
      
      const updated = { 
        ...user, 
        full_name: res.data.full_name, 
        avatar_url: res.data.avatar_url 
      };
      
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      alert("Личность обновлена!");
    } catch (err) { 
      alert(err.response?.data || "Ошибка systems"); 
    }
  };

  // --- СЛОЖНАЯ СИСТЕМНАЯ ФИЛЬТРАЦИЯ МАССИВА КВЕСТОВ ---
  const filteredQuests = quests.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = activeFilters.genres.length === 0 || activeFilters.genres.includes(q.genre);
    
    const matchesPlayers = activeFilters.players.length === 0 || activeFilters.players.some(p => {
        const num = parseInt(p);
        return q.max_players >= num;
    });

    const matchesDiff = activeFilters.difficulty.length === 0 || activeFilters.difficulty.includes(q.difficulty);
    const matchesFear = activeFilters.fear.length === 0 || activeFilters.fear.includes(q.fear_level);
    
    const matchesAge = activeFilters.age.length === 0 || activeFilters.age.some(a => {
        const minAge = parseInt(a);
        return q.min_age <= minAge;
    });

    return matchesSearch && matchesGenre && matchesPlayers && matchesDiff && matchesFear && matchesAge && q.is_active;
  });

  const currentQuest = quests.find(q => q.id === selectedQuestId);

  // --- РЕНДЕР АДМИНКИ ---
  if (user?.role === 'admin' && view === 'admin') {
    return (
      <Admin
        quests={quests}
        allBookings={allBookings}
        allReviews={allReviews}
        allUsers={allUsers}
        totalRevenue={totalRevenue}
        setView={setView} 
        onAction={async (method, url, data) => {
          try {
            await axios({ 
              method, 
              url, 
              data, 
              headers: { token: localStorage.getItem('token') } 
            });
            
            const questsRes = await axios.get('/api/quests');
            setQuests(questsRes.data); 
            loadAdminData(); 
            
            if (method !== 'get') alert("Операция выполнена");
          } catch (e) { 
            alert("Ошибка: " + (e.response?.data || "неизвестная ошибка")); 
          }
        }}
      />
    );
  }

  // --- РЕНДЕР КЛИЕНТА / ГОСТЯ ---
  return (
    <div className="min-h-screen bg-om-bg text-om-white font-sans">
      <Navbar 
        user={user} 
        setView={setView} 
        onLogout={() => { localStorage.clear(); setUser(null); setView('main'); window.location.reload(); }} 
        onAuthClick={() => setShowAuthModal(true)} 
      />

      {view === 'main' && (
        <div className="pb-20 animate-in fade-in duration-1000">
          {/* Hero-секция */}
          <Hero onOpenQuiz={() => setShowQuiz(true)} />

          {/* СЕКЦИЯ КАТАЛОГА С ОБНОВЛЕННОЙ АДАПТИВНОЙ ЦЕНТРОВКОЙ И ШРИФТАМИ */}
          <section className="max-w-7xl mx-auto px-4 md:px-10 mt-20">
            <div className="text-center mb-16">
              <p className="text-om-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-2">Каталог</p>
              <h3 id="quest-catalog" className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tighter uppercase">
                Доступные квесты
              </h3>
              <div className="h-1 w-20 bg-om-accent mx-auto mt-6 rounded-full opacity-50"></div>
            </div>

            {/* Блок фильтров и поиска */}
            <div className="flex flex-col items-center space-y-8 mb-24 animate-in fade-in duration-700">
              {/* Поиск */}
              <div className="relative group w-full max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-om-accent/5 blur-xl group-focus-within:bg-om-accent/10 transition-all rounded-full" />
                <input 
                  type="text" 
                  placeholder="Введите название испытания..." 
                  className="relative w-full bg-om-surface/50 border border-white/5 p-5 pl-8 rounded-[2rem] outline-none focus:border-om-accent/50 transition-all text-sm font-medium placeholder:text-gray-600 text-center"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Выпадающие списки */}
              <div className="flex flex-wrap gap-4 justify-center items-center w-full">
                <FilterDropdown 
                  label="Тип" 
                  options={['Классический', 'Экшн', 'Хоррор', 'Перформанс', 'Мистика']} 
                  selectedValues={activeFilters.genres}
                  onToggle={(val) => toggleFilter('genres', val)}
                />
                <FilterDropdown 
                  label="Игроки" 
                  options={['1', '2', '3', '4', '5', '6', '8', '10+']} 
                  selectedValues={activeFilters.players}
                  onToggle={(val) => toggleFilter('players', val)}
                />
                <FilterDropdown 
                  label="Сложность" 
                  options={['Легко', 'Средне', 'Сложно']} 
                  selectedValues={activeFilters.difficulty}
                  onToggle={(val) => toggleFilter('difficulty', val)}
                />
                <FilterDropdown 
                  label="Страх" 
                  options={['Не страшный', 'Немного страшный', 'Страшный', 'Очень страшный']} 
                  selectedValues={activeFilters.fear}
                  onToggle={(val) => toggleFilter('fear', val)}
                />
                <FilterDropdown 
                  label="Возраст" 
                  options={['6+', '10+', '12+', '14+', '16+', '18+']} 
                  selectedValues={activeFilters.age}
                  onToggle={(val) => toggleFilter('age', val)}
                />
                
                {Object.values(activeFilters).some(arr => arr.length > 0) && (
                  <button 
                    onClick={() => setActiveFilters({ genres: [], players: [], difficulty: [], fear: [], age: [] })}
                    className="text-[9px] font-black uppercase tracking-widest text-om-accent hover:text-white transition-colors ml-4 border-b border-om-accent/30 pb-1"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>
            
            {/* СЕТКА КАРТОЧЕК */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuests.map(quest => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  onSelect={openQuestDetails} 
                  onFavorite={handleFavorite}
                  isFavorite={favorites.includes(quest.id)}
                  user={user}
                />
              ))}
            </div>

            {filteredQuests.length === 0 && (
              <p className="text-om-gray text-center text-sm italic mt-12 tracking-wide">
                Испытаний по заданным критериям не обнаружено...
              </p>
            )}
          </section>

          {/* СЕКЦИЯ РАСПИСАНИЯ */}
          {selectedQuestId && currentQuest && (
            <section id="schedule-section" className="max-w-7xl mx-auto px-4 md:px-10 mt-32 animate-in slide-in-from-bottom-10 duration-700">
              <div className="bg-om-surface border border-white/5 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-om-accent/5 blur-[100px]" />
                
                <h4 className="text-xl md:text-2xl font-black uppercase mb-10 italic">
                  Выберите parameters и время: <span className="text-om-accent">{currentQuest.title}</span>
                </h4>

                {/* ВЫБОР КОЛИЧЕСТКА ЧЕЛОВЕК */}
                <div className="mb-10 bg-[#0d0d0d] p-6 md:p-8 border border-white/5 rounded-[2rem] md:rounded-[2.5rem]">
                  <p className="text-[10px] text-om-gray uppercase font-bold mb-4 tracking-widest">Укажите состав команды:</p>
                  <div className="relative w-full max-w-xs">
                    <select 
                      className="w-full bg-om-surface border border-white/10 p-4 rounded-2xl outline-none focus:border-om-accent transition-all text-sm appearance-none cursor-pointer pr-10"
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPlayers(val ? JSON.parse(val) : null);
                      }}
                    >
                      <option value="">Выберите количество человек</option>
                      {currentQuest.price_config?.map((item, i) => (
                        <option key={i} value={JSON.stringify(item)}>
                          Игра для {item.players} человек — {item.price} BYN
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-om-accent text-xs">▼</div>
                  </div>
                </div>
                
                {/* ОТОБРАЖЕНИЕ СЕАНСОВ И ПРЕДУПРЕЖДЕНИЯ С ПОСЛЕ ВЫБОРА КОМАНДЫ */}
                {selectedPlayers ? (
                  <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    
                    {/* ПРЕДУПРЕЖДЕНИЕ О ПРЕДОПЛАТЕ */}
                    <div className="mb-6 p-4 bg-om-accent/5 border-l-2 border-om-accent">
                      <p className="text-[11px] text-white font-light leading-relaxed">
                        <span className="font-bold text-om-accent uppercase">Внимание:</span> Для guarantee участия требуется предоплата <span className="font-bold">20%</span>. 
                        Бонусы «Омены» будут начислены администратором после подтверждения платежа.
                      </p>
                    </div>

                    <p className="text-[10px] text-om-accent uppercase font-bold mb-6 italic">
                      Доступные сеансы для команды из {selectedPlayers.players} чел:
                    </p>

                    {activeQuestSlots && Object.entries(activeQuestSlots).map(([date, slots]) => (
                      <div key={date}>
                        <p className="text-[10px] text-om-gray uppercase tracking-[0.4em] mb-6 border-b border-white/5 pb-2">
                          {date}
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {slots.map(s => (
                            <div key={s.id} className="relative group">
                              <button
                                disabled={s.is_booked}
                                onClick={() => handleBookSlot(s)}
                                className={`px-6 py-3 md:px-8 md:py-4 rounded-2xl border transition-all flex flex-col items-center ${
                                  s.is_booked 
                                    ? 'opacity-40 grayscale cursor-default border-white/5' 
                                    : 'bg-black/40 border-white/10 hover:border-om-accent'
                                }`}
                              >
                                <span className="text-lg md:text-xl font-bold">{s.slot_time.slice(0,5)}</span>
                                <span className="text-[10px] text-om-accent mt-1 uppercase font-bold">{selectedPlayers.price} BYN</span>
                              </button>

                              {s.is_booked && (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation(); // Чтобы не открылось окно квеста
                                    if (!user) return setShowAuthModal(true);
                                    
                                    try {
                                      const token = localStorage.getItem('token');
                                      const res = await axios.post('/api/user/waitlist', 
                                        { 
                                          quest_id: selectedQuestId, 
                                          slot_date: s.slot_date // Отправляем именно slot_date
                                        }, 
                                        { headers: { token: token } }
                                      );
                                      alert(res.data);
                                      loadUserData(); // Обновляем данные кабинета сразу
                                    } catch (err) {
                                      alert(err.response?.data || "Ошибка записи в очередь");
                                    }
                                  }}
                                  className="absolute -top-2 -right-2 bg-om-accent p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                                  title="Записаться в очередь"
                                >
                                  <span className="text-[10px] font-bold text-white px-1">WAITLIST</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded-[2rem] bg-black/10">
                    <p className="text-sm text-om-gray italic">Выберите состав команды выше, чтобы открыть доступное время сеансов.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {view === 'profile' && user && (
        <Profile
          user={user}
          myBookings={myBookings}
          myReviews={myReviews}
          myFavorites={myFavorites}
          myWaitlist={myWaitlist} // Прокидываем состояние очереди в профиль
          onUpdateName={handleUpdateName}
          refreshData={loadUserData}
          onNavigateToBooking={(questId) => {
            setView('main'); // Переключаем на главную
            handleSelectQuest(questId); // Вызываем открытие расписания
          }}
        />
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        isLogin={isLogin} 
        setIsLogin={setIsLogin} 
        formData={formData} 
        setFormData={setFormData} 
        onSubmit={handleAuth} 
      />

      <QuestMatcher 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
        quests={quests} 
        onResultSelect={(id) => {
          // 1. Открываем детали квеста (наша функция handleSelectQuest уже это делает)
          handleSelectQuest(id); 
          // 2. Прокручиваем к расписанию
          setTimeout(() => {
            document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }}
      />

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ КВЕСТА */}
      {selectedQuestDetails && (
        <QuestDetails 
          quest={selectedQuestDetails} 
          onClose={() => setSelectedQuestDetails(null)} 
          onBook={(id) => {
            setSelectedQuestDetails(null); 
            handleSelectQuest(id);         
          }} 
        />
      )}

      {/* МОДАЛЬНОЕ ОКНО ФОРМЫ БРОНИРОВАНИЯ (С ОБНОВЛЕННЫМИ ДАННЫМИ И ПРОВЕРКОЙ НА СЕГОДНЯ) */}
      {showBookingForm && (
        <BookingForm 
          slot={showBookingForm} 
          user={user} // Передаем данные пользователя (имя, почта, бонусы внутри)
          userBonuses={user?.bonuses || 0} // Оставили на случай, если форма всё ещё ждет этот пропс отдельно
          selectedPlayers={selectedPlayers} // Передаем выбранный состав (кол-во, цена)
          onClose={() => setShowBookingForm(null)} 
          onConfirm={async (data) => {
            try {
              // В data уже лежат final_price и deposit_amount, которые посчитала форма
              const res = await axios.post('/api/book-slot', { 
                ...data, 
                slot_id: showBookingForm.id 
              }, {
                headers: { token: localStorage.getItem('token') }
              });

              alert(res.data.message);
              setShowBookingForm(null);
              await loadUserData(); // Перезагружаем данные
              setView('profile');   // Переходим в профиль
            } catch (e) { 
              alert("Ошибка бронирования"); 
            }
          }} 
        />
      )}
        
      <footer className="py-20 border-t border-white/5 opacity-20 text-center text-[10px] uppercase tracking-[1em] font-light">
        Omenum Labs // 2026
      </footer>

      {/* ПЛАВАЮЩАЯ КНОПКА ВОПРОСА */}
      <button 
        onClick={() => setShowContact(true)}
        className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-om-accent text-white rounded-full flex items-center justify-center shadow-[0_0_20px_#E63946] hover:scale-110 active:scale-95 transition-all group"
        title="Задать вопрос"
      >
        <HelpCircle size={28} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* МОДАЛЬНОЕ ОКНО КОНТАКТОВ */}
      <ContactModal 
        isOpen={showContact} 
        onClose={() => setShowContact(false)} 
        user={user} 
      />
    </div>
  );
}

// --- КОМПОНЕНТ ДЛЯ ВЫПАДАЮЩИХ СПИСКОВ ФИЛЬТРАЦИИ ---
const FilterDropdown = ({ label, options, selectedValues, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
          selectedValues.length > 0
            ? 'bg-om-accent border-om-accent text-white'
            : 'bg-om-surface/40 border-white/5 text-om-gray hover:bg-white/5'
        }`}
      >
        {label} {selectedValues.length > 0 && `(${selectedValues.length})`}
        <span className={`text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-full left-0 mt-2 w-56 bg-[#121214] border border-white/5 p-2 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map(opt => {
              const isChecked = selectedValues.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isChecked ? 'bg-om-accent/10 text-om-accent font-bold' : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <span>{opt}</span>
                  {isChecked && <span className="text-[10px]">●</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default App;