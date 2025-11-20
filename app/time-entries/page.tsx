"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TimeEntry {
  id: string;
  project: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  cost: number;
  hourlyRate: number;
}

interface Project {
  name: string;
  hourlyRate: number;
}

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    duration: 0,
  });

  useEffect(() => {
    loadEntries();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/time-entries");
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("Failed to load entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    try {
      const response = await fetch("/api/time-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEntry.id, ...formData }),
      });
      if (response.ok) {
        setEditingEntry(null);
        await loadEntries();
      } else {
        alert("Ошибка при сохранении");
      }
    } catch (error) {
      console.error("Failed to update entry:", error);
      alert("Ошибка при обновлении записи");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить эту запись?")) return;
    try {
      const response = await fetch(`/api/time-entries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadEntries();
      } else {
        alert("Ошибка при удалении");
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
      alert("Ошибка при удалении записи");
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    const updated = { ...formData, [field]: value };
    if (updated.startTime && updated.endTime) {
      updated.duration = calculateDuration(updated.startTime, updated.endTime);
    }
    setFormData(updated);
  };

  const handleExport = (projectName: string) => {
    const url = `/api/export?project=${encodeURIComponent(projectName)}`;
    window.open(url, "_blank");
  };

  const filteredEntries = selectedProject
    ? entries.filter((e) => e.project === selectedProject)
    : entries;

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalCost = filteredEntries.reduce((sum, e) => sum + e.cost, 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Записи времени
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Просмотр и редактирование всех записей
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            На главную
          </Link>
        </div>

        {/* Filters and Stats */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Фильтр по проекту
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none transition min-w-[200px]"
              >
                <option value="">Все проекты</option>
                {projects.map((project) => (
                  <option key={project.name} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedProject && (
              <button
                onClick={() => handleExport(selectedProject)}
                className="mt-6 px-6 py-2 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Экспорт {selectedProject}
              </button>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Всего записей: {filteredEntries.length}
            </div>
            <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              {totalHours.toFixed(2)} ч / {totalCost.toFixed(2)} €
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Проект
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Дата
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Начало
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Конец
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Часы
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Ставка (€/ч)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                      Стоимость (€)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {entry.project}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.startTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.endTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {entry.duration.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {entry.hourlyRate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {entry.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 font-medium rounded-lg transition-all hover:scale-105"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium rounded-lg transition-all hover:scale-105"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEntries.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {selectedProject
                  ? `Нет записей для проекта "${selectedProject}"`
                  : "Нет записей времени за этот месяц"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all border border-indigo-200/50 dark:border-indigo-800/50">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Редактировать запись</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                <input
                  type="text"
                  value={editingEntry.project}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange("startTime", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время окончания
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange("endTime", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Длительность (часов)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Ставка:</span>
                  <span className="font-medium">{editingEntry.hourlyRate.toFixed(2)} €/ч</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Стоимость:</span>
                  <span className="font-medium">
                    {(formData.duration * editingEntry.hourlyRate).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
