"use client";

import ManualTimeEntry from "@/components/ManualTimeEntry";
import ProjectManager from "@/components/ProjectManager";
import ProjectSelector from "@/components/ProjectSelector";
import Timer from "@/components/Timer";
import Link from "next/link";
import { useEffect, useState } from "react";

interface TimerData {
  timerId: string;
  project: string;
}

export default function Home() {
  const [timers, setTimers] = useState<TimerData[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTimers();
  }, []);

  const loadTimers = async () => {
    try {
      const response = await fetch("/api/timers");
      if (response.ok) {
        const data = await response.json();
        setTimers(
          data.timers.map((t: any) => ({
            timerId: t.timerId,
            project: t.project,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading timers:", error);
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
    setTimers(timers.filter((t) => t.timerId !== timerId));
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl w-full mx-auto relative z-10">
        {/* Заголовок */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Тайм-Трекинг
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Отслеживайте время работы над проектами
          </p>
        </div>

        {/* Кнопки добавления */}
        <div className="mb-10 flex justify-center gap-3 flex-wrap max-w-5xl mx-auto">
          <button
            onClick={() => setShowProjectSelector(true)}
            className="px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Добавить таймер
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className="px-6 py-3 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить запись вручную
          </button>
          <button
            onClick={() => setShowProjectManager(true)}
            className="px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Управление проектами
          </button>
          <Link
            href="/time-entries"
            className="px-6 py-3 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Редактировать записи
          </Link>
        </div>

        {/* Модальное окно выбора проекта */}
        {showProjectSelector && (
          <div className="fixed inset-0 bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-indigo-200/50 dark:border-indigo-800/50 max-w-md w-full animate-slide-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Выберите проект</h2>
                <button
                  onClick={() => setShowProjectSelector(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <ProjectSelector selectedProject={null} onProjectSelect={handleProjectSelect} />
            </div>
          </div>
        )}

        {/* Модальное окно для ручного добавления записи */}
        {showManualEntry && (
          <ManualTimeEntry onClose={() => setShowManualEntry(false)} onSaved={handleTimeSaved} />
        )}

        {showProjectManager && (
          <ProjectManager
            onClose={() => setShowProjectManager(false)}
            onProjectCreated={(name) => {
              // optionally auto-add timer for newly created project? currently just close manager
              console.log("Project created:", name);
            }}
          />
        )}

        {/* Сетка таймеров */}
        {timers.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="mb-6 inline-block p-4 bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl">
                <svg
                  className="w-16 h-16 text-indigo-500 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xl font-medium mb-2">
                Нет активных таймеров
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Нажмите "Добавить таймер" чтобы начать
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Автосохранение в data/time-tracking-{new Date().getFullYear()}-
              {String(new Date().getMonth() + 1).padStart(2, "0")}.xlsx
            </span>
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
