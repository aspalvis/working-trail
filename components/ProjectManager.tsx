"use client";

import { useEffect, useState } from "react";

interface ProjectWithRate {
  name: string;
  hourlyRate: number;
}

interface ProjectManagerProps {
  onClose: () => void;
  onProjectCreated?: (projectName: string) => void;
}

export default function ProjectManager({ onClose, onProjectCreated }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectWithRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("0");
  const [savingNew, setSavingNew] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithRate | null>(null);
  const [editRate, setEditRate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [refreshKey]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось загрузить проекты");
      }
      setProjects(data.projects || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      setError("Введите название проекта");
      return;
    }
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setError("Некорректная ставка (>=0)");
      return;
    }
    try {
      setSavingNew(true);
      setError("");
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: name, hourlyRate: rateNum }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка создания проекта");
      }
      setNewName("");
      setNewRate("0");
      setRefreshKey((k) => k + 1);
      onProjectCreated?.(name);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingNew(false);
    }
  };

  const beginEdit = (p: ProjectWithRate) => {
    setEditingProject(p);
    setEditRate(p.hourlyRate.toString());
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setEditRate("");
  };

  const saveEdit = async () => {
    if (!editingProject) return;
    const rateNum = parseFloat(editRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setError("Некорректная ставка");
      return;
    }
    try {
      setSavingEdit(true);
      setError("");
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: editingProject.name, hourlyRate: rateNum }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка обновления ставки");
      }
      setEditingProject(null);
      setEditRate("");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-200/50 dark:border-indigo-800/50 max-w-3xl w-full animate-slide-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 md:p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Управление проектами</h2>
            <button
              onClick={onClose}
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

          {/* Create form */}
          <div className="mb-8 p-5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-900/10">
            <h3 className="font-semibold mb-4 text-indigo-700 dark:text-indigo-300">
              Создать новый проект
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Название"
                className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none transition"
                disabled={savingNew}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Ставка €/ч"
                className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none transition"
                disabled={savingNew}
              />
              <button
                onClick={handleCreate}
                disabled={savingNew}
                className="p-3 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
              >
                {savingNew ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Загрузка...
              </div>
            ) : projects.length === 0 ? (
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400">Нет проектов</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Создайте первый проект выше
                </p>
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.name}
                  className="group p-4 rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                        <span>{p.name}</span>
                        {editingProject?.name === p.name && (
                          <span className="text-xs px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            Редактирование
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Текущая ставка: {p.hourlyRate.toFixed(2)} €/ч
                      </div>
                    </div>
                    {editingProject?.name === p.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="p-2 w-32 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg dark:bg-indigo-950 text-sm focus:border-indigo-500 outline-none"
                          disabled={savingEdit}
                        />
                        <button
                          onClick={saveEdit}
                          disabled={savingEdit}
                          className="px-4 py-2 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
                        >
                          {savingEdit ? "Сохранение..." : "Сохранить"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const url = `/api/export?project=${encodeURIComponent(p.name)}`;
                            window.open(url, "_blank");
                          }}
                          className="px-4 py-2 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-semibold shadow hover:shadow-lg transition flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Экспорт
                        </button>
                        <button
                          onClick={() => beginEdit(p)}
                          className="px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-semibold shadow hover:shadow-lg transition"
                        >
                          Изменить ставку (€)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
