'use client';

import { useState, useEffect } from 'react';
import ProjectSelector from '@/components/ProjectSelector';
import Timer from '@/components/Timer';
import ManualTimeEntry from '@/components/ManualTimeEntry';
import TimeEntriesViewer from '@/components/TimeEntriesViewer';

interface TimerData {
  timerId: string;
  project: string;
}

export default function Home() {
  const [timers, setTimers] = useState<TimerData[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showEntriesViewer, setShowEntriesViewer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTimers();
  }, []);

  const loadTimers = async () => {
    try {
      const response = await fetch('/api/timers');
      if (response.ok) {
        const data = await response.json();
        setTimers(data.timers.map((t: any) => ({
          timerId: t.timerId,
          project: t.project
        })));
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const handleProjectSelect = (project: string) => {
    const timerId = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTimers([...timers, { timerId, project }]);
    setShowProjectSelector(false);
  };

  const handleTimeSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteTimer = (timerId: string) => {
    setTimers(timers.filter(t => t.timerId !== timerId));
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl w-full mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Тайм-Трекинг
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Отслеживайте время работы над проектами</p>
        </div>

        {/* Кнопки добавления */}
        <div className="mb-6 flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setShowProjectSelector(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Добавить таймер
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить запись вручную
          </button>
          <button
            onClick={() => setShowEntriesViewer(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Просмотр записей
          </button>
        </div>

        {/* Модальное окно выбора проекта */}
        {showProjectSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 max-w-md w-full animate-slide-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Выберите проект</h2>
                <button
                  onClick={() => setShowProjectSelector(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ProjectSelector
                selectedProject={null}
                onProjectSelect={handleProjectSelect}
              />
            </div>
          </div>
        )}

        {/* Модальное окно для ручного добавления записи */}
        {showManualEntry && (
          <ManualTimeEntry
            onClose={() => setShowManualEntry(false)}
            onSaved={handleTimeSaved}
          />
        )}

        {/* Модальное окно для просмотра записей */}
        {showEntriesViewer && (
          <TimeEntriesViewer
            onClose={() => setShowEntriesViewer(false)}
          />
        )}

        {/* Сетка таймеров */}
        {timers.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Нет активных таймеров. Добавьте первый!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timers.map((timer) => (
              <div key={timer.timerId} className="animate-slide-in">
                <Timer
                  timerId={timer.timerId}
                  project={timer.project}
                  onTimeSaved={handleTimeSaved}
                  onDelete={() => handleDeleteTimer(timer.timerId)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Информация внизу */}
        <div className="mt-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur rounded-full text-sm text-gray-600 dark:text-gray-400 shadow-sm">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Автосохранение в data/time-tracking-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}.xlsx</span>
          </div>
        </div>
      </div>

      {/* Анимации */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
