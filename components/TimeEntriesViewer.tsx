'use client';

import { useState, useEffect } from 'react';

interface TimeEntry {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  project: string;
}

interface TimeEntriesViewerProps {
  onClose: () => void;
}

export default function TimeEntriesViewer({ onClose }: TimeEntriesViewerProps) {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadEntries(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
      if (data.projects && data.projects.length > 0) {
        setSelectedProject(data.projects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setError('Не удалось загрузить проекты');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntries = async (project: string) => {
    try {
      setIsLoadingEntries(true);
      setError('');
      const response = await fetch(`/api/time-entries?project=${encodeURIComponent(project)}`);
      if (!response.ok) {
        throw new Error('Failed to load entries');
      }
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Failed to load entries:', error);
      setError('Не удалось загрузить записи');
      setEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const calculateTotalHours = () => {
    return entries.reduce((sum, entry) => sum + entry.duration, 0).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 max-w-4xl w-full animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Записи времени</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Нет проектов</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Проект</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none transition-all"
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Entries Loading */}
            {isLoadingEntries ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">Нет записей для этого проекта</p>
              </div>
            ) : (
              <>
                {/* Total Hours */}
                <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                      Всего часов:
                    </span>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {calculateTotalHours()} ч
                    </span>
                  </div>
                </div>

                {/* Entries Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Дата</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Начало</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Окончание</th>
                        <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Часы</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm">{entry.date}</td>
                          <td className="py-3 px-4 text-sm">{entry.startTime}</td>
                          <td className="py-3 px-4 text-sm">{entry.endTime}</td>
                          <td className="py-3 px-4 text-sm text-right font-semibold text-indigo-600 dark:text-indigo-400">
                            {entry.duration.toFixed(2)} ч
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Close Button */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
